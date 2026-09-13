import type { GameCommand } from './ports.js';
import type { GameState, Speed } from '../domain/model.js';
import type { Terrain } from '../world/terrain.js';

export interface CommandContext {terrain:Terrain;speed:Speed}
export interface CommandEffect {createdIds:string[];speed?:Speed}
export type CommandHandler<C extends GameCommand=GameCommand>=(state:GameState,command:C,context:Readonly<CommandContext>)=>CommandEffect;
export type CommandHandlers={
  [K in GameCommand['type']]?:CommandHandler<Extract<GameCommand,{type:K}>>
};

const finitePosition=(value:{x:number;y:number;z:number})=>Number.isFinite(value.x)&&Number.isFinite(value.y)&&Number.isFinite(value.z);

/** Shared reference checks run before feature handlers and therefore before any mutation. */
export function validateCommand(state:GameState,command:GameCommand):void {
  switch(command.type) {
    case 'setSpeed':
      if(![0,1,2,4,8].includes(command.speed))throw new Error('Invalid simulation speed');
      return;
    case 'buildTrack': {
      if(!Number.isSafeInteger(command.expectedRevision)||command.expectedRevision!==state.railway.revision)throw new Error('Track preview is stale');
      if(!Number.isSafeInteger(command.quotedCost)||command.quotedCost<0)throw new Error('Invalid quoted cost');
      for(const anchor of [command.from,command.to]) {
        if('nodeId' in anchor&&!state.railway.nodes.some(node=>node.id===anchor.nodeId))throw new Error(`Unknown rail anchor: ${anchor.nodeId}`);
        if('position' in anchor&&!finitePosition(anchor.position))throw new Error('Invalid rail anchor position');
      }
      return;
    }
    case 'buildStation':
      if(!state.railway.nodes.some(node=>node.id===command.nodeId))throw new Error(`Unknown station node: ${command.nodeId}`);
      if(command.classId.length===0)throw new Error('Station class is required');
      return;
    case 'purchaseTrain':
      if(!state.stations.some(station=>station.id===command.stationId))throw new Error(`Unknown purchase station: ${command.stationId}`);
      if(command.locomotiveId.length===0||command.vehicleIds.some(id=>id.length===0))throw new Error('Vehicle IDs are required');
      return;
    case 'createRoute':
      if(command.stops.length<2)throw new Error('A route needs at least two stops');
      for(const stop of command.stops)if(!state.stations.some(station=>station.id===stop))throw new Error(`Unknown route stop: ${stop}`);
      return;
    case 'assignRoute':
      if(!state.trains.some(train=>train.id===command.trainId))throw new Error(`Unknown train: ${command.trainId}`);
      if(!state.routes.some(route=>route.id===command.routeId))throw new Error(`Unknown route: ${command.routeId}`);
  }
}

export const baseCommandHandlers:CommandHandlers={
  setSpeed:(_state,command)=>({createdIds:[],speed:command.speed})
};

export function executeCommand(state:GameState,command:GameCommand,context:Readonly<CommandContext>,handlers:CommandHandlers):CommandEffect {
  validateCommand(state,command);
  const handler=handlers[command.type] as CommandHandler|undefined;
  if(!handler)throw new Error(`${command.type} is not implemented`);
  return handler(state,command,context);
}
