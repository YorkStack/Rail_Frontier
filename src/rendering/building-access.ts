import * as THREE from 'three';
import type {BuildingAccess} from '../world/building-access.js';
export {placedBuildingAccess,placedStationAccess,STATION_ENTRANCE_X,type BuildingAccess} from '../world/building-access.js';
/** Read the authored door/threshold and footprint, before meshes are batched. */
export function readBuildingAccess(source:THREE.Object3D):BuildingAccess|null {
 source.updateMatrixWorld(true);const a=source.getObjectByName('footprint_nw'),b=source.getObjectByName('footprint_se');if(!a||!b)return null;
 let door:THREE.Object3D|undefined=source.getObjectByName('entrance')??source.getObjectByName('RF_House_Threshold');if(!door)source.traverse(object=>{if(!door&&/_Door$/.test(object.name))door=object;});if(!door)return null;
 const p=a.getWorldPosition(new THREE.Vector3()),q=b.getWorldPosition(new THREE.Vector3()),d=door.getWorldPosition(new THREE.Vector3()),halfX=Math.max(Math.abs(p.x),Math.abs(q.x)),halfZ=Math.max(Math.abs(p.z),Math.abs(q.z));
 const outward=Math.abs(d.x)/halfX>Math.abs(d.z)/halfZ?{x:Math.sign(d.x),z:0}:{x:0,z:Math.sign(d.z)};
 return {halfX,halfZ,door:{x:d.x,z:d.z},outward};
}
