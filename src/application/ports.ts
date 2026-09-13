import type { CubicCurve, GameState, Id, Speed, Vec3 } from '../domain/model.js';
import type { EngineeringQuote } from '../rail/planner.js';
export type RailAnchor={nodeId:Id<'node'>}|{position:Vec3};
/** Command handlers own ID allocation, ownership and price revalidation. */
export type GameCommand =
  | { type:'setSpeed'; speed:Speed }
  | { type:'buildTrack'; curve:CubicCurve; from:RailAnchor; to:RailAnchor; expectedRevision:number; quotedCost:number }
  | { type:'buildStation'; nodeId:Id<'node'>; classId:string }
  | { type:'purchaseTrain'; locomotiveId:string; vehicleIds:string[]; stationId:Id<'station'> }
  | { type:'createRoute'; stops:Id<'station'>[]; mode:'shuttle'|'loop' }
  | { type:'assignRoute'; trainId:Id<'train'>; routeId:Id<'route'> };
export interface CommandEnvelope {sequence:number;command:GameCommand}
export type CommandResult={ok:true;createdIds:string[]}|{ok:false;reason:string};
export interface GameApplication {
  dispatch(command:CommandEnvelope):CommandResult;
  snapshot():Readonly<GameState>;
  previewTrack(curve:CubicCurve):EngineeringQuote;
}
export interface SaveStore {
  list():Promise<{id:string;name:string;modifiedAt:string}[]>;
  write(id:string,name:string,json:string):Promise<void>;
  read(id:string):Promise<string>;
  remove(id:string):Promise<void>;
}
/** Three.js adapter boundary. Renderer state never enters saves. */
export interface WorldRenderer {
  update(previous:Readonly<GameState>,current:Readonly<GameState>,alpha:number):void;
  pick(screenX:number,screenY:number):Vec3|null;
  focus(position:Vec3):void;
  dispose():void;
}
