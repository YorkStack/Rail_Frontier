import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createNorwayPreviewState} from '../src/content/norway-preview.js';
import {norwayV3} from '../src/content/norway.js';
import {generateNorwayV3World} from '../src/world/norway-v3.js';
import {generateNorwaySettlements,houseFinishes} from '../src/rendering/settlement-placement.js';

test('three deterministic Norway settlements use all curated finishes without overlap',()=>{
  const terrain=generateNorwayV3World(norwayV3.world),state=createNorwayPreviewState(terrain,norwayV3),a=generateNorwaySettlements(terrain,state),b=generateNorwaySettlements(terrain,state);assert.deepEqual(a,b);assert.equal(a.filter(item=>item.townId!==null).length,45);assert.equal(new Set(a.filter(item=>item.townId!==null).map(item=>item.composition)).size,3);
  for(const finish of houseFinishes)assert.ok(a.some(item=>item.assetId===`norway-house-${finish}`));
  for(let i=0;i<a.length;i++){const item=a[i]!,sample=terrain.sample(item.x,item.z);assert.equal(item.y,sample.elevationM);for(let j=0;j<i;j++){const other=a[j]!;if(item.composition==='industry'||other.composition==='industry')continue;assert.ok(Math.hypot(item.x-other.x,item.z-other.z)>=item.footprintRadiusM+other.footprintRadiusM+3);}}
});
