import type { CommandHandler, CommandHandlers } from './commands.js';
import type { GameCommand } from './ports.js';
import { stationDefinition } from '../content/stations.js';
import { allocateId, type Id } from '../domain/model.js';
import { distance } from '../rail/geometry.js';
import { straightCurve,surveyStationSite } from '../rail/station-layout.js';
import { postExpense } from '../simulation/finance.js';
import {stationPadTerrainOperation} from '../rail/earthworks.js';

type BuildStation=Extract<GameCommand,{type:'buildStation'}>;
type PlaceStation=Extract<GameCommand,{type:'placeStation'}>;
type UpgradeStation=Extract<GameCommand,{type:'upgradeStation'}>;

const nearestTown=(state:Parameters<CommandHandler<BuildStation>>[0],position:{x:number;y:number;z:number},radius:number):Id<'town'>|null=>{
  return (state.towns.map(town=>({town,separation:distance(town.position,position)})).filter(item=>item.separation<=radius).sort((a,b)=>a.separation-b.separation||a.town.id.localeCompare(b.town.id))[0]?.town.id??null) as Id<'town'>|null;
};

export const placeStationHandler:CommandHandler<PlaceStation>=(state,command,context)=>{
  const definition=stationDefinition(command.classId);
  if(!definition)throw new Error(`Unknown station class: ${command.classId}`);
  if(command.quotedCost!==definition.purchaseCost)throw new Error('Station quote is stale');
  if(state.company.cash<definition.purchaseCost)throw new Error('Insufficient funds');
  const site=surveyStationSite(context.terrain,command.position,command.orientationRad,definition.platformLengthM);
  const overlaps=state.stations.some(station=>{
    const existing=station.layout.kind==='single-platform'?station.layout.pad:undefined;
    const center=existing?.center??state.railway.nodes.find(node=>node.id===station.nodeId)?.position;
    const radius=existing?Math.hypot(existing.lengthM/2,existing.widthM/2):(stationDefinition(station.classId)?.platformLengthM??0)/2;
    return center!==undefined&&distance(center,site.center)<radius+Math.hypot(site.lengthM/2,site.widthM/2);
  });
  if(overlaps)throw new Error('Station footprint overlaps another station');

  const stationId=allocateId(state,'station'),stopNodeId=allocateId(state,'node'),portANodeId=allocateId(state,'node'),portBNodeId=allocateId(state,'node'),edgeAId=allocateId(state,'edge'),edgeBId=allocateId(state,'edge');
  state.railway.nodes.push({id:stopNodeId,position:site.center},{id:portANodeId,position:site.portA},{id:portBNodeId,position:site.portB});
  const edgeA={id:edgeAId,from:portANodeId,to:stopNodeId,curve:straightCurve(site.portA,site.center),speedLimitMps:20,ownerId:state.company.id};
  const edgeB={id:edgeBId,from:stopNodeId,to:portBNodeId,curve:straightCurve(site.center,site.portB),speedLimitMps:20,ownerId:state.company.id};
  state.railway.edges.push(edgeA,edgeB);state.railway.revision++;
  for(const edge of [edgeA,edgeB])state.operations.infrastructure[edge.id]={spans:[{startM:0,endM:site.lengthM/2,kind:'station'}],constructionCost:0,maintenancePerDay:0,electrified:false,electrificationCost:0,electrificationMaintenancePerDay:0};
  state.stations.push({
    id:stationId,nodeId:stopNodeId,townId:nearestTown(state,site.center,definition.coverageRadiusM),classId:definition.id,storage:[],constructionCost:definition.purchaseCost,
    layout:{kind:'single-platform',version:1,orientationRad:site.orientationRad,stopNodeId,ports:[{key:'a',nodeId:portANodeId,outward:{x:-site.direction.x,z:-site.direction.z},trackClassId:'local',gaugeM:1.435,attachmentCapacity:1},{key:'b',nodeId:portBNodeId,outward:site.direction,trackClassId:'local',gaugeM:1.435,attachmentCapacity:1}],internalEdgeIds:[edgeAId,edgeBId],pad:{center:site.center,lengthM:site.lengthM,widthM:site.widthM,maxReliefM:site.maxReliefM}}
  });
  const terrainSequence=state.operations.terrain.revision+1;state.operations.terrain.operations.push(stationPadTerrainOperation(stationId,site.center,site.orientationRad,site.lengthM,site.widthM,terrainSequence));state.operations.terrain.revision=terrainSequence;
  postExpense(state,'construction',definition.purchaseCost,stationId,'Station construction');
  return {createdIds:[stationId,stopNodeId,portANodeId,portBNodeId,edgeAId,edgeBId]};
};

export const buildStationHandler:CommandHandler<BuildStation>=(state,command,context)=>{
  const definition=stationDefinition(command.classId);
  if(!definition)throw new Error(`Unknown station class: ${command.classId}`);
  if(state.stations.some(station=>station.nodeId===command.nodeId))throw new Error('A station already occupies this rail node');
  if(!state.railway.edges.some(edge=>edge.from===command.nodeId||edge.to===command.nodeId))throw new Error('Station node is not connected to track');
  const node=state.railway.nodes.find(candidate=>candidate.id===command.nodeId)!;
  const ground=context.terrain.sample(node.position.x,node.position.z).elevationM;
  if(Math.abs(node.position.y-ground)>6)throw new Error('Station must be placed on ground-level track');
  if(state.company.cash<definition.purchaseCost)throw new Error('Insufficient funds');
  const id=allocateId(state,'station');
  const townId=nearestTown(state,node.position,definition.coverageRadiusM);
  state.stations.push({id,nodeId:node.id,townId,classId:definition.id,storage:[],layout:{kind:'legacy-node',version:1},constructionCost:definition.purchaseCost});
  postExpense(state,'construction',definition.purchaseCost,id,'Station construction');
  return {createdIds:[id]};
};

export const upgradeStationHandler:CommandHandler<UpgradeStation>=(state,command)=>{
  const station=state.stations.find(candidate=>candidate.id===command.stationId)!,current=stationDefinition(station.classId),next=stationDefinition(command.classId);
  if(!current)throw new Error(`Unknown current station class: ${station.classId}`);
  if(!next)throw new Error(`Unknown station class: ${command.classId}`);
  if(next.id===current.id)throw new Error('Station already has this class');
  if(next.purchaseCost<=current.purchaseCost||next.coverageRadiusM<current.coverageRadiusM||next.storageCapacity<current.storageCapacity||next.platformLengthM<current.platformLengthM)throw new Error('Station upgrades cannot reduce capability');
  const cost=next.purchaseCost-current.purchaseCost;
  if(!Number.isSafeInteger(cost)||cost<=0)throw new Error('Invalid station upgrade cost');
  if(state.company.cash<cost)throw new Error('Insufficient funds');
  const node=state.railway.nodes.find(candidate=>candidate.id===station.nodeId)!;
  station.classId=next.id;station.townId=nearestTown(state,node.position,next.coverageRadiusM);station.constructionCost+=cost;
  postExpense(state,'construction',cost,station.id,`Station upgrade to ${next.id}`);
  return {createdIds:[]};
};

export const stationCommandHandlers:CommandHandlers={placeStation:placeStationHandler,buildStation:buildStationHandler,upgradeStation:upgradeStationHandler};
