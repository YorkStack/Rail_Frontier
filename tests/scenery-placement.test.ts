import {test} from 'node:test';
import assert from 'node:assert/strict';
import {norwayV3} from '../src/content/norway.js';
import {generateNorwayV3World} from '../src/world/norway-v3.js';
import {generateNorwayScenery} from '../src/rendering/scenery-placement.js';
import type {GameState,RailEdge,RailNode} from '../src/domain/model.js';

function input(){
  const terrain=generateNorwayV3World(norwayV3.world),state={world:norwayV3.world,railway:{nodes:[],edges:[],revision:0},towns:norwayV3.towns,industries:[],stations:[]} as unknown as GameState;return {terrain,state};
}

test('Norway scenery is deterministic, varied and respects masks',()=>{
  const {terrain,state}=input(),a=generateNorwayScenery(terrain,state,{trees:220,understorey:35,rocks:45}),b=generateNorwayScenery(terrain,state,{trees:220,understorey:35,rocks:45});assert.deepEqual(a,b);
  assert.equal(new Set(a.filter(item=>item.category==='tree').map(item=>item.assetId)).size,5);assert.ok(new Set(a.filter(item=>item.category==='rock').map(item=>item.assetId)).size>=4);
  for(const item of a){const sample=terrain.sample(item.x,item.z);assert.equal(item.y,sample.elevationM);assert.ok(item.y>1.6);if(item.category==='tree')assert.ok(sample.forest>=.18);if(item.category==='rock')assert.ok(sample.rock>=.2);}
});

test('new track removes only intersecting deterministic scenery',()=>{
  const {terrain,state}=input(),targets={trees:180,understorey:20,rocks:25},before=generateNorwayScenery(terrain,state,targets),chosen=before.find(item=>item.category==='tree')!;
  const from={id:'node:900',position:{x:chosen.x-45,y:chosen.y,z:chosen.z}} as RailNode,to={id:'node:901',position:{x:chosen.x+45,y:chosen.y,z:chosen.z}} as RailNode,edge={id:'edge:902',from:from.id,to:to.id,curve:{p0:from.position,p1:{x:chosen.x-15,y:chosen.y,z:chosen.z},p2:{x:chosen.x+15,y:chosen.y,z:chosen.z},p3:to.position},speedLimitMps:12,ownerId:'company:1'} as RailEdge;
  state.railway={nodes:[from,to],edges:[edge],revision:1};const after=generateNorwayScenery(terrain,state,targets),afterIds=new Set(after.map(item=>item.id));assert.equal(afterIds.has(chosen.id),false);
  const removed=before.filter(item=>!afterIds.has(item.id));assert.ok(removed.length>=1);for(const item of removed)assert.ok(Math.abs(item.z-chosen.z)<30||Math.abs(item.x-chosen.x)<60);
});

test('full Norway vegetation includes a bounded shrub layer and respects world edges',()=>{
 const {terrain,state}=input(),items=generateNorwayScenery(terrain,state),shrubs=items.filter(item=>item.category==='understorey');
 assert.equal(items.filter(item=>item.category==='tree').length,28000);assert.equal(shrubs.length,12000);assert.ok(shrubs.filter(item=>item.assetId==='norway-shrub').length>9000);
 for(const item of items){assert.ok(item.x>0&&item.x<terrain.widthM&&item.z>0&&item.z<terrain.depthM);assert.ok(state.towns.every(town=>Math.hypot(item.x-town.position.x,item.z-town.position.z)>=330));}
});
