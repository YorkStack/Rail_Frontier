import {test} from 'node:test';
import assert from 'node:assert/strict';
import {ActiveSessionHost,type PreparedWorldRenderer,type WorldRendererFactory} from '../src/application/session-host.js';
import {ContentRegistry,type CampaignContent} from '../src/content/registry.js';
import {createInitialState} from '../src/content/norway.js';
import {Heightfield} from '../src/world/terrain.js';
import type {CampaignDefinition,GameState} from '../src/domain/model.js';
import {norwayBiome} from '../src/world/biome.js';
import type {WorldGenerator} from '../src/world/generator.js';

class FakeRenderer implements PreparedWorldRenderer {
  disposed=false;
  constructor(private readonly fail=false) {}
  async loadAssets(){if(this.fail)throw new Error('candidate asset failure');}
  update(){} pick(){return null;}pickEntity(){return null;}setSelection(){}setOverlay(){}focus(){}entry(){}
  dispose(){this.disposed=true;}
}
class FakeFactory implements WorldRendererFactory {
  created:FakeRenderer[]=[];presentations:string[]=[];failNext=false;disposed=false;
  create(_terrain:Heightfield,_state:GameState,entry:CampaignContent){this.presentations.push(entry.presentation.id);const renderer=new FakeRenderer(this.failNext);this.failNext=false;this.created.push(renderer);return renderer;}
  dispose(){this.disposed=true;}
}
const content=(campaign:CampaignDefinition):CampaignContent=>{const worldGenerator:WorldGenerator={id:'test',biomeId:campaign.world.biomeId,version:campaign.world.generatorVersion,landforms:{anchors:{},corridorX:()=>0,waterCrossSection:()=>({westBankX:null,eastBankX:null}),waterfall:null},validate(world){if(world.widthM!==campaign.world.widthM)throw new Error('wrong width');},elevation:()=>0,generate(){return new Heightfield(2,2,campaign.world.widthM,new Float64Array(4));}};return {campaign,presentation:{id:'test',rendererId:'test',assetManifestUrl:'/test.json',biome:norwayBiome,cameraPresets:{entry:{targetXZ:{x:0,z:0},offset:{x:1,y:1,z:1}}},entryCameraId:'entry',cameraSweep:[],proceduralScenery:'norway-fallback'},worldGenerator,validateWorld:worldGenerator.validate};};

test('session host stages a paused replacement before disposing the live renderer',async()=>{
  const initial=createInitialState(),factory=new FakeFactory(),host=new ActiveSessionHost(new ContentRegistry([content({id:initial.campaignId,version:initial.campaignVersion,title:'test',startingYear:1900,startingCash:1,world:initial.world,towns:[],objectives:[]})]),factory);
  await host.initialize(initial);const originalGame=host.game,originalRenderer=factory.created[0]!;assert.deepEqual(factory.presentations,['test']);
  const next=structuredClone(initial) as GameState;next.tick=17;
  await host.replace(next);
  assert.notEqual(host.game,originalGame);assert.equal(host.game.snapshot().tick,17);assert.equal(host.game.speed,0);assert.equal(originalRenderer.disposed,true);assert.equal(factory.created[1]!.disposed,false);
  host.dispose();assert.equal(factory.created[1]!.disposed,true);assert.equal(factory.disposed,true);
});

test('candidate failure preserves the active game and renderer',async()=>{
  const initial=createInitialState(),factory=new FakeFactory(),campaign={id:initial.campaignId,version:initial.campaignVersion,title:'test',startingYear:1900,startingCash:1,world:initial.world,towns:[],objectives:[]},host=new ActiveSessionHost(new ContentRegistry([content(campaign)]),factory);
  await host.initialize(initial);const originalGame=host.game,originalRenderer=host.renderer;factory.failNext=true;
  const next=structuredClone(initial) as GameState;next.tick=9;
  await assert.rejects(()=>host.replace(next),/candidate asset failure/);
  assert.equal(host.game,originalGame);assert.equal(host.renderer,originalRenderer);assert.equal(factory.created[1]!.disposed,true);assert.equal(factory.created[0]!.disposed,false);
});

test('content registry rejects unknown and modified world definitions',()=>{
  const initial=createInitialState(),registry=new ContentRegistry();assert.equal(registry.resolve(initial).campaign.id,initial.campaignId);
  assert.throws(()=>registry.resolve({...initial,campaignVersion:99}),/Unsupported campaign content/);
  assert.throws(()=>registry.resolve({...initial,world:{...initial.world,widthM:12000}}),/not compatible/);
});

test('content registry rejects a presentation for a different biome',()=>{
  const initial=createInitialState(),entry=content({id:initial.campaignId,version:initial.campaignVersion,title:'test',startingYear:1900,startingCash:1,world:{...initial.world,biomeId:'desert'},towns:[],objectives:[]});
  assert.throws(()=>new ContentRegistry([entry]),/content does not match/);
});

test('content registry composes a synthetic world generator without central dispatch',()=>{
  const initial=createInitialState(),campaign={id:'synthetic-world',version:1,title:'Synthetic',startingYear:1900,startingCash:1,world:initial.world,towns:[],objectives:[]},entry=content(campaign),registry=new ContentRegistry([entry]),resolved=registry.resolve({campaignId:campaign.id,campaignVersion:campaign.version,world:campaign.world});
  assert.equal(resolved.worldGenerator.id,'test');assert.equal(resolved.worldGenerator.generate(campaign.world).widthM,campaign.world.widthM);
});
