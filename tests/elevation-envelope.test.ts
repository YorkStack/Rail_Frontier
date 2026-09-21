import {test} from 'node:test';
import assert from 'node:assert/strict';
import {elevationEnvelopes} from '../src/rail/elevation-envelope.js';
import {Heightfield} from '../src/world/terrain.js';
import {trackClasses} from '../src/content/track-classes.js';
import {generateWishCandidates} from '../src/rail/wish-corridor.js';
import {searchOrderedCorridor} from '../src/rail/ordered-corridor.js';
import {evaluateCorridorAlternatives} from '../src/rail/corridor-alternatives.js';
import {certifyVerticalProfile} from '../src/rail/vertical-profile.js';
import {derivative} from '../src/rail/constraints.js';

function twoHills(){
  const n=181,heights=new Float64Array(n*n);
  for(let z=0;z<n;z++)for(let x=0;x<n;x++)heights[z*n+x]=10+30*Math.exp(-(((x*25-1800)/600)**2))+18*Math.exp(-(((x*25-3100)/380)**2));
  const terrain=new Heightfield(n,n,25,heights),anchors=[250,4250].map(x=>({x,y:terrain.sample(x,2250).elevationM,z:2250}));
  return {terrain,anchors,trackClass:trackClasses.local,maxOffsetM:0,tangents:{start:{x:1,z:0},end:{x:1,z:0}}};
}

test('look-ahead heights respect both endpoints and discrete grade cones across uneven stations',()=>{
  const ground=[10,10,80,5,90,20],distances=[0,100,450,1200,1900,2400],before=[...ground];
  const profiles=elevationEnvelopes(ground,distances,10,20,.04);assert.equal(profiles.length,4);
  for(const profile of profiles){
    assert.equal(profile[0],10);assert.equal(profile.at(-1),20);
    for(let i=1;i<profile.length;i++)assert.ok(Math.abs(profile[i]!-profile[i-1]!)<=(distances[i]!-distances[i-1]!)*.04+1e-9);
  }
  assert.deepEqual(ground,before);assert.ok(profiles.some(profile=>profile[1]!>ground[1]!),'anticipates the first ridge');
  assert.deepEqual(elevationEnvelopes([0,0],[0,100],0,100,.04),[]);
  assert.deepEqual(elevationEnvelopes([0,NaN],[0,100],0,0,.04),[]);
  assert.deepEqual(elevationEnvelopes([0,0],[0,0],0,0,.04),[]);
});

test('adaptive heights offer a certified cheaper land route over successive hills',()=>{
  const request=twoHills(),candidates=generateWishCandidates(request);
  const choices=evaluateCorridorAlternatives(candidates,request.terrain,request.trackClass,true);
  const land=choices.find(c=>c.id.startsWith('wish:search:')&&c.structureM<1);assert.ok(land,'new land choice reaches the actual route comparison');
  const fixed=evaluateCorridorAlternatives(generateWishCandidates({...request,searchExpansionBudget:0}),request.terrain,request.trackClass,true);
  assert.ok(fixed.length);assert.ok(land.cost<Math.min(...fixed.map(c=>c.cost))*.8);
  const peaks=land.curves.map(c=>c.p0);assert.ok(peaks.some(p=>p.x<2200&&p.y>34));assert.ok(peaks.some(p=>p.x>2900&&p.x<3400&&p.y>22));const saddle=Math.min(...peaks.filter(p=>p.x>2400&&p.x<2900).map(p=>p.y)),secondPeak=Math.max(...peaks.filter(p=>p.x>2900&&p.x<3400).map(p=>p.y));assert.ok(secondPeak-saddle>1,'descends then climbs again between the two ridges');
  assert.ok(land.quotes.every(q=>q.valid));assert.equal(certifyVerticalProfile(land.curves,request.trackClass.constraints).valid,true);
  assert.deepEqual(land.curves[0]!.p0,request.anchors[0]);assert.deepEqual(land.curves.at(-1)!.p3,request.anchors.at(-1));
  assert.equal(derivative(land.curves[0]!,0).y,0);assert.equal(derivative(land.curves.at(-1)!,1).y,0);
});

test('refinement shares its budget, retains complete coarse paths on exhaustion and improves a certified price',()=>{
  const request=twoHills(),limited={...request,searchExpansionBudget:800},coarse=searchOrderedCorridor(limited),refined=searchOrderedCorridor(request);
  assert.equal(coarse.expansions,800);assert.equal(coarse.exhausted,true);assert.ok(coarse.paths.length>0);
  assert.equal(refined.exhausted,false);assert.ok(refined.expansions>coarse.expansions&&refined.expansions<=6000);assert.ok(refined.paths.length<=6);
  for(const path of [...coarse.paths,...refined.paths]){assert.deepEqual(path[0],request.anchors[0]);assert.deepEqual(path.at(-1),request.anchors.at(-1));}
  assert.ok(coarse.paths.slice(0,3).every(path=>refined.paths.some(other=>JSON.stringify(path)===JSON.stringify(other))));
  const prices=(input:typeof request)=>evaluateCorridorAlternatives(generateWishCandidates(input),request.terrain,request.trackClass,true).map(c=>c.cost);
  assert.ok(Math.min(...prices(request))<Math.min(...prices(limited)),'finer heights improve the actual certified quote, not just the search score');
});

test('adaptive proposals retain stricter regional and mainline engineering limits',()=>{
  const base=twoHills();
  for(const trackClass of [trackClasses.regional,trackClasses.mainline]){
    const candidates=generateWishCandidates({...base,trackClass});assert.ok(candidates.length);
    for(const candidate of candidates)assert.equal(certifyVerticalProfile(candidate.curves,trackClass.constraints).valid,true);
  }
});
