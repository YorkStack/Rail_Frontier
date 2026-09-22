import { test } from 'node:test';
import assert from 'node:assert/strict';
import { compileCurve, sampleDistance, distance } from '../src/rail/geometry.js';
import { compileGraph, findPath } from '../src/rail/graph.js';
import { Heightfield } from '../src/world/terrain.js';
import { quoteTrack } from '../src/rail/planner.js';
import { SimulationClock, FIXED_DT } from '../src/simulation/clock.js';
import { advanceMotion, motionPosition } from '../src/simulation/motion.js';
import { createInitialState } from '../src/content/norway.js';
import { allocateId, type CubicCurve, type GameState, type RailGraph, type Vec3 } from '../src/domain/model.js';
import { serialize, deserialize } from '../src/persistence/save.js';

const line=(p0:Vec3,p3:Vec3):CubicCurve=>({p0,p1:{x:(2*p0.x+p3.x)/3,y:(2*p0.y+p3.y)/3,z:(2*p0.z+p3.z)/3},p2:{x:(p0.x+2*p3.x)/3,y:(p0.y+2*p3.y)/3,z:(p0.z+2*p3.z)/3},p3});
function network():RailGraph {
  const nodes=[{id:'node:5' as const,position:{x:0,y:10,z:0}},{id:'node:6' as const,position:{x:100,y:10,z:0}},{id:'node:7' as const,position:{x:200,y:10,z:0}}];
  return {nodes,revision:1,edges:[{id:'edge:8',from:'node:5',to:'node:6',curve:line(nodes[0]!.position,nodes[1]!.position),speedLimitMps:20,ownerId:'company:1'},{id:'edge:9',from:'node:6',to:'node:7',curve:line(nodes[1]!.position,nodes[2]!.position),speedLimitMps:20,ownerId:'company:1'}]};
}
export function fixture():GameState {
  const state=createInitialState();state.railway=network();state.nextEntityId=15;
  state.stations=[{id:'station:10',nodeId:'node:5',townId:'town:2',classId:'rural-halt',storage:[],layout:{kind:'legacy-node',version:1},constructionCost:2_500_000},{id:'station:11',nodeId:'node:7',townId:'town:3',classId:'rural-halt',storage:[],layout:{kind:'legacy-node',version:1},constructionCost:2_500_000}];
  state.routes=[{id:'route:12',stops:['station:10','station:11'],mode:'shuttle'}];
  state.trains=[{id:'train:13',routeId:'route:12',locomotiveId:'nord-2-6-0',vehicleIds:['fjord-passenger-coach'],motion:{path:findPath(state.railway,'node:5','node:7')!,leg:0,distanceM:0,arrived:false},speedMps:10,phase:'running',dwellTicks:0,cargo:[{kind:'passengers',quantity:12,originId:'station:10',destinationId:'station:11',loadedTick:0,distanceM:0}]}];
  state.company.ledger=[{id:'transaction:14',tick:0,category:'construction',amount:-100000,entityId:'edge:8',description:'Test construction'}];state.company.cash-=100000;
  return state;
}
test('triangle terrain handles exact boundaries and rejects off-map queries',()=>{
  const terrain=new Heightfield(2,2,10,new Float64Array([0,10,20,30]));
  assert.equal(terrain.sample(5,5).elevationM,15);assert.equal(terrain.sample(10,10).elevationM,30);
  assert.throws(()=>terrain.sample(-1,0));assert.throws(()=>terrain.sample(NaN,0));
});
test('terrain copies its input so external mutation cannot change queries',()=>{
  const data=new Float64Array(4);const terrain=new Heightfield(2,2,10,data);data.fill(50);assert.equal(terrain.sample(5,5).elevationM,0);
});
test('arc length sampling matches straight-line metres',()=>{
  const geometry=compileCurve(line({x:0,y:0,z:0},{x:100,y:0,z:0}));
  assert.ok(Math.abs(geometry.lengthM-100)<1e-9);assert.ok(Math.abs(sampleDistance(geometry,37).x-37)<1e-8);
});
test('curved arc length converges against dense reference integration',()=>{
  const curve={p0:{x:0,y:0,z:0},p1:{x:80,y:1,z:0},p2:{x:100,y:2,z:70},p3:{x:150,y:3,z:100}};
  const compiled=compileCurve(curve), reference=compileCurve(curve,0.05,0.00001);
  assert.ok(Math.abs(compiled.lengthM-reference.lengthM)<0.05);
  assert.ok(distance(sampleDistance(compiled,compiled.lengthM),curve.p3)<1e-8);
});
test('degenerate curves and non-finite inputs are rejected',()=>{
  const p={x:0,y:0,z:0};assert.throws(()=>compileCurve(line(p,p)));assert.throws(()=>compileCurve(line(p,{x:Infinity,y:0,z:0})));
});
test('routing supports reverse traversal and disconnected graphs',()=>{
  const graph=network();assert.deepEqual(findPath(graph,'node:7','node:5'),[{edgeId:'edge:9',reverse:true},{edgeId:'edge:8',reverse:true}]);
  graph.edges=[];assert.equal(findPath(graph,'node:5','node:7'),null);
});
test('routing minimizes travel time rather than number of edges',()=>{
  const graph=network();graph.edges.push({id:'edge:10',from:'node:5',to:'node:7',curve:line(graph.nodes[0]!.position,graph.nodes[2]!.position),speedLimitMps:1,ownerId:'company:1'});
  assert.equal(findPath(graph,'node:5','node:7')!.length,2);
});
test('graph rejects endpoints that disagree with geometric connections',()=>{
  const graph=network();graph.edges[0]!.curve.p0={x:10,y:10,z:0};assert.throws(()=>compileGraph(graph));
});
test('rail quote distinguishes ground, water bridge and buried tunnel',()=>{
  const curve=compileCurve(line({x:0,y:5,z:0},{x:100,y:5,z:0}));
  const ground=quoteTrack(curve,new Heightfield(2,2,100,new Float64Array(4).fill(4)));
  const bridge=quoteTrack(curve,new Heightfield(2,2,100,new Float64Array(4).fill(-20),0));
  const tunnel=quoteTrack(curve,new Heightfield(2,2,100,new Float64Array(4).fill(50)));
  assert.ok(ground.valid&&bridge.valid&&tunnel.valid);assert.equal(ground.intervals[0]!.kind,'ground');assert.equal(bridge.intervals[0]!.kind,'bridge');assert.equal(tunnel.intervals[0]!.kind,'tunnel');assert.ok(tunnel.cost>bridge.cost&&bridge.cost>ground.cost);
});
test('unsafe grades and underwater rail cannot be approved',()=>{
  const grade=quoteTrack(compileCurve(line({x:0,y:0,z:0},{x:100,y:10,z:0})),new Heightfield(2,2,100,new Float64Array(4)));
  assert.equal(grade.valid,false);
  const wet=quoteTrack(compileCurve(line({x:0,y:1,z:0},{x:100,y:1,z:0})),new Heightfield(2,2,100,new Float64Array(4).fill(-5),0));assert.equal(wet.valid,false);
});
test('clock gives identical ticks across render rates and speed multipliers',()=>{
  const run=(fps:number,speed:1|2|4|8)=>{let tick=0;const clock=new SimulationClock(()=>tick++);for(let f=0;f<fps*10;f++)clock.advance(1/fps,speed);return tick;};
  for(const speed of [1,2,4,8] as const) assert.equal(run(30,speed),run(144,speed));
  assert.equal(run(60,8),1600);
});
test('paused clock freezes backlog and catch-up never drops ticks',()=>{
  let ticks=0;const clock=new SimulationClock(()=>ticks++);const result=clock.advance(10,8,10);assert.equal(ticks,10);assert.ok(result.backlogSeconds>79);
  clock.advance(100,0);assert.equal(ticks,10);while(clock.advance(0,1).backlogSeconds>=FIXED_DT) {}assert.equal(ticks,1600);
});
test('train crosses graph edges and reverse travel arrives at correct endpoint',()=>{
  const graph=network(),geometry=compileGraph(graph),motion={path:findPath(graph,'node:7','node:5')!,leg:0,distanceM:0,arrived:false};
  advanceMotion(motion,125,geometry);assert.equal(motion.leg,1);assert.ok(Math.abs(motionPosition(motion,geometry).x-75)<1e-7);
  advanceMotion(motion,1000,geometry);assert.equal(motion.arrived,true);assert.deepEqual(motionPosition(motion,geometry),graph.nodes[0]!.position);
});
test('built-state fixture survives mid-run save/reload and deterministic continuation',()=>{
  const state=fixture(),geometry=compileGraph(state.railway);
  const step=(s:GameState)=>{s.tick++;advanceMotion(s.trains[0]!.motion,s.trains[0]!.speedMps*FIXED_DT,geometry);};
  for(let i=0;i<137;i++)step(state);
  const loaded=deserialize(serialize(state));assert.deepEqual(loaded,state);
  for(let i=0;i<350;i++){step(state);step(loaded);}assert.deepEqual(loaded,state);assert.equal(loaded.trains[0]!.motion.arrived,true);
});
test('save loader rejects future schemas, malformed data and dangling references',()=>{
  const json=serialize(fixture());assert.throws(()=>deserialize(json.replace('"schemaVersion":12','"schemaVersion":109')));
  assert.throws(()=>deserialize('{'));assert.throws(()=>deserialize(json.replace('station:11','station:999')));
});
test('save loader rejects unreconciled finance and stale entity counters',()=>{
  const state=fixture();state.company.cash++;assert.throws(()=>serialize(state));state.company.cash--;state.nextEntityId=1;assert.throws(()=>serialize(state));
});
test('save loader rejects disconnected train paths and invalid arrival state',()=>{
  const state=fixture();state.trains[0]!.motion.path[1]!.reverse=true;assert.throws(()=>serialize(state));state.trains[0]!.motion.path[1]!.reverse=false;state.trains[0]!.motion.arrived=true;assert.throws(()=>serialize(state));
});
test('persistent entity IDs are serializable and monotonically allocated',()=>{
  const state=createInitialState();assert.equal(allocateId(state,'node'),'node:5');assert.equal(allocateId(state,'edge'),'edge:6');assert.equal(deserialize(serialize(state)).nextEntityId,7);
});
