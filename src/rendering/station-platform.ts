import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {RAIL_TO_FORMATION_M} from '../rail/station-layout.js';
import {platformSurface,settlementEra} from '../world/settlement-era.js';
import {metricBox,surfaceMaterial} from './settlement-materials.js';

export const STATION_PLATFORM_EDGE_M=1.75;
export const STATION_PLATFORM_WIDTH_M=7.5;
export const STATION_MODEL_OFFSET_M=STATION_PLATFORM_EDGE_M+STATION_PLATFORM_WIDTH_M/2;
export const STATION_PLATFORM_TOP_M=.55;

/** Local +z follows the saved track. Materials/furniture never move its boarding edge. */
export function createStationPlatform(lengthM:number,year=1900,southwest=false):THREE.Group {
 const group=new THREE.Group();group.name='station-platform';group.userData.era=settlementEra(year);
 const stone=surfaceMaterial('stone',southwest),top=surfaceMaterial(platformSurface(year,southwest),southwest),paving=surfaceMaterial('pavers',southwest),wood=surfaceMaterial('timber',southwest),iron=new THREE.MeshStandardMaterial({color:'#35443e',roughness:.7}),glass=new THREE.MeshStandardMaterial({color:year<1920?'#e4d0a0':'#dbe2dc',roughness:.5});
 const height=RAIL_TO_FORMATION_M+STATION_PLATFORM_TOP_M;
 const slab=new THREE.Mesh(metricBox(STATION_PLATFORM_WIDTH_M,height,lengthM),[stone,stone,top,stone,stone,stone]);slab.name='platform-slab';slab.position.set(STATION_MODEL_OFFSET_M,(STATION_PLATFORM_TOP_M-RAIL_TO_FORMATION_M)/2,0);slab.receiveShadow=true;slab.castShadow=true;group.add(slab);
 const foundation=new THREE.Mesh(metricBox(8.5,RAIL_TO_FORMATION_M,15),stone);foundation.name='station-building-foundation';foundation.position.set(STATION_MODEL_OFFSET_M+4.9,-RAIL_TO_FORMATION_M/2,-1.5);foundation.receiveShadow=true;foundation.castShadow=true;group.add(foundation);
 // A distinct coping/walking strip breaks up the surface; no modern yellow marking in 1900.
 const edge=new THREE.Mesh(metricBox(.42,.04,lengthM),paving);edge.name='platform-edge';edge.position.set(STATION_PLATFORM_EDGE_M+.21,STATION_PLATFORM_TOP_M+.02,0);edge.receiveShadow=true;group.add(edge);
 const walk=new THREE.Mesh(metricBox(1.1,.022,lengthM-.3),year<1920&&southwest?wood:paving);walk.name='platform-walking-strip';walk.position.set(2.75,STATION_PLATFORM_TOP_M+.011,0);walk.receiveShadow=true;group.add(walk);
 const batches=new Map<THREE.Material,THREE.BufferGeometry[]>();
 const box=(x:number,y:number,z:number,w:number,h:number,d:number,mat:THREE.Material)=>{const g=metricBox(w,h,d);g.translate(x,y,z);const list=batches.get(mat)??[];list.push(g);batches.set(mat,list);};
 const seat=year<1960?wood:iron;
 for(const z of [-lengthM*.32,lengthM*.32]){
  box(6.5,1.05,z,1.0,.14,2.8,seat);box(6.95,1.43,z,.12,.76,2.8,seat);
  for(const dz of [-1.05,1.05])box(6.5,.78,z+dz,.65,.48,.13,iron);
  // Keep the through-walking strip and train envelope clear.
  box(8.5,2.65,z+4,.14,4.2,.14,iron);
  box(8.5,4.72,z+4,year<1920?.48:.75,.62,.48,glass);box(8.5,5.07,z+4,.72,.12,.72,iron);
 }
 if(year>=1980){const tactile=new THREE.Mesh(metricBox(.35,.025,lengthM),surfaceMaterial('pavers'));tactile.name='platform-safety-strip';(tactile.material as THREE.MeshStandardMaterial).color.set('#eadcb1');tactile.position.set(2.28,.585,0);group.add(tactile);}
 for(const [material,parts] of batches){const geometry=mergeGeometries(parts,false);parts.forEach(p=>p.dispose());if(!geometry)continue;const mesh=new THREE.Mesh(geometry,material);mesh.name='platform-furniture';mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);}
 return group;
}
