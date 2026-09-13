import type { CommandHandler, CommandHandlers } from './commands.js';
import type { GameCommand } from './ports.js';
import { stationDefinition } from '../content/stations.js';
import { allocateId, type Id } from '../domain/model.js';
import { distance } from '../rail/geometry.js';
import { postExpense } from '../simulation/finance.js';

type BuildStation=Extract<GameCommand,{type:'buildStation'}>;

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
  const nearest=state.towns.map(town=>({town,separation:distance(town.position,node.position)})).filter(item=>item.separation<=definition.coverageRadiusM).sort((a,b)=>a.separation-b.separation||a.town.id.localeCompare(b.town.id))[0];
  const townId=(nearest?.town.id??null) as Id<'town'>|null;
  state.stations.push({id,nodeId:node.id,townId,classId:definition.id,storage:[]});
  postExpense(state,'construction',definition.purchaseCost,id,'Station construction');
  return {createdIds:[id]};
};

export const stationCommandHandlers:CommandHandlers={buildStation:buildStationHandler};
