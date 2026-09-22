import * as THREE from 'three';
import {RAIL_TO_FORMATION_M} from '../rail/station-layout.js';

// Keep the platform outside the rolling-stock envelope; authored building stays unscaled.
export const STATION_PLATFORM_EDGE_M=1.75;
export const STATION_PLATFORM_WIDTH_M=7.5;
export const STATION_MODEL_OFFSET_M=STATION_PLATFORM_EDGE_M+STATION_PLATFORM_WIDTH_M/2;
export const STATION_PLATFORM_TOP_M=.55;

/** Local +z follows the platform track, y=0 is the saved railhead. */
export function createStationPlatform(lengthM:number):THREE.Group {
 const group=new THREE.Group();group.name='station-platform';
 const height=RAIL_TO_FORMATION_M+STATION_PLATFORM_TOP_M;
 const slab=new THREE.Mesh(new THREE.BoxGeometry(STATION_PLATFORM_WIDTH_M,height,lengthM),new THREE.MeshStandardMaterial({color:'#91928a',roughness:1}));
 slab.name='platform-slab';slab.position.set(STATION_MODEL_OFFSET_M,(STATION_PLATFORM_TOP_M-RAIL_TO_FORMATION_M)/2,0);slab.receiveShadow=true;slab.castShadow=true;group.add(slab);
 const foundation=new THREE.Mesh(new THREE.BoxGeometry(8.5,RAIL_TO_FORMATION_M,15),slab.material);
 foundation.name='station-building-foundation';foundation.position.set(STATION_MODEL_OFFSET_M+4.9,-RAIL_TO_FORMATION_M/2,-1.5);foundation.receiveShadow=true;foundation.castShadow=true;group.add(foundation);
 const edge=new THREE.Mesh(new THREE.BoxGeometry(.22,.025,lengthM),new THREE.MeshStandardMaterial({color:'#d7d3bd',roughness:.95}));
 edge.name='platform-edge';edge.position.set(STATION_PLATFORM_EDGE_M+.11,STATION_PLATFORM_TOP_M+.0125,0);edge.receiveShadow=true;group.add(edge);
 return group;
}
