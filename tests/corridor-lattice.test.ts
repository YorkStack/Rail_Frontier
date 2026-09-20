import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Heightfield} from '../src/world/terrain.js';
import {searchCorridorLattice} from '../src/rail/corridor-lattice.js';
import {trackClasses} from '../src/content/track-classes.js';

const ridgeTerrain=()=>{const size=81,cellM=25,heights=new Float64Array(size*size);for(let z=0;z<size;z++)for(let x=0;x<size;x++){const distance=Math.hypot(x*cellM-1000,z*cellM-1000);heights[z*size+x]=Math.max(0,150-distance*.5);}return new Heightfield(size,size,cellM,heights);};

test('coarse-to-fine lattice is deterministic, bounded and preserves mandatory endpoints',()=>{
  const terrain=ridgeTerrain(),request={start:{x:100,y:0,z:1000},end:{x:1900,y:0,z:1000},terrain,trackClass:trackClasses.local,maxOffsetM:650,preference:'low-cost' as const},first=searchCorridorLattice(request),second=searchCorridorLattice(request);assert.ok(first);assert.deepEqual(first,second);assert.deepEqual(first[0],request.start);assert.deepEqual(first.at(-1),request.end);assert.ok(first.length<=128);assert.ok(first.slice(1,-1).every(point=>Math.abs(point.z-1000)<=650));
});

test('lattice preference can choose a detour while fast search crosses the ridge',()=>{
  const terrain=ridgeTerrain(),shared={start:{x:100,y:0,z:1000},end:{x:1900,y:0,z:1000},terrain,trackClass:trackClasses.local,maxOffsetM:650},lowCost=searchCorridorLattice({...shared,preference:'low-cost'}),fast=searchCorridorLattice({...shared,preference:'fast'});assert.ok(lowCost);assert.ok(fast);assert.notDeepEqual(lowCost,fast);assert.ok(lowCost.some(point=>Math.abs(point.z-1000)>250));assert.equal(fast.length,2);
});
