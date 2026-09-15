import { createInitialState,norway } from './norway.js';
import type { CampaignDefinition,CubicCurve,GameState,Vec3 } from '../domain/model.js';
import type { Terrain } from '../world/terrain.js';
import { compileCurve } from '../rail/geometry.js';
import { engineeringSpans,quoteTrack } from '../rail/planner.js';
import { findPath } from '../rail/graph.js';
import { addNorwayIndustries } from './industries.js';

export const straightCurve=(a:Vec3,b:Vec3):CubicCurve=>({p0:{...a},p1:{x:(2*a.x+b.x)/3,y:(2*a.y+b.y)/3,z:(2*a.z+b.z)/3},p2:{x:(a.x+2*b.x)/3,y:(a.y+2*b.y)/3,z:(a.z+2*b.z)/3},p3:{...b}});

/** A commissioned first line used by the playable preview; the production campaign definition stays data-only. */
export function createNorwayPreviewState(terrain:Terrain,campaign:CampaignDefinition=norway):GameState {
  const state=createInitialState(campaign),points=state.towns.map(town=>town.position),curves=[straightCurve(points[0]!,points[1]!),straightCurve(points[1]!,points[2]!)];
  state.railway={revision:1,nodes:points.map((position,index)=>({id:`node:${5+index}`,position:{...position}})),edges:curves.map((curve,index)=>({id:`edge:${8+index}`,from:`node:${5+index}`,to:`node:${6+index}`,curve,speedLimitMps:22.22,ownerId:'company:1'}))};
  for(const edge of state.railway.edges){const quote=quoteTrack(compileCurve(edge.curve),terrain);if(!quote.valid)throw new Error(`Preview railway is invalid: ${quote.reasons.join(' · ')}`);state.operations.infrastructure[edge.id]={spans:engineeringSpans(quote).map(({startM,endM,kind})=>({startM,endM,kind})),constructionCost:quote.cost,maintenancePerDay:Math.max(1,Math.round(quote.cost*.00005)),electrified:false,electrificationCost:0,electrificationMaintenancePerDay:0};}
  state.stations=state.towns.map((town,index)=>({id:`station:${10+index}`,nodeId:`node:${5+index}`,townId:town.id,classId:index===1?'town-station':'rural-halt',storage:[],layout:{kind:'legacy-node',version:1},constructionCost:index===1?7_500_000:2_500_000}));
  state.routes=[{id:'route:13',stops:['station:10','station:11','station:12'],mode:'shuttle'}];
  state.trains=[{id:'train:14',routeId:'route:13',locomotiveId:'nord-2-6-0',vehicleIds:['fjord-passenger-coach','fjord-passenger-coach'],speedMps:0,phase:'running',dwellTicks:0,cargo:[],motion:{path:findPath(state.railway,'node:5','node:6')!,leg:0,distanceM:120,arrived:false}}];
  state.operations.trainServices['train:14']={nextStopIndex:1,direction:1,ageDays:0,condition:1,distanceM:0,revenue:0,operatingCosts:0,costRemainder:0};state.nextEntityId=15;
  addNorwayIndustries(state);state.industries.find(industry=>industry.definitionId==='forest')!.inventory.timber=40;state.industries.find(industry=>industry.definitionId==='sawmill')!.inventory.lumber=14;
  return state;
}
