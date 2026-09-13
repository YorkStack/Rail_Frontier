import * as THREE from 'three';
import type { Heightfield } from '../world/terrain.js';
import type { BiomeDefinition } from '../world/profiles.js';

export function terrainMesh(terrain:Heightfield,profile:BiomeDefinition):THREE.Mesh<THREE.BufferGeometry,THREE.MeshStandardMaterial> {
  const {columns,rows,cellM}=terrain,positions:number[]=[],colors:number[]=[],indices:number[]=[];
  const grass=new THREE.Color(profile.palette.lowland),rock=new THREE.Color(profile.palette.rock),snow=new THREE.Color(profile.palette.snow),sand=new THREE.Color('#b1af89');
  for(let iz=0;iz<rows;iz++)for(let ix=0;ix<columns;ix++) {
    const x=ix*cellM,z=iz*cellM,y=terrain.sample(x,z).elevationM;positions.push(x,y,z);
    const left=terrain.sample(Math.max(0,x-cellM),z).elevationM,right=terrain.sample(Math.min(terrain.widthM,x+cellM),z).elevationM;
    const slope=Math.abs(right-left)/(2*cellM),color=grass.clone().lerp(rock,Math.min(1,Math.max(0,(y-240)/470)+slope*.45));
    if(y<9)color.lerp(sand,.7);
    if(y>620)color.lerp(snow,Math.min(1,(y-620)/100));
    color.multiplyScalar(.94+.06*Math.sin(x*.02+z*.025));colors.push(color.r,color.g,color.b);
    if(ix<columns-1&&iz<rows-1) {const a=iz*columns+ix,b=a+1,c=a+columns,d=c+1;indices.push(a,d,b,a,c,d);}
  }
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geometry.setIndex(indices);geometry.computeVertexNormals();
  const mesh=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({vertexColors:true,roughness:1,metalness:0}));mesh.receiveShadow=true;mesh.name='authoritative-terrain';return mesh;
}
