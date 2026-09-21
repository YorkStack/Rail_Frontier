import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Heightfield} from '../src/world/terrain.js';
import {findCorridorAlternatives} from '../src/rail/corridor-alternatives.js';
import {trackClasses} from '../src/content/track-classes.js';

const flatTerrain=()=>new Heightfield(41,41,50,new Float64Array(41*41));
const ridgeTerrain=()=>{const size=41,width=2000,heights=new Float64Array(size*size);for(let z=0;z<size;z++)for(let x=0;x<size;x++){const px=x/(size-1)*width,pz=z/(size-1)*width,distance=Math.hypot(px-1000,pz-1000);heights[z*size+x]=Math.max(0,130-distance*.43);}return new Heightfield(size,size,width/(size-1),heights);};

test('bounded corridor alternatives are deterministic and never bypass exact certification',()=>{
  const request={anchors:[{x:100,y:0,z:1000},{x:1900,y:0,z:1000}],terrain:flatTerrain(),trackClass:trackClasses.local,maxOffsetM:500,candidateBudget:9},first=findCorridorAlternatives(request),second=findCorridorAlternatives({...request,terrain:flatTerrain()});
  assert.ok(first.length>=1&&first.length<=3);assert.deepEqual(first,second);assert.deepEqual([...new Set(first.flatMap(item=>item.recommendedFor))].sort(),['balanced','fast','low-cost']);assert.ok(first.every(item=>item.quotes.every(quote=>quote.valid)));
});

test('cost and speed preferences expose distinct truthful routes where terrain creates a tradeoff',()=>{
  const alternatives=findCorridorAlternatives({anchors:[{x:100,y:0,z:1000},{x:1900,y:0,z:1000}],terrain:ridgeTerrain(),trackClass:trackClasses.local,maxOffsetM:650,candidateBudget:9}),lowCost=alternatives.find(item=>item.recommendedFor.includes('low-cost')),fast=alternatives.find(item=>item.recommendedFor.includes('fast'));
  assert.ok(lowCost);assert.ok(fast);assert.notEqual(lowCost.id,fast.id);assert.ok(lowCost.cost<fast.cost);assert.ok(fast.estimatedTimeS<lowCost.estimatedTimeS);assert.ok(fast.structureM>lowCost.structureM);
});

test('an impossible elevation change remains a truthful empty result after a wider retry',()=>{
  const anchors=[{x:100,y:0,z:1000},{x:1900,y:200,z:1000}],terrain=flatTerrain();assert.deepEqual(findCorridorAlternatives({anchors,terrain,trackClass:trackClasses.local,maxOffsetM:650,candidateBudget:9,searchExpansionBudget:6_000}),[]);assert.deepEqual(findCorridorAlternatives({anchors,terrain,trackClass:trackClasses.local,maxOffsetM:1200,candidateBudget:15,searchExpansionBudget:12_000}),[]);
});

test('cooperative live-terrain review returns the same certified choices and prices',async()=>{
  const {generateWishCandidates}=await import('../src/rail/wish-corridor.js');
  const {evaluateCorridorAlternatives,evaluateCorridorAlternativesInSlices}=await import('../src/rail/corridor-alternatives.js');
  const terrain=ridgeTerrain(),standard=trackClasses.local,candidates=generateWishCandidates({anchors:[{x:100,y:0,z:1000},{x:1900,y:0,z:1000}],terrain,trackClass:standard,maxOffsetM:300});
  let yields=0;const scheduled=await evaluateCorridorAlternativesInSlices(candidates,terrain,standard,{isCurrent:()=>true,yieldToInput:async()=>{yields++;}});
  assert.ok(yields>0);assert.deepEqual(scheduled,evaluateCorridorAlternatives(candidates,terrain,standard,true));
  const all=await evaluateCorridorAlternativesInSlices(candidates,terrain,standard,{isCurrent:()=>true,keepAll:true});
  assert.deepEqual(all,candidates.flatMap(candidate=>evaluateCorridorAlternatives([candidate],terrain,standard,true)));
});

test('superseded cooperative reviews publish no partial or stale prices',async()=>{
  const {evaluateCorridorAlternativesInSlices}=await import('../src/rail/corridor-alternatives.js');
  const {straightCurve}=await import('../src/content/norway-preview.js');
  const terrain=flatTerrain(),candidate={id:'test',curves:[straightCurve({x:100,y:0,z:1000},{x:1900,y:0,z:1000})]};
  let current=true,checked=0;const original=terrain.sample.bind(terrain);terrain.sample=(x,z)=>{checked++;current=false;return original(x,z);};
  assert.equal(await evaluateCorridorAlternativesInSlices([candidate,candidate],terrain,trackClasses.local,{isCurrent:()=>current}),null);
  assert.ok(checked>0);checked=0;
  assert.equal(await evaluateCorridorAlternativesInSlices([candidate],terrain,trackClasses.local,{isCurrent:()=>false}),null);assert.equal(checked,0);
  current=true;assert.equal(await evaluateCorridorAlternativesInSlices([candidate],terrain,trackClasses.local,{isCurrent:()=>current,yieldToInput:async()=>{current=false;}}),null);assert.equal(checked,0);
});
