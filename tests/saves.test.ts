import { test } from 'node:test';
import assert from 'node:assert/strict';
import { RailFrontierGame } from '../src/application/game.js';
import type { SaveStore } from '../src/application/ports.js';
import { GameSaveManager } from '../src/application/saves.js';
import { createInitialState } from '../src/content/norway.js';
import { Heightfield } from '../src/world/terrain.js';

class MemoryStore implements SaveStore {
  slots=new Map<string,{name:string;json:string;modifiedAt:string}>();
  async list(){return [...this.slots].map(([id,value])=>({id,name:value.name,modifiedAt:value.modifiedAt})).sort((a,b)=>b.modifiedAt.localeCompare(a.modifiedAt));}
  async write(id:string,name:string,json:string){this.slots.set(id,{name,json,modifiedAt:String(this.slots.size).padStart(3,'0')});}
  async read(id:string){const value=this.slots.get(id);if(!value)throw new Error('Save slot does not exist');return value.json;}
  async remove(id:string){this.slots.delete(id);}
}
const setup=()=>{const state=createInitialState(),game=new RailFrontierGame(state,new Heightfield(2,2,16000,new Float64Array(4))),store=new MemoryStore(),manager=new GameSaveManager(game,store,{campaignId:state.campaignId,campaignVersion:state.campaignVersion,worldGeneratorVersion:state.world.generatorVersion});return {game,store,manager};};

test('manual, autosave, list, continue and delete use transactional slots',async()=>{
  const {game,store,manager}=setup();await manager.save('manual','Before expansion');game.advance(1);await manager.autosave();
  assert.deepEqual((await manager.list()).map(slot=>slot.id),['autosave','manual']);
  game.advance(1);const restored=await manager.continueLatest();assert.equal(restored.tick,20);
  await manager.remove('manual');assert.equal(store.slots.has('manual'),false);
});

test('corrupt and incompatible loads preserve the running game',async()=>{
  const {game,store,manager}=setup(),before=JSON.stringify(game.snapshot());
  store.slots.set('corrupt',{name:'Corrupt',json:'{',modifiedAt:'1'});await assert.rejects(()=>manager.load('corrupt'));assert.equal(JSON.stringify(game.snapshot()),before);
  const other=createInitialState();other.campaignId='other';const otherGame=new RailFrontierGame(other,new Heightfield(2,2,16000,new Float64Array(4))),otherStore=new MemoryStore(),otherManager=new GameSaveManager(otherGame,otherStore);await otherManager.save('other','Other');store.slots.set('other',otherStore.slots.get('other')!);
  await assert.rejects(()=>manager.load('other'),/not compatible/);assert.equal(JSON.stringify(game.snapshot()),before);
});
