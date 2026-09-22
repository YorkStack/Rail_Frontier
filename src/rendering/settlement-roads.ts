import {surfaceMaterial} from './settlement-materials.js';
import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import type {Terrain} from '../world/terrain.js';

import type {RoadSurface,VillageRoad} from '../world/village-road-seeds.js';
export {villageRoadSeeds,streetEra} from '../world/village-road-seeds.js';
export function roadMaterial(surface:RoadSurface,southwest=false):THREE.MeshStandardMaterial {
 const material=surfaceMaterial(surface,southwest);material.transparent=true;material.polygonOffset=true;material.polygonOffsetFactor=-2;material.polygonOffsetUnits=-2;
 material.onBeforeCompile=shader=>{
  shader.vertexShader=shader.vertexShader.replace('void main() {','varying vec2 roadUV;\nvoid main() {\nroadUV=uv;');
  shader.fragmentShader=shader.fragmentShader.replace('void main() {','varying vec2 roadUV;uniform float roadWidth;\nvoid main() {');
  shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>','#include <map_fragment>\ndiffuseColor.a*=smoothstep(0.,.22,roadUV.x)*smoothstep(0.,.22,roadWidth-roadUV.x);');shader.uniforms.roadWidth={value:material.userData.width};
 };
 material.customProgramCacheKey=()=>`road-tile-${surface}`;return material;
}
/** Checked polylines are sampled without a spline that could cut obstacle corners. */
export function createVillageRoads(terrain:Terrain,roads:readonly VillageRoad[],southwest=false):THREE.Group {
 const group=new THREE.Group();group.name='village-roads';const batches=new Map<string,{surface:RoadSurface;width:number;geometries:THREE.BufferGeometry[]}>();
 for(const road of roads){
  if(road.points.length<2)continue;
  const positions:number[]=[],uv:number[]=[],indices:number[]=[];let distance=0;
  const vertex=(x:number,z:number,u:number,v:number)=>{positions.push(x,terrain.sample(Math.max(0,Math.min(terrain.widthM,x)),Math.max(0,Math.min(terrain.depthM,z))).elevationM+.16,z);uv.push(u,v);return positions.length/3-1;};
  for(let j=1;j<road.points.length;j++){
   const a=road.points[j-1]!,b=road.points[j]!,length=Math.hypot(b.x-a.x,b.z-a.z);if(length<.001)continue;
   const dx=(b.x-a.x)/length,dz=(b.z-a.z)/length,steps=Math.max(1,Math.ceil(length/1.5)),base=positions.length/3;
   for(let i=0;i<=steps;i++){for(const side of [-1,1])vertex(a.x+(b.x-a.x)*i/steps-dz*road.width*.5*side,a.z+(b.z-a.z)*i/steps+dx*road.width*.5*side,(side+1)*road.width/2,distance+length*i/steps);if(i){const k=base+i*2;indices.push(k-2,k-1,k,k-1,k+1,k);}}
   distance+=length;
  }
  // Rounded, overlapping caps make junctions continuous without clipped road pieces.
  for(const p of road.points){const center=vertex(p.x,p.z,road.width/2,distance);for(let i=0;i<=16;i++){const angle=i/16*Math.PI*2;vertex(p.x+Math.cos(angle)*road.width/2,p.z+Math.sin(angle)*road.width/2,road.width/2+Math.cos(angle)*road.width/2,distance+Math.sin(angle)*road.width/2);if(i)indices.push(center,center+i+1,center+i);}}
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geometry.setIndex(indices);geometry.computeVertexNormals();const key=road.surface+':'+road.width,batch=batches.get(key)??{surface:road.surface,width:road.width,geometries:[]};batch.geometries.push(geometry);batches.set(key,batch);
 }
 for(const batch of batches.values()){const geometry=mergeGeometries(batch.geometries,false);batch.geometries.forEach(g=>g.dispose());if(!geometry)continue;const material=roadMaterial(batch.surface,southwest);material.userData.width=batch.width;const mesh=new THREE.Mesh(geometry,material);mesh.name='village-road-'+batch.surface;mesh.receiveShadow=true;group.add(mesh);}
 return group;
}
