import type { GameState } from '../domain/model.js';
import { deserialize, serialize } from '../persistence/save.js';
import type { SaveStore } from './ports.js';
import type { RailFrontierGame } from './game.js';

export interface SaveCompatibility {campaignId:string;campaignVersion:number;worldGeneratorVersion:number}

export class GameSaveManager {
  constructor(private readonly game:RailFrontierGame,private readonly store:SaveStore,private readonly expected?:SaveCompatibility) {}
  list(){return this.store.list();}
  async save(id:string,name:string):Promise<void> {
    if(id.trim().length===0||name.trim().length===0)throw new Error('Save slot ID and name are required');
    await this.store.write(id,name,serialize(structuredClone(this.game.snapshot()) as GameState));
  }
  autosave(){return this.save('autosave','Autosave');}
  async load(id:string):Promise<Readonly<GameState>> {
    const candidate=deserialize(await this.store.read(id));
    if(this.expected&&(candidate.campaignId!==this.expected.campaignId||candidate.campaignVersion!==this.expected.campaignVersion||candidate.world.generatorVersion!==this.expected.worldGeneratorVersion))throw new Error('Save content is not compatible with this campaign');
    this.game.replaceState(candidate);return this.game.snapshot();
  }
  async continueLatest():Promise<Readonly<GameState>> {
    const latest=(await this.store.list())[0];if(!latest)throw new Error('No saved game is available');return this.load(latest.id);
  }
  remove(id:string){return this.store.remove(id);}
}
