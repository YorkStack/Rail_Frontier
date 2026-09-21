import {test} from 'node:test';
import assert from 'node:assert/strict';
import {RouteDraftHistory} from '../src/rail/planning-draft.js';
import {serialize,deserializeDocument} from '../src/persistence/save.js';
import {createInitialState} from '../src/content/norway.js';
import {straightCurve} from '../src/content/norway-preview.js';

test('design choices, sketch edits and redo survive a detached save roundtrip without changing the company',()=>{
 const history=new RouteDraftHistory(),a={x:100,y:10,z:100},b={x:500,y:10,z:100};history.current={points:[a,b],complete:true,trackClassId:'local',design:[straightCurve(a,b)]};
 const initial=structuredClone(history.current);history.current.design![0]!.p1.z+=30;history.record(initial);
 assert.equal(history.undo(),true);const saved=history.snapshot()!,state=createInitialState(),loaded=deserializeDocument(serialize(state,saved));assert.deepEqual(loaded.state,state);
 const restored=new RouteDraftHistory();restored.restore(loaded.planning);assert.equal(restored.redo(),true);assert.equal(restored.current.design![0]!.p1.z,initial.design![0]!.p1.z+30);
 saved.current.points[0]!.x=900;assert.equal(restored.current.points[0]!.x,100);
});
test('version nine saves migrate with no draft; malformed and excessive planning payloads are rejected',()=>{
 const state=createInitialState(),old={schemaVersion:9,gameVersion:'0.9.0',state};assert.equal(deserializeDocument(JSON.stringify(old)).planning,null);
 const h=new RouteDraftHistory();h.current.points=[{x:100,y:1,z:100}];const valid=JSON.parse(serialize(state,h.snapshot()));
 for(const mutate of [(v:any)=>v.planning.current.points[0].x=-1,(v:any)=>v.planning.current.complete=true,(v:any)=>v.planning.current.trackClassId='fake',(v:any)=>v.planning.past=Array(31).fill(v.planning.current),(v:any)=>v.planning.current.points=Array(65).fill({x:1,y:1,z:1})]){const value=structuredClone(valid);mutate(value);assert.throws(()=>deserializeDocument(JSON.stringify(value)));}
});

test('loaded histories remain bounded even when both imported stacks are full',()=>{const h=new RouteDraftHistory(),draft={points:[{x:1,y:1,z:1}],complete:false,trackClassId:'local',design:null};h.restore({version:1,current:draft,past:Array(30).fill(draft),future:Array(30).fill(draft)});h.undo();assert.equal(h.future.length,30);h.redo();assert.equal(h.past.length,30);});
