import type {GameState,Vec3} from '../domain/model.js';
import type {GridTerrain} from '../world/terrain.js';
import type {BuildingAccess} from '../world/building-access.js';
import {EngineeredTerrain} from '../world/engineered-terrain.js';
import {executeCommand} from './commands.js';
import {stationCommandHandlers} from './stations.js';
import {ContentRegistry} from '../content/registry.js';
import {generateArizonaSettlements} from '../rendering/arizona-settlement-placement.js';
import {generateNorwaySettlements} from '../rendering/settlement-placement.js';
import {generateSettlementAccess,type SettlementAccess} from '../world/settlement-access.js';
import type {StationForecourt} from '../world/station-forecourt.js';

export interface StationAccessRequest {requestId:number;state:GameState;assets:[string,BuildingAccess][];position:{x:number;z:number};orientationRad:number;classId:string;quotedCost:number}
export interface StationAccessPreview {requestId:number;stationId:string;status:'connected'|'blocked'|'remote';court:StationForecourt;paths:Vec3[][];network:SettlementAccess}
/** Execute the real command against a private copy, including IDs, grading and placement. */
export function previewStationAccess(request:StationAccessRequest,base:GridTerrain):StationAccessPreview {
 const state=structuredClone(request.state),before=new EngineeredTerrain(base,state.operations.terrain),effect=executeCommand(state,{type:'placeStation',position:request.position,orientationRad:request.orientationRad,classId:request.classId,quotedCost:request.quotedCost,expectedRevision:state.railway.revision},{terrain:before,speed:0},stationCommandHandlers),stationId=effect.createdIds[0]!,after=new EngineeredTerrain(base,state.operations.terrain),southwest=new ContentRegistry().resolve(state).presentation.proceduralScenery==='southwest-study',plots=southwest?generateArizonaSettlements(after,state):generateNorwaySettlements(after,state),network=generateSettlementAccess(after,state,plots,new Map(request.assets),southwest),court=network.forecourts.find(c=>c.stationId===stationId)!;
 return {requestId:request.requestId,stationId,status:network.access[stationId]!,court,network,paths:network.paths.filter(p=>p.entranceId===stationId).map(path=>path.points.map(p=>({...p,y:after.sample(p.x,p.z).elevationM+.28})))};
}
