import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Heightfield} from '../src/world/terrain.js';
import {straightCurve} from '../src/content/norway-preview.js';
import {engineeringChallenges,localEngineeringCandidates} from '../src/rail/engineering-challenges.js';
import {trackClasses} from '../src/content/track-classes.js';
import {tangentCompatible} from '../src/rail/constraints.js';
import {evaluateCorridorAlternatives} from '../src/rail/corridor-alternatives.js';

test('local obstacle choices preserve the prefix, suffix, nonzero boundary grades and current baseline',()=>{
  const n=201,heights=new Float64Array(n*n).fill(10);
  for(let z=0;z<n;z++)for(let x=0;x<n;x++)heights[z*n+x]=Math.hypot(x*25-2500,z*25-2500)<120?-10:10+x*.25;
  const terrain=new Heightfield(n,n,25,heights,0),curves=Array.from({length:16},(_,i)=>straightCurve({x:500+i*250,y:15+i*2.5,z:2500},{x:750+i*250,y:17.5+i*2.5,z:2500})),challenges=engineeringChallenges(curves,terrain,trackClasses.local);
  assert.equal(challenges.length,1);const challenge=challenges[0]!;assert.equal(challenge.wholeRoute,false);assert.ok(challenge.fromCurve>0&&challenge.toCurve<15);
  const choices=localEngineeringCandidates(curves,challenge,terrain,trackClasses.local);assert.ok(choices.length>=2);assert.deepEqual(choices[0]!.curves,curves);
  for(const choice of choices){assert.deepEqual(choice.curves.slice(0,challenge.fromCurve),curves.slice(0,challenge.fromCurve));const suffix=curves.slice(challenge.toCurve+1);assert.deepEqual(choice.curves.slice(-suffix.length),suffix);assert.ok(choice.curves.every((c,i)=>i===0||tangentCompatible(choice.curves[i-1]!,c,1e-5)));assert.equal(evaluateCorridorAlternatives([choice],terrain,trackClasses.local,true).length,1);}
  assert.deepEqual(localEngineeringCandidates(curves,{...challenge,toCurve:15},terrain,trackClasses.local),[]);
});
