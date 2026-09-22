import {test} from 'node:test';
import assert from 'node:assert/strict';
import {followTarget} from '../src/rendering/follow-target.js';
import {createNorwayPreviewState} from '../src/content/norway-preview.js';
import {norway} from '../src/content/norway.js';
import {norwayV3WorldGenerator} from '../src/world/norway-generators.js';

const fixture=()=>createNorwayPreviewState(norwayV3WorldGenerator.generate(norway.world));
test('following requires a commissioned service with a real current track',()=>{
 const state=fixture(),train=state.trains[0]!;assert.equal(followTarget(state),train);
 for(const phase of ['running','dwelling','blocked'] as const){train.phase=phase;train.speedMps=0;assert.equal(followTarget(state),train);}
 train.phase='idle';assert.equal(followTarget(state),undefined);train.phase='running';train.routeId=null;assert.equal(followTarget(state),undefined);
 train.routeId=state.routes[0]!.id;train.motion.leg=999;assert.equal(followTarget(state),undefined);train.motion.leg=0;state.railway.edges=[];assert.equal(followTarget(state),undefined);
});
test('an explicit follow target never silently switches to another train',()=>{
 const state=fixture(),first=state.trains[0]!,second={...structuredClone(first),id:'train:99' as const};state.trains.push(second);
 assert.equal(followTarget(state,second.id),second);second.routeId=null;assert.equal(followTarget(state,second.id),undefined);assert.equal(followTarget(state),first);
 state.trains=[];assert.equal(followTarget(state),undefined);
});
