import { test } from 'node:test';
import assert from 'node:assert/strict';
import { RailFrontierGame } from '../src/application/game.js';
import { createInitialState } from '../src/content/norway.js';
import type { CubicCurve, GameState, Vec3 } from '../src/domain/model.js';
import { FIXED_DT } from '../src/simulation/clock.js';
import { DWELL_TICKS } from '../src/simulation/station-service.js';
import { createTrainSimulation } from '../src/simulation/trains.js';
import { anticipatorySpeedLimit, consistPhysics, tractionAcceleration } from '../src/simulation/traction.js';
import { Heightfield } from '../src/world/terrain.js';

const line=(p0:Vec3,p3:Vec3):CubicCurve=>({p0,p1:{x:(2*p0.x+p3.x)/3,y:(2*p0.y+p3.y)/3,z:(2*p0.z+p3.z)/3},p2:{x:(p0.x+2*p3.x)/3,y:(p0.y+2*p3.y)/3,z:(p0.z+2*p3.z)/3},p3});
function runningState(length=200):GameState {
  const state=createInitialState(),a={x:20,y:0,z:100},b={x:20+length,y:0,z:100};
  state.railway={revision:1,nodes:[{id:'node:5',position:a},{id:'node:6',position:b}],edges:[{id:'edge:7',from:'node:5',to:'node:6',curve:line(a,b),speedLimitMps:20,ownerId:'company:1'}]};
  state.stations=[{id:'station:8',nodeId:'node:5',townId:null,classId:'rural-halt',storage:[],layout:{kind:'legacy-node',version:1},constructionCost:2_500_000},{id:'station:9',nodeId:'node:6',townId:null,classId:'rural-halt',storage:[],layout:{kind:'legacy-node',version:1},constructionCost:2_500_000}];
  state.routes=[{id:'route:10',stops:['station:8','station:9'],mode:'shuttle'}];
  state.trains=[{id:'train:11',routeId:'route:10',locomotiveId:'nord-2-6-0',vehicleIds:['fjord-passenger-coach'],motion:{path:[{edgeId:'edge:7',reverse:false}],leg:0,distanceM:0,arrived:false},speedMps:0,phase:'running',dwellTicks:0,cargo:[]}];
  state.operations.trainServices['train:11']={nextStopIndex:1,direction:1,ageDays:0,condition:1,distanceM:0,revenue:0,operatingCosts:0,costRemainder:0};state.nextEntityId=12;
  return state;
}

test('traction responds to consist mass and signed gradient',()=>{
  const light=consistPhysics({locomotiveId:'nord-2-6-0',vehicleIds:[]}),heavy=consistPhysics({locomotiveId:'nord-2-6-0',vehicleIds:['fjord-passenger-coach','fjord-passenger-coach']});
  assert.ok(tractionAcceleration(light,5,0)>tractionAcceleration(heavy,5,0));
  assert.ok(tractionAcceleration(heavy,5,-.02)>tractionAcceleration(heavy,5,0));
  assert.ok(tractionAcceleration(heavy,5,.02)<tractionAcceleration(heavy,5,0));
});

test('speed envelope anticipates a slower downstream edge',()=>{
  const allowed=anticipatorySpeedLimit(22,[{distanceM:50,limitMps:5}],500);
  assert.ok(Math.abs(allowed-Math.sqrt(85))<1e-12);
  assert.equal(anticipatorySpeedLimit(12,[{distanceM:500,limitMps:5}],500),12);
  assert.throws(()=>anticipatorySpeedLimit(20,[{distanceM:-1,limitMps:5}],100),/Invalid speed envelope/);
});

test('running train brakes before entering a slower edge',()=>{
  const state=runningState(150),middle=state.railway.nodes[1]!.position,end={x:middle.x+150,y:0,z:middle.z};state.railway.nodes.push({id:'node:12',position:end});state.railway.edges.push({id:'edge:13',from:'node:6',to:'node:12',curve:line(middle,end),speedLimitMps:5,ownerId:'company:1'});state.stations[1]!.nodeId='node:12';state.trains[0]!.motion={path:[{edgeId:'edge:7',reverse:false},{edgeId:'edge:13',reverse:false}],leg:0,distanceM:100,arrived:false};state.trains[0]!.speedMps=20;state.nextEntityId=14;
  createTrainSimulation()(state);assert.ok(state.trains[0]!.speedMps<=Math.sqrt(85));assert.ok(state.trains[0]!.speedMps<20);assert.equal(state.trains[0]!.motion.leg,0);
});

test('train brakes to the exact station endpoint, dwells, then reverses',()=>{
  const state=runningState(),step=createTrainSimulation();
  let ticks=0;while(state.trains[0]!.phase!=='dwelling'&&ticks<5000){state.tick++;step(state);ticks++;}
  const train=state.trains[0]!;
  assert.ok(ticks<5000);assert.equal(train.motion.arrived,true);assert.equal(train.motion.distanceM,200);assert.equal(train.speedMps,0);assert.equal(train.dwellTicks,0);
  for(let index=0;index<DWELL_TICKS-1;index++){state.tick++;step(state);}
  assert.equal(train.phase,'dwelling');
  state.tick++;step(state);
  assert.equal(train.phase,'running');assert.equal(train.motion.path[0]!.reverse,true);assert.equal(train.motion.distanceM,0);assert.equal(state.operations.trainServices['train:11']!.nextStopIndex,0);
});

test('a train blocked at a station retries its route after infrastructure is restored',()=>{
  const state=runningState(),train=state.trains[0]!,step=createTrainSimulation();state.startingYear=1922;train.locomotiveId='nord-el-1';state.operations.infrastructure['edge:7']={spans:[{startM:0,endM:200,kind:'ground'}],constructionCost:200_000,maintenancePerDay:20,electrified:true,electrificationCost:3_600_000,electrificationMaintenancePerDay:144};
  let ticks=0;while(train.phase!=='dwelling'&&ticks++<5000){state.tick++;step(state);}const infrastructure=state.operations.infrastructure['edge:7']!;infrastructure.electrified=false;infrastructure.electrificationCost=0;infrastructure.electrificationMaintenancePerDay=0;
  for(let index=0;index<DWELL_TICKS;index++){state.tick++;step(state);}assert.equal(train.phase,'blocked');assert.equal(train.motion.arrived,true);
  infrastructure.electrified=true;infrastructure.electrificationCost=3_600_000;infrastructure.electrificationMaintenancePerDay=144;state.tick++;step(state);assert.equal(train.phase,'running');assert.equal(train.motion.arrived,false);assert.equal(train.motion.path[0]!.reverse,true);
});

test('fixed-step train movement is independent of render frame rate',()=>{
  const terrain=new Heightfield(2,2,500,new Float64Array(4));
  const run=(fps:number)=>{const game=new RailFrontierGame(runningState(400),terrain);for(let frame=0;frame<fps*10;frame++)game.advance(1/fps);return game.snapshot();};
  const slow=run(30),fast=run(144),a=slow.trains[0]!,b=fast.trains[0]!;
  assert.equal(slow.tick,Math.round(10/FIXED_DT));assert.equal(fast.tick,slow.tick);
  assert.equal(a.motion.leg,b.motion.leg);assert.ok(Math.abs(a.motion.distanceM-b.motion.distanceM)<1e-9);assert.ok(Math.abs(a.speedMps-b.speedMps)<1e-9);
  assert.deepEqual(slow.company,fast.company);assert.deepEqual(slow.operations.trainServices,fast.operations.trainServices);
});
