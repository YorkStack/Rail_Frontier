import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Heightfield} from '../src/world/terrain.js';
import {straightCurve} from '../src/content/norway-preview.js';
import {compileCurve,sampleDistance} from '../src/rail/geometry.js';
import {quoteTrack,engineeringSpans} from '../src/rail/planner.js';
import {MIN_TUNNEL_COVER_M} from '../src/content/engineering-rules.js';

test('shallow rock becomes an open cut; tunnel boundaries require cover for the complete portal',()=>{
 const heights=new Float64Array(11*11);for(let z=0;z<11;z++)for(let x=0;x<11;x++)heights[z*11+x]=10+Math.min(x,10-x)*3;
 const terrain=new Heightfield(11,11,20,heights),geometry=compileCurve(straightCurve({x:0,y:10,z:100},{x:200,y:10,z:100})),spans=engineeringSpans(quoteTrack(geometry,terrain));
 assert.deepEqual(spans.map(s=>s.kind),['ground','tunnel','ground']);
 for(const distance of [spans[1]!.startM,spans[1]!.endM]){const p=sampleDistance(geometry,distance);assert.ok(Math.abs(terrain.sample(p.x,p.z).elevationM-p.y-MIN_TUNNEL_COVER_M)<1e-6);}
 const shallow=new Heightfield(2,2,200,new Float64Array([17,17,17,17]));assert.ok(quoteTrack(geometry,shallow).intervals.every(i=>i.kind==='ground'));
});
