import * as THREE from 'three';
import type { Heightfield } from '../world/terrain.js';
import type { BiomeDefinition } from '../world/profiles.js';
import {createTerrainMaterial} from './terrain-material.js';

const clamp01=(value:number)=>Math.max(0,Math.min(1,value));
const smooth=(start:number,end:number,value:number)=>{const t=clamp01((value-start)/(end-start));return t*t*(3-2*t);};

export function terrainMesh(terrain:Heightfield,profile:BiomeDefinition):THREE.Mesh<THREE.BufferGeometry,THREE.MeshStandardMaterial> {
  const {columns,rows,cellM}=terrain,positions:number[]=[],colors:number[]=[],uvs:number[]=[],indices:number[]=[];
  const surface=profile.surface,grass=new THREE.Color(profile.palette.lowland),forest=new THREE.Color(profile.palette.forest),rock=new THREE.Color(profile.palette.rock),scree=new THREE.Color(surface?.scree??'#898a80'),snow=new THREE.Color(profile.palette.snow),sand=new THREE.Color(surface?.sand??'#9e9b78'),soil=new THREE.Color(surface?.soil??'#756d52'),strata=(surface?.strata?.colors??[]).map(value=>new THREE.Color(value));
  for(let iz=0;iz<rows;iz++)for(let ix=0;ix<columns;ix++) {
    const x=ix*cellM,z=iz*cellM,sample=terrain.sample(x,z),y=sample.elevationM;positions.push(x,y,z);uvs.push(x/720,z/720);
    const left=terrain.sample(Math.max(0,x-cellM),z).elevationM,right=terrain.sample(Math.min(terrain.widthM,x+cellM),z).elevationM,near=terrain.sample(x,Math.max(0,z-cellM)).elevationM,far=terrain.sample(x,Math.min(terrain.depthM,z+cellM)).elevationM,dx=(right-left)/(2*cellM),dz=(far-near)/(2*cellM),slope=Math.hypot(dx,dz),normalY=1/Math.sqrt(1+slope*slope);
    const color=grass.clone().lerp(forest,sample.forest*.46),rockWeight=Math.max(sample.rock,smooth(.34,.95,slope)),screeWeight=rockWeight*smooth(.48,.84,normalY),snowNoise=.5+.5*Math.sin(x*.0031+z*.0023+Math.sin(z*.0007)*2),snowLine=surface?.snowLineM??1030,snowWeight=smooth(snowLine,snowLine+290,y)*(1-smooth(.45,1.05,slope))*smooth(.56,.82,snowNoise);
    color.lerp(scree,Math.min(.42,rockWeight*.34));color.lerp(rock,rockWeight*.82);if(strata.length>0&&surface?.strata){const band=Math.floor(Math.max(0,y)/surface.strata.bandHeightM)%strata.length;color.lerp(strata[band]!,rockWeight*surface.strata.strength);}color.lerp(snow,snowWeight*.88);if(y<9)color.lerp(sand,.82);if(sample.urban>.2)color.lerp(soil,sample.urban*.12);
    const broad=.91+.055*Math.sin(x*.0017+z*.0011)+.028*Math.sin(x*.0041-z*.0037)+.018*Math.cos(x*.009+z*.006);color.multiplyScalar(broad);colors.push(color.r,color.g,color.b);
    if(ix<columns-1&&iz<rows-1) {const a=iz*columns+ix,b=a+1,c=a+columns,d=c+1;indices.push(a,d,b,a,c,d);}
  }
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));geometry.setIndex(indices);geometry.computeVertexNormals();geometry.computeTangents();
  const mesh=new THREE.Mesh(geometry,createTerrainMaterial());mesh.receiveShadow=true;mesh.name='authoritative-terrain';return mesh;
}
