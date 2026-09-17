import { executeCommand, baseCommandHandlers, type CommandHandlers } from './commands.js';
import { constructionCommandHandlers } from './construction.js';
import { stationCommandHandlers } from './stations.js';
import { trainCommandHandlers } from './trains.js';
import { routeCommandHandlers } from './routes.js';
import { electrificationCommandHandlers } from './electrification.js';
import type { CommandEnvelope, CommandResult, GameApplication, WorldRenderer } from './ports.js';
import { snapshotState } from './snapshot.js';
import type { GameState, Speed } from '../domain/model.js';
import { validateState } from '../persistence/save.js';
import { compileCurve } from '../rail/geometry.js';
import { quoteTrack, type EngineeringQuote } from '../rail/planner.js';
import { SimulationClock } from '../simulation/clock.js';
import type { GridTerrain } from '../world/terrain.js';
import {EngineeredTerrain} from '../world/engineered-terrain.js';
import { createSimulationSystems } from '../simulation/systems.js';

export interface GameOptions {
  handlers?:CommandHandlers;
  stepSystems?:(state:GameState)=>void;
  initialSpeed?:Speed;
}

export interface FrameState {
  previous:Readonly<GameState>;
  current:Readonly<GameState>;
  alpha:number;
  steps:number;
  backlogSeconds:number;
}

export class RailFrontierGame implements GameApplication {
  private state:GameState;
  private published:Readonly<GameState>;
  private previousPublished:Readonly<GameState>;
  private readonly handlers:CommandHandlers;
  private readonly stepSystems:(state:GameState)=>void;
  private clock:SimulationClock;
  private runtimeSpeed:Speed;
  readonly terrain:EngineeredTerrain;

  constructor(initialState:GameState,baseTerrain:GridTerrain,options:GameOptions={}) {
    this.state=validateState(structuredClone(initialState));
    this.terrain=new EngineeredTerrain(baseTerrain,this.state.operations.terrain);
    this.published=snapshotState(this.state);
    this.previousPublished=this.published;
    this.handlers={...baseCommandHandlers,...constructionCommandHandlers,...stationCommandHandlers,...trainCommandHandlers,...routeCommandHandlers,...electrificationCommandHandlers,...options.handlers};
    this.stepSystems=options.stepSystems??createSimulationSystems();
    this.runtimeSpeed=options.initialSpeed??1;
    this.clock=new SimulationClock(()=>this.step());
  }

  get speed():Speed {return this.runtimeSpeed;}

  dispatch(envelope:CommandEnvelope):CommandResult {
    const expected=this.state.operations.lastCommandSequence+1;
    if(!Number.isSafeInteger(envelope.sequence)||envelope.sequence!==expected)return {ok:false,reason:`Expected command sequence ${expected}`};
    try {
      const working=structuredClone(this.state);
      const effect=executeCommand(working,envelope.command,{terrain:this.terrain,speed:this.runtimeSpeed},this.handlers);
      working.operations.lastCommandSequence=envelope.sequence;
      const committed=validateState(working);
      this.terrain.publish(committed.operations.terrain);
      this.state=committed;
      this.previousPublished=this.published;
      this.published=snapshotState(committed);
      if(effect.speed!==undefined)this.runtimeSpeed=effect.speed;
      return {ok:true,createdIds:[...effect.createdIds]};
    } catch(error) {
      return {ok:false,reason:error instanceof Error?error.message:String(error)};
    }
  }

  snapshot():Readonly<GameState> {return this.published;}

  previewTrack(curve:Parameters<typeof compileCurve>[0]):EngineeringQuote {
    return quoteTrack(compileCurve(curve),this.terrain);
  }

  advance(realSeconds:number,maxSteps=240):FrameState {
    const result=this.clock.advance(realSeconds,this.runtimeSpeed,maxSteps);
    return {previous:this.previousPublished,current:this.published,...result};
  }

  pauseForVisibility():void {this.runtimeSpeed=0;}

  replaceState(nextState:GameState):void {
    this.state=validateState(structuredClone(nextState));this.terrain.publish(this.state.operations.terrain);
    this.published=snapshotState(this.state);
    this.previousPublished=this.published;
    this.runtimeSpeed=0;
    this.clock=new SimulationClock(()=>this.step());
  }

  private step():void {
    this.previousPublished=this.published;
    this.state.tick++;
    this.stepSystems(this.state);
    this.published=snapshotState(this.state);
  }
}

export interface AnimationEnvironment {
  now():number;
  requestFrame(callback:(time:number)=>void):number;
  cancelFrame(id:number):void;
  hidden():boolean;
  listenVisibility(callback:()=>void):()=>void;
}

export function browserAnimationEnvironment():AnimationEnvironment {
  return {
    now:()=>performance.now(),
    requestFrame:callback=>requestAnimationFrame(callback),
    cancelFrame:id=>cancelAnimationFrame(id),
    hidden:()=>document.hidden,
    listenVisibility:callback=>{document.addEventListener('visibilitychange',callback);return ()=>document.removeEventListener('visibilitychange',callback);}
  };
}

/** Owns RAF, visibility timing and renderer disposal for one production session. */
export class GameSession {
  private request:number|null=null;
  private last=0;
  private removeVisibility:(()=>void)|null=null;
  private disposed=false;
  constructor(readonly game:RailFrontierGame,private readonly renderer:WorldRenderer,private readonly environment:AnimationEnvironment=browserAnimationEnvironment()) {}
  start():void {
    if(this.disposed)throw new Error('Session is disposed');
    if(this.request!==null)return;
    this.last=this.environment.now();
    this.removeVisibility=this.environment.listenVisibility(()=>this.visibilityChanged());
    this.request=this.environment.requestFrame(time=>this.frame(time));
  }
  stop():void {
    if(this.request!==null)this.environment.cancelFrame(this.request);
    this.request=null;
    this.removeVisibility?.();
    this.removeVisibility=null;
  }
  dispose():void {
    if(this.disposed)return;
    this.stop();
    this.renderer.dispose();
    this.disposed=true;
  }
  private visibilityChanged():void {
    this.last=this.environment.now();
    if(this.environment.hidden())this.game.pauseForVisibility();
  }
  private frame(time:number):void {
    if(this.request===null)return;
    const delta=Math.max(0,(time-this.last)/1000);
    this.last=time;
    const state=this.game.advance(delta);
    this.renderer.update(state.previous,state.current,this.game.speed===0?1:state.alpha);
    this.request=this.environment.requestFrame(next=>this.frame(next));
  }
}
