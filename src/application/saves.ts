import type { GameState } from '../domain/model.js';
import type {PlanningDraft} from '../rail/planning-draft.js';
import { deserialize, deserializeDocument, serialize } from '../persistence/save.js';
import type { SaveStore } from './ports.js';
import type { RailFrontierGame } from './game.js';

export interface SaveCompatibility {campaignId:string;campaignVersion:number;worldGeneratorVersion:number}
export interface PortableSave {filename:string;json:string}
const ARCHIVE_FORMAT='rail-frontier-save',ARCHIVE_VERSION=1,MAX_ARCHIVE_BYTES=20_100_000;
const archiveSchema=(value:unknown):{name:string;save:unknown}|null=>{
  if(typeof value!=='object'||value===null||Array.isArray(value))return null;const archive=value as Record<string,unknown>;
  if(archive.format!==ARCHIVE_FORMAT)return null;
  if(archive.formatVersion!==ARCHIVE_VERSION||typeof archive.name!=='string'||archive.name.trim().length===0||archive.name.trim().length>48||!('save' in archive))throw new Error('Unsupported Rail Frontier archive');
  return {name:archive.name.trim(),save:archive.save};
};
const safeFilename=(value:string):string=>value.normalize('NFKD').replace(/[^a-zA-Z0-9_-]+/g,'-').replace(/^-+|-+$/g,'').slice(0,64)||'rail-frontier-save';
const saveName=(value:string):string=>{const name=value.trim();if(name.length===0)throw new Error('Save name is required');if(name.length>48)throw new Error('Save name cannot exceed 48 characters');return name;};

export class GameSaveManager {
  private writes:Promise<void>=Promise.resolve();
  constructor(private readonly game:RailFrontierGame,private readonly store:SaveStore,private readonly expected?:SaveCompatibility,private readonly validateContent?:(state:GameState)=>void,private readonly planning?:{snapshot:()=>PlanningDraft|null;restore:(draft:PlanningDraft|null)=>void}) {}
  async list(){await this.drain();return this.store.list();}
  estimate(){return this.store.estimate?.()??Promise.resolve({usageBytes:null,quotaBytes:null});}
  async save(id:string,name:string):Promise<void> {
    if(id.trim().length===0||id.length>128)throw new Error('Save slot ID is invalid');const normalizedName=saveName(name);
    const json=serialize(structuredClone(this.game.snapshot()) as GameState,this.planning?.snapshot()??null);
    await this.queueWrite(()=>this.store.write(id,normalizedName,json));
  }
  autosave(){return this.save('autosave','Autosave');}
  async load(id:string):Promise<Readonly<GameState>> {
    const document=await this.readDocument(id),candidate=document.state;
    this.assertCompatible(candidate);
    this.game.replaceState(candidate);this.planning?.restore(document.planning);return this.game.snapshot();
  }
  async readDocument(id:string){await this.drain();return deserializeDocument(await this.store.read(id));}
  async read(id:string):Promise<GameState> {await this.drain();return deserialize(await this.store.read(id));}
  async readLatest():Promise<GameState> {const latest=(await this.list())[0];if(!latest)throw new Error('No saved game is available');return this.read(latest.id);}
  async drain():Promise<void> {await this.writes;}
  async continueLatest():Promise<Readonly<GameState>> {
    const latest=(await this.list())[0];if(!latest)throw new Error('No saved game is available');return this.load(latest.id);
  }
  async rename(id:string,name:string):Promise<void> {
    const normalizedName=saveName(name);await this.drain();const json=await this.store.read(id);await this.queueWrite(()=>this.store.write(id,normalizedName,json));
  }
  async exportSlot(id:string):Promise<PortableSave> {
    const slot=(await this.list()).find(item=>item.id===id);if(!slot)throw new Error('Save slot does not exist');
    const document=await this.readDocument(id),canonical=serialize(document.state,document.planning),archive={format:ARCHIVE_FORMAT,formatVersion:ARCHIVE_VERSION,name:slot.name,exportedAt:new Date().toISOString(),save:JSON.parse(canonical)};
    return {filename:`${safeFilename(slot.name)}.railfrontier.json`,json:JSON.stringify(archive)};
  }
  async importArchive(json:string,fallbackName='Imported company'):Promise<{id:string;name:string}> {
    if(new TextEncoder().encode(json).byteLength>MAX_ARCHIVE_BYTES)throw new Error('Archive exceeds 20 MB save limit');
    let value:unknown;try{value=JSON.parse(json);}catch{throw new Error('Archive is not valid JSON');}
    const archive=archiveSchema(value),name=archive?.name??(fallbackName.trim().slice(0,48)||'Imported company'),saveJson=archive?JSON.stringify(archive.save):json,document=deserializeDocument(saveJson),candidate=document.state;this.assertCompatible(candidate);
    const canonical=serialize(candidate,document.planning),existing=new Set((await this.list()).map(slot=>slot.id)),base=`import-${Date.now()}`;let id=base,suffix=1;while(existing.has(id))id=`${base}-${suffix++}`;
    await this.queueWrite(()=>this.store.write(id,name,canonical));return {id,name};
  }
  async remove(id:string):Promise<void> {await this.drain();await this.queueWrite(()=>this.store.remove(id));}
  private assertCompatible(candidate:GameState):void {
    if(this.expected&&(candidate.campaignId!==this.expected.campaignId||candidate.campaignVersion!==this.expected.campaignVersion||candidate.world.generatorVersion!==this.expected.worldGeneratorVersion))throw new Error('Save content is not compatible with this campaign');
    this.validateContent?.(candidate);
  }
  private queueWrite(operation:()=>Promise<void>):Promise<void> {const pending=this.writes.then(operation);this.writes=pending.catch(()=>undefined);return pending;}
}
