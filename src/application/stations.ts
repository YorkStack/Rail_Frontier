import type { CommandHandler, CommandHandlers } from './commands.js';
import type { GameCommand } from './ports.js';
import { stationDefinition } from '../content/stations.js';
import { allocateId, type Id } from '../domain/model.js';
import { distance } from '../rail/geometry.js';
import { postExpense } from '../simulation/finance.js';

type BuildStation=Extract<GameCommand,{type:'buildStation'}>;
type UpgradeStation=Extract<GameCommand,{type:'upgradeStation'}>;

const nearestTown=(state:Parameters<CommandHandler<BuildStation>>[0],nodeId:Id<'node'>,radius:number):Id<'town'>|null=>{
  const node=state.railway.nodes.find(candidate=>candidate.id===nodeId)!;
  return (state.towns.map(town=>({town,separation:distance(town.position,node.position)})).filter(item=>item.separation<=radius).sort((a,b)=>a.separation-b.separation||a.town.id.localeCompare(b.town.id))[0]?.town.id??null) as Id<'town'>|null;
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
  const townId=nearestTown(state,node.id,definition.coverageRadiusM);
  state.stations.push({id,nodeId:node.id,townId,classId:definition.id,storage:[]});
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
  station.classId=next.id;station.townId=nearestTown(state,station.nodeId,next.coverageRadiusM);
  postExpense(state,'construction',cost,station.id,`Station upgrade to ${next.id}`);
  return {createdIds:[]};
};

export const stationCommandHandlers:CommandHandlers={buildStation:buildStationHandler,upgradeStation:upgradeStationHandler};
