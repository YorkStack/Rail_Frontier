import * as THREE from 'three';
import type { GridTerrain } from '../world/terrain.js';
import type { BiomeDefinition } from '../world/profiles.js';
import {createTerrainMaterial} from './terrain-material.js';
import {terrainVariation} from './terrain-textures.js';
import {EngineeredTerrain,ENGINEERED_PATCH_CELL_M} from '../world/engineered-terrain.js';

const clamp01=(value:number)=>Math.max(0,Math.min(1,value));
const smooth=(start:number,end:number,value:number)=>{const t=clamp01((value-start)/(end-start));return t*t*(3-2*t);};

export function terrainMesh(terrain:GridTerrain,profile:BiomeDefinition):THREE.Mesh<THREE.BufferGeometry,THREE.MeshStandardMaterial> {
  const {columns,rows,cellM}=terrain,positions:number[]=[],colors:number[]=[],uvs:number[]=[],masks:number[]=[],indices:number[]=[];
  const surface=profile.surface,grass=new THREE.Color(profile.palette.lowland),forest=new THREE.Color(profile.palette.forest),rock=new THREE.Color(profile.palette.rock),scree=new THREE.Color(surface?.scree??'#898a80'),snow=new THREE.Color(profile.palette.snow),sand=new THREE.Color(surface?.sand??'#9e9b78'),soil=new THREE.Color(surface?.soil??'#756d52'),strata=(surface?.strata?.colors??[]).map(value=>new THREE.Color(value));
  const pushVertex=(x:number,z:number)=>{
    const sample=terrain.sample(x,z),y=sample.elevationM;positions.push(x,y,z);uvs.push(x/720,z/720);masks.push(sample.forest,sample.rock,sample.urban);
    const left=terrain.sample(Math.max(0,x-cellM),z).elevationM,right=terrain.sample(Math.min(terrain.widthM,x+cellM),z).elevationM,near=terrain.sample(x,Math.max(0,z-cellM)).elevationM,far=terrain.sample(x,Math.min(terrain.depthM,z+cellM)).elevationM,dx=(right-left)/(2*cellM),dz=(far-near)/(2*cellM),slope=Math.hypot(dx,dz),normalY=1/Math.sqrt(1+slope*slope);
    const color=grass.clone().lerp(forest,sample.forest*.46),rockWeight=Math.max(sample.rock,smooth(.34,.95,slope)),screeWeight=rockWeight*smooth(.48,.84,normalY),snowNoise=terrainVariation(x+1700,z-2300,41),snowLine=surface?.snowLineM??1030,snowWeight=smooth(snowLine,snowLine+290,y)*(1-smooth(.45,1.05,slope))*smooth(.56,.82,snowNoise);
    color.lerp(scree,Math.min(.42,rockWeight*.34));color.lerp(rock,rockWeight*.82);if(strata.length>0&&surface?.strata){const period=surface.strata.bandHeightM*6.8,shift=(terrainVariation(x*.72,z*.72,137)-.5)*surface.strata.bandHeightM*2.1,phase=(((Math.max(0,y)+shift)%period)+period)%period/period,limits=[.13,.34,.58,.79,1],band=limits.findIndex(limit=>phase<limit);color.lerp(strata[Math.max(0,band)]!,rockWeight*surface.strata.strength*.82);}color.lerp(snow,snowWeight*.88);if(y<9)color.lerp(sand,.82);if(sample.urban>.2)color.lerp(soil,sample.urban*.12);
    const broad=.94+terrainVariation(x,z,profile.id==='southwest'?73:29)*.07+terrainVariation(x*2.7,z*2.7,profile.id==='southwest'?97:53)*.02;color.multiplyScalar(broad);colors.push(color.r,color.g,color.b);
  };
  for(let iz=0;iz<rows;iz++)for(let ix=0;ix<columns;ix++)pushVertex(ix*cellM,iz*cellM);
  const affected=terrain instanceof EngineeredTerrain?terrain.affectedCellKeys():new Set<string>();
  for(let iz=0;iz<rows-1;iz++)for(let ix=0;ix<columns-1;ix++)if(!affected.has(`${ix}:${iz}`)){const a=iz*columns+ix,b=a+1,c=a+columns,d=c+1;indices.push(a,d,b,a,c,d);}
  const divisions=Math.max(1,Math.ceil(cellM/ENGINEERED_PATCH_CELL_M)),step=cellM/divisions;
  for(const key of affected){const [ix,iz]=key.split(':').map(Number),base=positions.length/3;for(let zIndex=0;zIndex<=divisions;zIndex++)for(let xIndex=0;xIndex<=divisions;xIndex++)pushVertex(ix!*cellM+xIndex*step,iz!*cellM+zIndex*step);for(let zIndex=0;zIndex<divisions;zIndex++)for(let xIndex=0;xIndex<divisions;xIndex++){const a=base+zIndex*(divisions+1)+xIndex,b=a+1,c=a+divisions+1,d=c+1;indices.push(a,d,b,a,c,d);}}
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));geometry.setAttribute('terrainMask',new THREE.Float32BufferAttribute(masks,3));geometry.setIndex(indices);geometry.computeVertexNormals();geometry.computeTangents();
  const mesh=new THREE.Mesh(geometry,createTerrainMaterial(profile));mesh.receiveShadow=true;mesh.name='authoritative-terrain';return mesh;
}
