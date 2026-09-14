import { test } from 'node:test';
import assert from 'node:assert/strict';
import { certifyCurve,tangentCompatible } from '../src/rail/constraints.js';
import { Heightfield } from '../src/world/terrain.js';
import { generateFjordStudy } from '../src/world/fjord-study.js';
import { SeededRandom } from '../src/world/random.js';
import { createStudyState,studyCurve,studyStepper } from '../spikes/study-state.js';
import { serialize,deserialize } from '../src/persistence/save.js';
import { migrations } from '../src/persistence/save.js';
import { compileCurve } from '../src/rail/geometry.js';
import { quoteTrack,engineeringSpans } from '../src/rail/planner.js';
import { cubicRoots } from '../src/domain/curve-math.js';
import { RailNetwork } from '../src/rail/graph.js';
import { snapshotState } from '../src/application/snapshot.js';
import { emptyOperations,initialTownEconomy } from '../src/domain/operations.js';

test('terrain diagonal interpolation matches triangles rather than bilinear saddle',()=>{
  const terrain=new Heightfield(2,2,10,new Float64Array([0,0,0,10]));assert.equal(terrain.sample(5,5).elevationM,5);assert.equal(terrain.sample(7,3).elevationM,3);assert.equal(terrain.sample(3,7).elevationM,3);
});
test('seeded generation and RNG continuation are reproducible',()=>{
  const a=generateFjordStudy(123),b=generateFjordStudy(123),c=generateFjordStudy(124);
  assert.equal(a.sample(3333,2456).elevationM,b.sample(3333,2456).elevationM);assert.notEqual(a.sample(3333,2456).elevationM,c.sample(3333,2456).elevationM);
  const rng=new SeededRandom(100);rng.next();const loaded=new SeededRandom(rng.state);assert.equal(rng.next(),loaded.next());
});
test('study alignment has continuous tangents and certifiable railway curves',()=>{
  const state=createStudyState();for(const edge of state.railway.edges)assert.equal(certifyCurve(edge.curve).valid,true);
  assert.equal(tangentCompatible(studyCurve(850,1370),studyCurve(1370,2050)),true);
});
test('rail constraints reject a cusp, steep interior and tight bend',()=>{
  const cusp={p0:{x:0,y:0,z:0},p1:{x:100,y:0,z:0},p2:{x:-100,y:0,z:0},p3:{x:0,y:0,z:0}};assert.equal(certifyCurve(cusp).valid,false);
  const steep={p0:{x:0,y:0,z:0},p1:{x:100,y:50,z:0},p2:{x:200,y:50,z:0},p3:{x:300,y:0,z:0}};assert.equal(certifyCurve(steep).valid,false);
  const tight={p0:{x:0,y:0,z:0},p1:{x:10,y:0,z:0},p2:{x:10,y:0,z:10},p3:{x:20,y:0,z:10}};assert.equal(certifyCurve(tight).valid,false);
});
test('real study motion survives save/load through dwell and turnaround',()=>{
  const state=createStudyState(),step=studyStepper(state);for(let i=0;i<2200;i++)step();const loaded=deserialize(serialize(state)),other=studyStepper(loaded);
  for(let i=0;i<2200;i++){step();other();}assert.deepEqual(loaded,state);
});
test('triangle-aware planning detects a narrow flooded cell between coarse rail samples',()=>{
  const heights=new Float64Array(101*2).fill(0);heights[31]=-10;heights[132]=-10;
  const terrain=new Heightfield(101,2,1,heights,0);
  const geometry=compileCurve({p0:{x:0,y:1,z:.5},p1:{x:100/3,y:1,z:.5},p2:{x:200/3,y:1,z:.5},p3:{x:100,y:1,z:.5}},1000);
  assert.equal(geometry.samples.length,2);const quote=quoteTrack(geometry,terrain);assert.equal(quote.valid,false);assert.ok(quote.reasons.some(r=>r.includes('clearance')));assert.ok(engineeringSpans(quote).some(span=>span.kind==='bridge'));
});
test('cubic root isolation includes tangent contact with a boundary',()=>{
  // (t-.5)^2 represented in the cubic Bernstein basis.
  const roots=cubicRoots([.25,-1/12,-1/12,.25],0);assert.ok(roots.some(t=>Math.abs(t-.5)<1e-8));
});
test('schema 1 migrates without mutating legacy state; nonadvancing migrations fail',()=>{
  const state=createStudyState(),{operations,startingYear:_,...legacyState}=state,legacy={schemaVersion:1,gameVersion:'0.1.0',state:legacyState},json=JSON.stringify(legacy);
  const loaded=deserialize(json);assert.deepEqual(loaded,{...state,operations:emptyOperations(state.towns)});assert.equal(JSON.stringify(legacy),json);
  const migrate=migrations.get(1)!;migrations.set(1,value=>value);try{assert.throws(()=>deserialize(json),/advance/);}finally{migrations.set(1,migrate);}
});
test('schema 2 adds deterministic town economies without changing prior operations',()=>{
  const state=createStudyState(),{startingYear:_,...historicalState}=state,{townEconomy,delivered,...rest}=state.operations,{mail,...legacyDelivered}=delivered,operations={...rest,delivered:legacyDelivered},legacy={schemaVersion:2,gameVersion:'0.2.0',state:{...historicalState,operations}},json=JSON.stringify(legacy),loaded=deserialize(json);
  assert.deepEqual(loaded,{...state,operations:{...operations,townEconomy:initialTownEconomy(state.towns),delivered:{...legacyDelivered,mail:0}}});assert.equal(JSON.stringify(legacy),json);assert.equal(townEconomy!==undefined&&mail===0,true);
});
test('schema 3 adds mail delivery totals without changing prior town economy',()=>{
  const state=createStudyState(),{startingYear:_,...historicalState}=state,{mail,...legacyDelivered}=state.operations.delivered,legacy={schemaVersion:3,gameVersion:'0.3.0',state:{...historicalState,operations:{...state.operations,delivered:legacyDelivered}}},json=JSON.stringify(legacy),loaded=deserialize(json);
  assert.deepEqual(loaded,{...state,operations:{...state.operations,delivered:{...legacyDelivered,mail:0}}});assert.equal(JSON.stringify(legacy),json);assert.equal(mail,0);
});
test('schema 4 adds the campaign starting year without changing operational state',()=>{
  const state=createStudyState(),{startingYear,...historicalState}=state,legacy={schemaVersion:4,gameVersion:'0.4.0',state:historicalState},json=JSON.stringify(legacy),loaded=deserialize(json);
  assert.deepEqual(loaded,state);assert.equal(loaded.startingYear,1900);assert.equal(JSON.stringify(legacy),json);assert.equal(startingYear,1900);
});
test('schema 5 adds authoritative unelectrified infrastructure records',()=>{
  const state=createStudyState(),infrastructure=Object.fromEntries(state.railway.edges.map(edge=>{const length=compileCurve(edge.curve).lengthM;return [edge.id,{spans:[{startM:0,endM:length,kind:'ground'}],constructionCost:1000,maintenancePerDay:10}];})),legacy={schemaVersion:5,gameVersion:'0.5.0',state:{...state,operations:{...state.operations,infrastructure}}},json=JSON.stringify(legacy),loaded=deserialize(json);
  assert.equal(JSON.stringify(legacy),json);for(const item of Object.values(loaded.operations.infrastructure)){assert.equal(item.electrified,false);assert.equal(item.electrificationCost,0);assert.equal(item.electrificationMaintenancePerDay,0);}
});
test('save validation rejects conflicting edge reservations',()=>{
  const state=createStudyState();state.operations.reservations=[{edgeId:'edge:9',trainId:'train:15'},{edgeId:'edge:9',trainId:'train:15'}];assert.throws(()=>serialize(state),/Conflicting/);
});
test('network snapshot and UI snapshot remain isolated from subsequent mutations',()=>{
  const state=createStudyState(),network=new RailNetwork(state.railway),before=network.findPath('node:5','node:8'),snapshot=snapshotState(state);
  state.railway.edges=[];state.company.cash=0;assert.deepEqual(network.findPath('node:5','node:8'),before);assert.notEqual(snapshot.company.cash,0);assert.throws(()=>{snapshot.company.cash=1;});
});
