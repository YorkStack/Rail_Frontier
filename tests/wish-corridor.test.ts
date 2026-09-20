import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Heightfield} from '../src/world/terrain.js';
import {trackClasses} from '../src/content/track-classes.js';
import {generateWishCandidates} from '../src/rail/wish-corridor.js';
import {evaluateCorridorAlternatives} from '../src/rail/corridor-alternatives.js';
import {simplifyWishPath} from '../src/rail/wish-path.js';

test('wish heights do not pin the railway to a hill and real detours change engineering costs',()=>{
  const n=81,heights=new Float64Array(n*n);for(let z=0;z<n;z++)for(let x=0;x<n;x++)heights[z*n+x]=Math.max(0,40-Math.hypot(x*25-1000,z*25-1000)*.18);
  const terrain=new Heightfield(n,n,25,heights),anchors=[{x:100,y:0,z:1000},{x:1000,y:40,z:1000},{x:1900,y:0,z:1000}],request={anchors,terrain,trackClass:trackClasses.local,maxOffsetM:300};
  const curves=generateWishCandidates(request),same=generateWishCandidates({...request,anchors:anchors.map((p,i)=>({...p,y:i===1?10000:p.y}))});assert.deepEqual(curves,same);
  const choices=evaluateCorridorAlternatives(curves,terrain,trackClasses.local,true);assert.ok(choices.length>=2);assert.ok(choices.every(c=>c.quotes.every(q=>q.valid)));
  const bore=choices.find(c=>c.quotes.some(q=>q.intervals.some(s=>s.kind==='tunnel'))),detour=choices.find(c=>c.structureM===0);assert.ok(bore);assert.ok(detour);assert.ok(detour.cost<bore.cost);
  for(const c of choices){assert.deepEqual(c.curves[0]!.p0,anchors[0]);assert.deepEqual(c.curves.at(-1)!.p3,anchors.at(-1));}
});

test('jitter is removed but a large intentional bend is not replaced with the endpoint chord',()=>{
  const input=Array.from({length:30},(_,i)=>({x:i*20,y:200,z:i%2?1:-1})),reduced=simplifyWishPath(input,4);assert.equal(reduced.length,2);assert.deepEqual(reduced[0],input[0]);assert.deepEqual(reduced.at(-1),input.at(-1));
  const terrain=new Heightfield(81,81,25,new Float64Array(81*81)),anchors=[{x:100,y:0,z:200},{x:500,y:0,z:750},{x:1000,y:0,z:1000},{x:1500,y:0,z:750},{x:1900,y:0,z:200}],candidates=generateWishCandidates({anchors,terrain,trackClass:trackClasses.local,maxOffsetM:60});assert.ok(candidates.length);assert.ok(candidates.every(c=>!c.id.includes('relaxed')));assert.ok(candidates.every(c=>c.curves.some(curve=>curve.p0.z>700)));
});

test('impossible endpoint heights never become buildable by ignoring them',()=>{
  const terrain=new Heightfield(41,41,50,new Float64Array(41*41));assert.deepEqual(generateWishCandidates({anchors:[{x:100,y:0,z:1000},{x:1900,y:800,z:1000}],terrain,trackClass:trackClasses.local,maxOffsetM:60}),[]);
});

test('water crossing and land detour are genuinely different certified proposals',()=>{
  const n=81,heights=new Float64Array(n*n).fill(10);for(let z=0;z<n;z++)for(let x=0;x<n;x++)if(Math.hypot(x*25-1000,z*25-1000)<160)heights[z*n+x]=-10;
  const terrain=new Heightfield(n,n,25,heights,0),anchors=[{x:100,y:10,z:1000},{x:1900,y:10,z:1000}],candidates=generateWishCandidates({anchors,terrain,trackClass:trackClasses.local,maxOffsetM:300}),choices=evaluateCorridorAlternatives(candidates,terrain,trackClasses.local,true);
  const bridge=choices.find(c=>c.quotes.some(q=>q.intervals.some(s=>s.kind==='bridge'))),detour=choices.find(c=>c.structureM===0);assert.ok(bridge);assert.ok(detour);assert.ok(bridge.cost>detour.cost);assert.ok(bridge.lengthM<detour.lengthM);assert.ok(choices.every(c=>c.quotes.every(q=>q.valid)));
});
