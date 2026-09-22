import type {GameState} from '../domain/model.js';
import type {GridTerrain} from './terrain.js';
import {compileGraph} from '../rail/graph.js';
import {placedBuildingAccess,placedStationAccess,type BuildingAccess} from './building-access.js';
import {connectSettlementPaths,type PathObstacle,type PathEntrance,type SettlementPaths} from './settlement-paths.js';
import {surveyStationForecourt,type StationForecourt} from './station-forecourt.js';
import {villageRoadSeeds} from './village-road-seeds.js';
import {currentYear} from '../simulation/calendar.js';

export interface AccessPlot {id:string;assetId:string;townId:string|null;x:number;z:number;rotationY:number;scale:number;footprintRadiusM:number}
export interface SettlementAccess extends SettlementPaths {forecourts:StationForecourt[]}
export function generateSettlementAccess(terrain:GridTerrain,state:Readonly<GameState>,plots:readonly AccessPlot[],assets:ReadonlyMap<string,BuildingAccess>,southwest=false):SettlementAccess {
 const obstacles:PathObstacle[]=[],entrances:PathEntrance[]=[],stationSites:{id:string;center:{x:number;y:number;z:number};yaw:number}[]=[];
 for(const plot of plots){const asset=assets.get(plot.assetId);if(asset){const placed=placedBuildingAccess(plot,asset);obstacles.push(placed.obstacle);if(placed.entrance)entrances.push(placed.entrance);}else obstacles.push({id:plot.id,x:plot.x,z:plot.z,halfX:plot.footprintRadiusM,halfZ:plot.footprintRadiusM,rotationY:plot.rotationY});}
 for(const station of state.stations){const node=state.railway.nodes.find(n=>n.id===station.nodeId);if(!node)continue;const edge=state.railway.edges.find(e=>e.from===node.id||e.to===node.id),other=edge?state.railway.nodes.find(n=>n.id===(edge.from===node.id?edge.to:edge.from)):undefined,yaw=station.layout.kind==='single-platform'?station.layout.orientationRad:other?Math.atan2(-(other.position.x-node.position.x),-(other.position.z-node.position.z)):0;
  const placed=placedStationAccess(station.id,station.townId??'',node.position,yaw);obstacles.push(placed.obstacle);entrances.push(placed.entrance);stationSites.push({id:station.id,center:node.position,yaw});}
 const rails=[...compileGraph(structuredClone(state.railway)).values()].map(track=>track.samples.map(s=>({x:s.position.x,z:s.position.z}))),seeds=villageRoadSeeds(state,plots,southwest,currentYear(state)).map(r=>({townId:r.townId!,points:r.points})),forecourts=stationSites.map(s=>surveyStationForecourt(terrain,s.id,s.center,s.yaw,obstacles,rails)),blocked=new Set(forecourts.filter(f=>!f.valid).map(f=>f.stationId));
 const result=connectSettlementPaths(terrain,obstacles,rails,entrances.filter(e=>!blocked.has(e.id)),seeds);
 for(const id of blocked)result.access[id]='blocked';
 return {...result,forecourts};
}
