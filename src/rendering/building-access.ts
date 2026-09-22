import * as THREE from 'three';
import {localToWorld,type PathObstacle,type PathEntrance} from '../world/settlement-paths.js';
export interface BuildingAccess {halfX:number;halfZ:number;door:{x:number;z:number};outward:{x:number;z:number}}
/** Read the authored door/threshold and footprint, before meshes are batched. */
export function readBuildingAccess(source:THREE.Object3D):BuildingAccess|null {
 source.updateMatrixWorld(true);const a=source.getObjectByName('footprint_nw'),b=source.getObjectByName('footprint_se');if(!a||!b)return null;
 let door:THREE.Object3D|undefined=source.getObjectByName('RF_House_Threshold');if(!door)source.traverse(object=>{if(!door&&/_Door$/.test(object.name))door=object;});if(!door)return null;
 const p=a.getWorldPosition(new THREE.Vector3()),q=b.getWorldPosition(new THREE.Vector3()),d=door.getWorldPosition(new THREE.Vector3()),halfX=Math.max(Math.abs(p.x),Math.abs(q.x)),halfZ=Math.max(Math.abs(p.z),Math.abs(q.z));
 const outward=Math.abs(d.x)/halfX>Math.abs(d.z)/halfZ?{x:Math.sign(d.x),z:0}:{x:0,z:Math.sign(d.z)};
 return {halfX,halfZ,door:{x:d.x,z:d.z},outward};
}
export function placedBuildingAccess(plot:{id:string;townId:string|null;x:number;z:number;rotationY:number;scale:number},asset:BuildingAccess):{obstacle:PathObstacle;entrance:PathEntrance|null} {
 const project=(x:number,z:number)=>localToWorld(plot,plot.rotationY,x*plot.scale,z*plot.scale),door=project(asset.door.x,asset.door.z),distance=(asset.outward.x?asset.halfX:asset.halfZ)+4;
 return {obstacle:{id:plot.id,x:plot.x,z:plot.z,halfX:asset.halfX*plot.scale,halfZ:asset.halfZ*plot.scale,rotationY:plot.rotationY},entrance:plot.townId?{id:plot.id,townId:plot.townId,kind:'house',door,approach:project(asset.outward.x?asset.outward.x*distance:asset.door.x,asset.outward.z?asset.outward.z*distance:asset.door.z)}:null};
}

/** Street-side threshold of the authored station building, opposite the platform. */
export const STATION_ENTRANCE_X=14.65;
export function placedStationAccess(id:string,townId:string,center:{x:number;z:number},yaw:number):{obstacle:PathObstacle;entrance:PathEntrance} {
 const building=localToWorld(center,yaw,10.4,-1.5);
 return {obstacle:{id,...building,halfX:4.25,halfZ:7.5,rotationY:yaw},entrance:{id,townId,kind:'station',door:localToWorld(center,yaw,STATION_ENTRANCE_X+.05,-1.5),approach:localToWorld(center,yaw,20,-1.5)}};
}
