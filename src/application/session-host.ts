import type {GameState} from '../domain/model.js';
import type {Heightfield} from '../world/terrain.js';
import {validateState} from '../persistence/save.js';
import type {ContentRegistry} from '../content/registry.js';
import {RailFrontierGame} from './game.js';
import type {WorldRenderer} from './ports.js';

export interface PreparedWorldRenderer extends WorldRenderer {loadAssets():Promise<void>}
export interface WorldRendererFactory<Renderer extends PreparedWorldRenderer=PreparedWorldRenderer> {
  create(terrain:Heightfield,state:GameState):Renderer;
  dispose():void;
}
interface ActiveSession<Renderer extends PreparedWorldRenderer> {game:RailFrontierGame;terrain:Heightfield;renderer:Renderer}

/** Builds candidate sessions off-screen and publishes only fully prepared content. */
export class ActiveSessionHost<Renderer extends PreparedWorldRenderer=PreparedWorldRenderer> {
  private active:ActiveSession<Renderer>|null=null;
  private switching=false;
  constructor(private readonly registry:ContentRegistry,private readonly renderers:WorldRendererFactory<Renderer>) {}
  get game():RailFrontierGame {if(!this.active)throw new Error('Session host is not initialized');return this.active.game;}
  get renderer():Renderer {if(!this.active)throw new Error('Session host is not initialized');return this.active.renderer;}
  get terrain():Heightfield {if(!this.active)throw new Error('Session host is not initialized');return this.active.terrain;}
  async initialize(initial:GameState):Promise<void> {if(this.active)throw new Error('Session host is already initialized');this.active=await this.prepare(initial,1);}
  async replace(candidate:GameState):Promise<Readonly<GameState>> {
    if(!this.active)throw new Error('Session host is not initialized');
    if(this.switching)throw new Error('A session switch is already in progress');
    this.switching=true;
    try {
      const next=await this.prepare(candidate,0),previous=this.active;
      this.active=next;
      previous.renderer.dispose();
      return next.game.snapshot();
    } finally {this.switching=false;}
  }
  dispose():void {this.active?.renderer.dispose();this.active=null;this.renderers.dispose();}
  private async prepare(value:GameState,initialSpeed:0|1):Promise<ActiveSession<Renderer>> {
    const state=validateState(structuredClone(value)),content=this.registry.resolve(state),terrain=content.generateWorld(state.world),game=new RailFrontierGame(state,terrain,{initialSpeed}),renderer=this.renderers.create(terrain,state);
    try {await renderer.loadAssets();return {game,terrain,renderer};}
    catch(error){renderer.dispose();throw error;}
  }
}
