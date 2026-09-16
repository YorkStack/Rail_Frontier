import * as THREE from 'three';
import type {BiomeDefinition} from '../world/profiles.js';
import {createTerrainAtlases,TERRAIN_ATLAS_SIZE} from './terrain-textures.js';

const GLSL_HELPERS=`
varying vec3 vTerrainWorld;
varying vec3 vTerrainNormalWorld;
varying vec3 vTerrainMask;
vec2 terrainMirror(vec2 uv){return 1.0-abs(mod(uv,2.0)-1.0);}
float terrainHash(vec2 p){p=fract(p*vec2(.1031,.1030));p+=dot(p,p.yx+33.33);return fract((p.x+p.y)*p.x);}
float terrainMacro(vec2 p){
  vec2 cell=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);
  float a=terrainHash(cell),b=terrainHash(cell+vec2(1,0)),c=terrainHash(cell+vec2(0,1)),d=terrainHash(cell+vec2(1));
  return mix(mix(a,b,f.x),mix(c,d,f.x),f.y);
}
vec2 terrainAtlasUv(float family,vec2 uv){
  vec2 cell=vec2(mod(family,2.0),floor(family/2.0));
  return cell*.5+vec2(.003)+terrainMirror(uv)*.494;
}
vec4 terrainSample(sampler2D atlas,float family,vec2 uv){
  vec4 primary=texture2D(atlas,terrainAtlasUv(family,uv));
  vec2 turned=mat2(.8,-.6,.6,.8)*(uv*1.37)+vec2(17.3,41.7)+family*7.1;
  vec4 secondary=texture2D(atlas,terrainAtlasUv(family,turned));
  float breakup=.28+.44*terrainMacro(uv*.083+family*2.9);
  return mix(primary,secondary,breakup);
}
`;

const MAP_FRAGMENT=`
vec3 terrainN=normalize(vTerrainNormalWorld);
float terrainSteep=smoothstep(.12,.48,1.0-abs(terrainN.y));
float terrainLarge=terrainMacro(vTerrainWorld.xz/430.0);
float terrainPatch=terrainMacro(vTerrainWorld.xz/47.0+19.0);
#ifdef TERRAIN_DESERT
  float terrainSecondary=smoothstep(.24,.72,vTerrainMask.y)*(1.0-terrainSteep)*(.62+.38*terrainPatch);
  float terrainSoil=smoothstep(.08,.5,vTerrainMask.z)*(.78+.22*terrainLarge);
#else
  float terrainSecondary=smoothstep(.16,.68,vTerrainMask.x)*(.76+.24*terrainPatch);
  float terrainSoil=max(smoothstep(.1,.58,vTerrainMask.z),smoothstep(.48,.88,vTerrainMask.y)*(1.0-terrainSteep)*.42);
#endif
vec4 terrainTop=mix(terrainSample(map,0.0,vTerrainWorld.xz/9.0),terrainSample(map,1.0,vTerrainWorld.xz/13.0),terrainSecondary);
terrainTop=mix(terrainTop,terrainSample(map,2.0,vTerrainWorld.xz/7.0),terrainSoil*.48);
vec3 terrainWeights=pow(abs(terrainN),vec3(5.0));
terrainWeights/=max(dot(terrainWeights,vec3(1.0)),.0001);
vec4 terrainRock=terrainSample(map,3.0,vTerrainWorld.zy/18.0)*terrainWeights.x
  +terrainSample(map,3.0,vTerrainWorld.xz/18.0)*terrainWeights.y
  +terrainSample(map,3.0,vTerrainWorld.xy/18.0)*terrainWeights.z;
vec4 terrainSurfaceColor=mix(terrainTop,terrainRock,terrainSteep);
diffuseColor*=terrainSurfaceColor;
`;

const ROUGHNESS_FRAGMENT=`
float roughnessFactor=roughness;
vec4 terrainTopR=mix(terrainSample(roughnessMap,0.0,vTerrainWorld.xz/9.0),terrainSample(roughnessMap,1.0,vTerrainWorld.xz/13.0),terrainSecondary);
terrainTopR=mix(terrainTopR,terrainSample(roughnessMap,2.0,vTerrainWorld.xz/7.0),terrainSoil*.48);
vec4 terrainRockR=terrainSample(roughnessMap,3.0,vTerrainWorld.zy/18.0)*terrainWeights.x
  +terrainSample(roughnessMap,3.0,vTerrainWorld.xz/18.0)*terrainWeights.y
  +terrainSample(roughnessMap,3.0,vTerrainWorld.xy/18.0)*terrainWeights.z;
roughnessFactor*=mix(terrainTopR.g,terrainRockR.g,terrainSteep);
`;

const NORMAL_FRAGMENT=`
#ifdef USE_NORMALMAP_TANGENTSPACE
  float terrainNormalFamily=terrainSteep>.5?3.0:0.0;
  float terrainNormalScale=terrainSteep>.5?18.0:9.0;
  vec3 mapN=terrainSample(normalMap,terrainNormalFamily,vTerrainWorld.xz/terrainNormalScale).xyz*2.0-1.0;
  mapN.xy*=normalScale;
  normal=normalize(tbn*mapN);
#endif
`;

export function createTerrainMaterial(profile:BiomeDefinition):THREE.MeshStandardMaterial {
  const atlases=createTerrainAtlases(profile),desert=profile.id==='southwest';
  const material=new THREE.MeshStandardMaterial({
    vertexColors:true,roughness:.93,metalness:0,
    map:atlases.color,normalMap:atlases.normal,roughnessMap:atlases.roughness,
    normalScale:new THREE.Vector2(.14,.14)
  });
  material.name=`${desert?'arizona':'norway'}-terrain-pbr-v2`;
  material.userData.terrainAtlas={size:TERRAIN_ATLAS_SIZE,families:atlases.families,worldSpace:true,triplanarRock:true};
  material.customProgramCacheKey=()=>`rail-frontier-terrain-v2-${profile.id}`;
  material.onBeforeCompile=shader=>{
    shader.vertexShader=shader.vertexShader
      .replace('void main() {','attribute vec3 terrainMask;\nvarying vec3 vTerrainWorld;\nvarying vec3 vTerrainNormalWorld;\nvarying vec3 vTerrainMask;\nvoid main() {')
      .replace('#include <project_vertex>','#include <project_vertex>\nvTerrainWorld=(modelMatrix*vec4(transformed,1.0)).xyz;\nvTerrainNormalWorld=normalize((modelMatrix*vec4(objectNormal,0.0)).xyz);\nvTerrainMask=terrainMask;');
    shader.fragmentShader=shader.fragmentShader
      .replace('void main() {',`${desert?'#define TERRAIN_DESERT\n':''}${GLSL_HELPERS}\nvoid main() {`)
      .replace('#include <map_fragment>',MAP_FRAGMENT)
      .replace('#include <roughnessmap_fragment>',ROUGHNESS_FRAGMENT)
      .replace('#include <normal_fragment_maps>',NORMAL_FRAGMENT);
  };
  return material;
}
