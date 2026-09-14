import type { GameState } from '../domain/model.js';
import { deserialize, serialize } from '../persistence/save.js';
import type { SaveStore } from './ports.js';
import type { RailFrontierGame } from './game.js';

export interface SaveCompatibility {campaignId:string;campaignVersion:number;worldGeneratorVersion:number}

export class GameSaveManager {
  private writes:Promise<void>=Promise.resolve();
  constructor(private readonly game:RailFrontierGame,private readonly store:SaveStore,private readonly expected?:SaveCompatibility) {}
  list(){return this.store.list();}
  async save(id:string,name:string):Promise<void> {
    if(id.trim().length===0||name.trim().length===0)throw new Error('Save slot ID and name are required');
    const json=serialize(structuredClone(this.game.snapshot()) as GameState);
    this.writes=this.writes.then(()=>this.store.write(id,name,json));
    await this.writes;
  }
  autosave(){return this.save('autosave','Autosave');}
  async load(id:string):Promise<Readonly<GameState>> {
    const candidate=await this.read(id);
    if(this.expected&&(candidate.campaignId!==this.expected.campaignId||candidate.campaignVersion!==this.expected.campaignVersion||candidate.world.generatorVersion!==this.expected.worldGeneratorVersion))throw new Error('Save content is not compatible with this campaign');
    this.game.replaceState(candidate);return this.game.snapshot();
  }
  async read(id:string):Promise<GameState> {return deserialize(await this.store.read(id));}
  async readLatest():Promise<GameState> {const latest=(await this.store.list())[0];if(!latest)throw new Error('No saved game is available');return this.read(latest.id);}
  async drain():Promise<void> {await this.writes;}
  async continueLatest():Promise<Readonly<GameState>> {
    const latest=(await this.store.list())[0];if(!latest)throw new Error('No saved game is available');return this.load(latest.id);
  }
  async rename(id:string,name:string):Promise<void> {
    if(name.trim().length===0)throw new Error('Save name is required');
    const json=await this.store.read(id);await this.store.write(id,name.trim(),json);
  }
  remove(id:string){return this.store.remove(id);}
}
