import { test } from 'node:test';
import assert from 'node:assert/strict';
import { RailFrontierGame } from '../src/application/game.js';
import type { SaveStore } from '../src/application/ports.js';
import { GameSaveManager } from '../src/application/saves.js';
import { createInitialState } from '../src/content/norway.js';
import { Heightfield } from '../src/world/terrain.js';
import { deserialize,SAVE_LIMITS } from '../src/persistence/save.js';
import { campaignContentRegistry } from '../src/content/registry.js';
import {createFirstRailwayLearning} from '../src/ui/tutorial.js';

class MemoryStore implements SaveStore {
  slots=new Map<string,{name:string;json:string;modifiedAt:string}>();
  failNextWrite=false;
  async list(){return [...this.slots].map(([id,value])=>({id,name:value.name,modifiedAt:value.modifiedAt})).sort((a,b)=>b.modifiedAt.localeCompare(a.modifiedAt));}
  async write(id:string,name:string,json:string){if(this.failNextWrite){this.failNextWrite=false;throw new Error('Storage quota exceeded');}this.slots.set(id,{name,json,modifiedAt:String(this.slots.size).padStart(3,'0')});}
  async read(id:string){const value=this.slots.get(id);if(!value)throw new Error('Save slot does not exist');return value.json;}
  async remove(id:string){this.slots.delete(id);}
}
const setup=(learning=false)=>{const state=createInitialState();if(learning)state.learning=createFirstRailwayLearning(state);const game=new RailFrontierGame(state,new Heightfield(2,2,16000,new Float64Array(4))),store=new MemoryStore(),manager=new GameSaveManager(game,store,{campaignId:state.campaignId,campaignVersion:state.campaignVersion,worldGeneratorVersion:state.world.generatorVersion});return {game,store,manager};};

test('manual, autosave, list, continue and delete use transactional slots',async()=>{
  const {game,store,manager}=setup();await manager.save('manual','Before expansion');game.advance(1);await manager.autosave();
  assert.deepEqual((await manager.list()).map(slot=>slot.id),['autosave','manual']);
  game.advance(1);const restored=await manager.continueLatest();assert.equal(restored.tick,20);
  await manager.rename('manual','Western branch');assert.equal((await manager.list()).find(slot=>slot.id==='manual')?.name,'Western branch');
  await manager.remove('manual');assert.equal(store.slots.has('manual'),false);
});

test('corrupt and incompatible loads preserve the running game',async()=>{
  const {game,store,manager}=setup(),before=JSON.stringify(game.snapshot());
  store.slots.set('corrupt',{name:'Corrupt',json:'{',modifiedAt:'1'});await assert.rejects(()=>manager.load('corrupt'));assert.equal(JSON.stringify(game.snapshot()),before);
  const other=createInitialState();other.campaignId='other';const otherGame=new RailFrontierGame(other,new Heightfield(2,2,16000,new Float64Array(4))),otherStore=new MemoryStore(),otherManager=new GameSaveManager(otherGame,otherStore);await otherManager.save('other','Other');store.slots.set('other',otherStore.slots.get('other')!);
  await assert.rejects(()=>manager.load('other'),/not compatible/);assert.equal(JSON.stringify(game.snapshot()),before);
});

test('portable archive export and import preserve a canonical save and active introduction without replacing the running game',async()=>{
  const {game,store,manager}=setup(true);await manager.save('manual','Sundvik & Fjellhavn');const portable=await manager.exportSlot('manual');
  assert.equal(portable.filename,'Sundvik-Fjellhavn.railfrontier.json');const archive=JSON.parse(portable.json);assert.equal(archive.format,'rail-frontier-save');assert.equal(archive.formatVersion,1);assert.equal(archive.name,'Sundvik & Fjellhavn');
  game.advance(1);const running=JSON.stringify(game.snapshot()),imported=await manager.importArchive(portable.json);assert.equal(imported.name,'Sundvik & Fjellhavn');assert.equal(JSON.stringify(game.snapshot()),running);
  const saved=JSON.parse(await store.read(imported.id));assert.equal(saved.schemaVersion,11);assert.deepEqual(deserialize(JSON.stringify(saved)),archive.save.state);assert.equal(saved.state.learning.status,'active');
});

test('public import rejects malformed, incompatible and over-limit content before writing a slot',async()=>{
  const {game,store,manager}=setup(),before=JSON.stringify(game.snapshot());await assert.rejects(()=>manager.importArchive('{'),/not valid JSON/);
  const other=createInitialState();other.campaignId='other';const otherGame=new RailFrontierGame(other,new Heightfield(2,2,16000,new Float64Array(4))),otherStore=new MemoryStore(),otherManager=new GameSaveManager(otherGame,otherStore);await otherManager.save('other','Other');
  const otherJson=await otherStore.read('other');await assert.rejects(()=>manager.importArchive(otherJson),/not compatible/);
  const valid=JSON.parse((await manager.save('seed','Seed'),await store.read('seed')));valid.state.railway.nodes=Array.from({length:SAVE_LIMITS.nodes+1},()=>({}));
  await assert.rejects(()=>manager.importArchive(JSON.stringify(valid)),/rail node limit/);assert.deepEqual([...store.slots.keys()],['seed']);assert.equal(JSON.stringify(game.snapshot()),before);
  const unsupported=JSON.parse(await store.read('seed'));unsupported.state.world.widthM+=1;const guarded=new GameSaveManager(game,store,undefined,candidate=>{campaignContentRegistry.resolve(candidate);});await assert.rejects(()=>guarded.importArchive(JSON.stringify(unsupported)),/not compatible/);assert.deepEqual([...store.slots.keys()],['seed']);
});

test('a failed storage write does not poison later save operations or tutorial state',async()=>{
  const {game,store,manager}=setup(true);store.failNextWrite=true;await assert.rejects(()=>manager.save('first','First'),/quota/);assert.equal(game.snapshot().learning?.status,'active');await manager.save('second','Second');assert.deepEqual([...store.slots.keys()],['second']);
});


test('planning metadata follows manual/autosaves and portable archives; rejected writes preserve the previous draft',async()=>{
 const {game,store}=setup();let planning:import('../src/rail/planning-draft.js').PlanningDraft|null={version:1,current:{points:[{x:100,y:1,z:100}],complete:false,trackClassId:'local',design:null},past:[],future:[]};
 const manager=new GameSaveManager(game,store,undefined,undefined,{snapshot:()=>planning,restore:value=>{planning=value;}});
 await manager.save('draft','Railway sketch');planning.current.points[0]!.x=200;store.failNextWrite=true;await assert.rejects(()=>manager.save('draft','Railway sketch'));
 assert.equal((await manager.readDocument('draft')).planning!.current.points[0]!.x,100);assert.equal(planning.current.points[0]!.x,200);
 const exported=await manager.exportSlot('draft'),imported=await manager.importArchive(exported.json);assert.equal((await manager.readDocument(imported.id)).planning!.current.points[0]!.x,100);
 await manager.autosave();planning=null;await manager.load('autosave');assert.equal((planning as unknown as import('../src/rail/planning-draft.js').PlanningDraft).current.points[0]!.x,200);
});
