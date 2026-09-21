import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Heightfield} from '../src/world/terrain.js';
import {trackClasses} from '../src/content/track-classes.js';
import {searchOrderedCorridor,followsOrderedCorridor} from '../src/rail/ordered-corridor.js';
import {generateWishCandidates} from '../src/rail/wish-corridor.js';
import {evaluateCorridorAlternatives} from '../src/rail/corridor-alternatives.js';
import {solveHorizontalAlignment} from '../src/rail/alignment-solver.js';

const flat=()=>new Heightfield(121,121,25,new Float64Array(121*121).fill(10));
const point=(x:number,z:number,y=10)=>({x,y,z});

test('ordered intent rejects a nearby shortcut that skips the return loop',()=>{
  const wish=[point(400,400),point(2200,400),point(2500,700),point(2200,1000),point(400,1000)];
  const shortcut=solveHorizontalAlignment([wish[0]!,wish.at(-1)!]);
  assert.equal(followsOrderedCorridor(shortcut,wish,650),false);
  // The same places in a different order must not pass a nearest-distance check.
  const wrongOrder=solveHorizontalAlignment([wish[0]!,wish[3]!,wish[2]!,wish[1]!,wish.at(-1)!]);
  assert.equal(followsOrderedCorridor(wrongOrder,wish,60),false);
  assert.equal(followsOrderedCorridor(solveHorizontalAlignment(wish),wish,150),true);
});

test('a shallow but long doubled-back wish cannot become an explicitly relaxed chord',()=>{
  const terrain=flat(),anchors=[point(200,1000),point(2400,1000),point(2400,1100),point(400,1100)];
  const candidates=generateWishCandidates({anchors,terrain,trackClass:trackClasses.local,maxOffsetM:60});
  assert.ok(candidates.every(c=>!c.id.startsWith('wish:relaxed:')));
  assert.ok(candidates.every(c=>followsOrderedCorridor(c.curves,anchors,60)));
});

test('search follows a broad return bend in order and keeps exact endpoints',()=>{
  const terrain=flat(),anchors=[point(400,400),point(1600,400),point(2200,800),point(1600,1400),point(400,1400)];
  const request={anchors,terrain,trackClass:trackClasses.local,maxOffsetM:300};
  const searched=searchOrderedCorridor(request);
  assert.ok(searched.paths.length);assert.ok(searched.expansions<=6000);
  for(const path of searched.paths){assert.deepEqual(path[0],anchors[0]);assert.deepEqual(path.at(-1),anchors.at(-1));assert.ok(path.some(p=>p.x>2000));}
  const candidates=generateWishCandidates(request);assert.ok(candidates.length);
  assert.ok(candidates.every(c=>followsOrderedCorridor(c.curves,anchors,300)));
});

test('alternating obstacles produce a certified affordable land route on opposite sides',()=>{
  const n=121,heights=new Float64Array(n*n).fill(10);
  for(let z=0;z<n;z++)for(let x=0;x<n;x++)if(Math.hypot(x*25-1050,(z*25-1390)*.8)<210||Math.hypot(x*25-1950,(z*25-1610)*.8)<210)heights[z*n+x]=-20;
  const terrain=new Heightfield(n,n,25,heights,0),anchors=[point(300,1500),point(2700,1500)],request={anchors,terrain,trackClass:trackClasses.local,maxOffsetM:300};
  const candidates=generateWishCandidates(request),choices=evaluateCorridorAlternatives(candidates,terrain,trackClasses.local,true);
  const detour=choices.find(c=>c.id.startsWith('wish:search:')&&c.structureM===0),bridge=choices.find(c=>c.structureM>0);
  assert.ok(detour);assert.ok(bridge);assert.ok(detour.cost<bridge.cost);
  assert.ok(detour.curves.some(c=>c.p0.z>1700));assert.ok(detour.curves.some(c=>c.p0.z<1300));
  assert.ok(detour.quotes.every(q=>q.valid));assert.ok(followsOrderedCorridor(detour.curves,anchors,300));
});

test('pointer sample density and intermediate pointer heights do not change search',()=>{
  const terrain=flat(),anchors=[point(300,500),point(2500,500)],request={anchors,terrain,trackClass:trackClasses.local,maxOffsetM:60};
  const dense=Array.from({length:101},(_,i)=>point(300+22*i,500,i===0||i===100?10:10000));
  assert.deepEqual(searchOrderedCorridor({...request,anchors:dense}),searchOrderedCorridor(request));
});

test('exhausted budgets return no partial route and impossible grades remain unbuildable',()=>{
  const terrain=flat(),anchors=[point(300,500),point(2500,500)],request={anchors,terrain,trackClass:trackClasses.local,maxOffsetM:60};
  for(const budget of [0,1,10]){const result=searchOrderedCorridor({...request,searchExpansionBudget:budget});assert.equal(result.expansions,budget);assert.equal(result.exhausted,true);assert.deepEqual(result.paths,[]);}
  const impossible=searchOrderedCorridor({...request,anchors:[anchors[0]!,point(2500,500,900)]});assert.deepEqual(impossible.paths,[]);
  assert.deepEqual(searchOrderedCorridor({...request,searchExpansionBudget:NaN}).paths,[]);
});
