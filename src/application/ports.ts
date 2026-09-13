import type { GameState, Id, RailEdge, Speed, Vec3 } from '../domain/model.js';
import type { EngineeringQuote } from '../rail/planner.js';
/** Proposed application boundary. No UI or engine objects belong in the simulation. */
export type GameCommand =
  | { type:'setSpeed'; speed:Speed }
  | { type:'buildTrack'; edge:RailEdge; expectedRevision:number; quotedCost:number }
  | { type:'buildStation'; nodeId:Id<'node'>; classId:string }
  | { type:'purchaseTrain'; locomotiveId:string; vehicleIds:string[]; stationId:Id<'station'> }
  | { type:'createRoute'; stops:Id<'station'>[]; mode:'shuttle'|'loop' }
  | { type:'assignRoute'; trainId:Id<'train'>; routeId:Id<'route'> };
export type CommandResult={ok:true}|{ok:false;reason:string};
export interface GameApplication {
  dispatch(command:GameCommand):CommandResult;
  snapshot():Readonly<GameState>;
  previewTrack(edge:RailEdge):EngineeringQuote;
}
export interface SaveStore {
  list():Promise<{id:string;name:string;modifiedAt:string}[]>;
  write(id:string,name:string,json:string):Promise<void>;
  read(id:string):Promise<string>;
  remove(id:string):Promise<void>;
}
/** Provisional until the actual engine is available. */
export interface WorldRenderer {
  update(previous:Readonly<GameState>,current:Readonly<GameState>,alpha:number):void;
  pick(screenX:number,screenY:number):Vec3|null;
  focus(position:Vec3):void;
  dispose():void;
}
