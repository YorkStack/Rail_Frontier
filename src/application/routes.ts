import type { CommandHandler, CommandHandlers } from './commands.js';
import type { GameCommand } from './ports.js';
import { allocateId, type Id, type Train } from '../domain/model.js';
import { RailNetwork } from '../rail/graph.js';
import { serviceStop } from '../simulation/transfer.js';

type CreateRoute=Extract<GameCommand,{type:'createRoute'}>;
type AssignRoute=Extract<GameCommand,{type:'assignRoute'}>;

export const createRouteHandler:CommandHandler<CreateRoute>=(state,command)=>{
  if(new Set(command.stops).size!==command.stops.length)throw new Error('A route cannot repeat a station');
  const network=new RailNetwork(state.railway),nodes=command.stops.map(id=>state.stations.find(station=>station.id===id)!.nodeId);
  const legCount=command.mode==='loop'?nodes.length:nodes.length-1;
  for(let index=0;index<legCount;index++)if(!network.findPath(nodes[index]!,nodes[(index+1)%nodes.length]!))throw new Error('Route contains disconnected stops');
  const id=allocateId(state,'route');
  state.routes.push({id,stops:[...command.stops],mode:command.mode});
  return {createdIds:[id]};
};

function restingNode(state:Parameters<CommandHandler<AssignRoute>>[0],train:Train):Id<'node'>|null {
  const traversal=train.motion.path[train.motion.leg];if(!traversal)return null;
  const edge=state.railway.edges.find(candidate=>candidate.id===traversal.edgeId);if(!edge)return null;
  if(train.motion.distanceM===0)return traversal.reverse?edge.to:edge.from;
  if(train.motion.arrived)return traversal.reverse?edge.from:edge.to;
  return null;
}

export const assignRouteHandler:CommandHandler<AssignRoute>=(state,command)=>{
  const train=state.trains.find(candidate=>candidate.id===command.trainId)!,route=state.routes.find(candidate=>candidate.id===command.routeId)!;
  if(train.phase!=='idle'&&train.phase!=='dwelling')throw new Error('Train must be stopped before route assignment');
  const node=restingNode(state,train);
  if(!node)throw new Error('Train is not stopped at a station node');
  const stopIndex=route.stops.findIndex(id=>state.stations.find(station=>station.id===id)!.nodeId===node);
  if(stopIndex<0)throw new Error('Train is not at a stop on this route');
  const direction:1|-1=route.mode==='shuttle'&&stopIndex===route.stops.length-1?-1:1,nextStopIndex=(stopIndex+direction+route.stops.length)%route.stops.length;
  const destination=state.stations.find(station=>station.id===route.stops[nextStopIndex])!.nodeId,path=new RailNetwork(state.railway).findPath(node,destination);
  if(!path)throw new Error('Route leg is disconnected');
  train.routeId=route.id;serviceStop(state,train,route.stops[stopIndex]!);train.motion={path,leg:0,distanceM:0,arrived:false};train.phase='running';train.dwellTicks=0;train.speedMps=0;
  const service=state.operations.trainServices[train.id];if(!service)throw new Error('Train service state is missing');service.nextStopIndex=nextStopIndex;service.direction=direction;
  return {createdIds:[]};
};

export const routeCommandHandlers:CommandHandlers={createRoute:createRouteHandler,assignRoute:assignRouteHandler};
