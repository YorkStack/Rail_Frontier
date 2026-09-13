import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState } from '../src/content/norway.js';
import type { CubicCurve, GameState, Vec3 } from '../src/domain/model.js';
import { ECONOMY_INTERVAL_TICKS } from '../src/simulation/clock.js';
import { dailyPassengerAllocations, generateDailyDemand } from '../src/simulation/demand.js';
import { servicePassengers } from '../src/simulation/transfer.js';
import { createTrainSimulation } from '../src/simulation/trains.js';
import { deserialize, serialize } from '../src/persistence/save.js';

const line=(p0:Vec3,p3:Vec3):CubicCurve=>({p0,p1:{x:(2*p0.x+p3.x)/3,y:(2*p0.y+p3.y)/3,z:(2*p0.z+p3.z)/3},p2:{x:(p0.x+2*p3.x)/3,y:(p0.y+2*p3.y)/3,z:(p0.z+2*p3.z)/3},p3});

test('daily OD allocation conserves each town total and favors attractive destinations',()=>{
  const state=createInitialState(),origin=state.towns[0]!,allocation=dailyPassengerAllocations(origin,state.towns);
  assert.equal([...allocation.values()].reduce((sum,value)=>sum+value,0),Math.floor(origin.population*.025));
  assert.ok(allocation.get('town:4')!>allocation.get('town:3')!);
  assert.deepEqual([...dailyPassengerAllocations(origin,state.towns)], [...allocation]);
});

test('daily generation follows exact cadence and caps each OD at seven current batches',()=>{
  const state=createInitialState();
  for(let day=1;day<=10;day++){state.tick=day*ECONOMY_INTERVAL_TICKS;generateDailyDemand(state);}
  for(const origin of state.towns)for(const [destination,quantity] of dailyPassengerAllocations(origin,state.towns)) {
    const queued=state.operations.demand.filter(item=>item.originTownId===origin.id&&item.destinationTownId===destination).reduce((sum,item)=>sum+item.quantity,0);
    assert.equal(queued,quantity*7);
  }
  assert.ok(state.operations.demand.every(item=>item.generatedTick>=4*ECONOMY_INTERVAL_TICKS));
});

function passengerState():GameState {
  const state=createInitialState(),a={x:100,y:0,z:100},b={x:300,y:0,z:100},c={x:500,y:0,z:100};
  state.towns=[{id:'town:2',name:'A',position:a,population:1000},{id:'town:3',name:'B',position:b,population:1000},{id:'town:4',name:'C',position:c,population:1000}];
  state.railway={revision:1,nodes:[{id:'node:5',position:a},{id:'node:6',position:b},{id:'node:7',position:c}],edges:[{id:'edge:8',from:'node:5',to:'node:6',curve:line(a,b),speedLimitMps:20,ownerId:'company:1'},{id:'edge:9',from:'node:6',to:'node:7',curve:line(b,c),speedLimitMps:20,ownerId:'company:1'}]};
  state.stations=[{id:'station:10',nodeId:'node:5',townId:'town:2',classId:'rural-halt',storage:[]},{id:'station:11',nodeId:'node:6',townId:'town:3',classId:'rural-halt',storage:[]},{id:'station:12',nodeId:'node:7',townId:'town:4',classId:'rural-halt',storage:[]}];
  state.routes=[{id:'route:13',stops:['station:10','station:11','station:12'],mode:'shuttle'}];
  state.trains=[{id:'train:14',routeId:'route:13',locomotiveId:'nord-2-6-0',vehicleIds:['fjord-passenger-coach'],motion:{path:[{edgeId:'edge:8',reverse:false}],leg:0,distanceM:0,arrived:false},speedMps:0,phase:'running',dwellTicks:0,cargo:[]}];
  state.operations.trainServices['train:14']={nextStopIndex:1,direction:1,ageDays:0,condition:1,distanceM:0,revenue:0,operatingCosts:0,costRemainder:0};state.nextEntityId=15;
  return state;
}

test('boarding obeys capacity and destination; only final delivery pays once',()=>{
  const state=passengerState(),train=state.trains[0]!;
  state.operations.demand=[{originTownId:'town:2',destinationTownId:'town:4',quantity:70,generatedTick:0}];
  servicePassengers(state,train,'station:10');
  assert.equal(train.cargo[0]!.quantity,48);assert.equal(state.operations.demand[0]!.quantity,22);
  assert.equal(state.operations.demand[0]!.quantity+train.cargo[0]!.quantity+state.operations.delivered.passengers,70);
  train.cargo[0]!.distanceM=2000;
  servicePassengers(state,train,'station:11');
  assert.equal(train.cargo.length,1);assert.equal(state.company.ledger.length,0);
  servicePassengers(state,train,'station:12');
  assert.equal(train.cargo.length,0);assert.equal(state.operations.delivered.passengers,48);
  assert.equal(state.company.ledger[0]!.amount,48*1500);assert.equal(state.operations.trainServices['train:14']!.revenue,48*1500);
  const cash=state.company.cash;servicePassengers(state,train,'station:12');assert.equal(state.company.cash,cash);assert.equal(state.company.ledger.length,1);
});

test('boarding consumes oldest eligible queues first with stable destinations',()=>{
  const state=passengerState(),train=state.trains[0]!;
  state.operations.demand=[
    {originTownId:'town:2',destinationTownId:'town:4',quantity:30,generatedTick:10},
    {originTownId:'town:2',destinationTownId:'town:3',quantity:30,generatedTick:5}
  ];state.tick=20;
  servicePassengers(state,train,'station:10');
  assert.deepEqual(train.cargo.map(lot=>[lot.destinationId,lot.quantity]),[['station:11',30],['station:12',18]]);
  assert.deepEqual(state.operations.demand.map(queue=>[queue.destinationTownId,queue.quantity]),[['town:4',12]]);
});

test('save during destination dwell preserves exactly-once delivery and deterministic continuation',()=>{
  const state=passengerState(),train=state.trains[0]!,step=createTrainSimulation();
  state.operations.demand=[{originTownId:'town:2',destinationTownId:'town:4',quantity:20,generatedTick:0}];servicePassengers(state,train,'station:10');
  let ticks=0;while(state.operations.delivered.passengers===0&&ticks<10_000){state.tick++;step(state);ticks++;}
  assert.ok(ticks<10_000);assert.equal(train.phase,'dwelling');assert.equal(state.company.ledger.filter(entry=>entry.category==='passenger').length,1);
  const loaded=deserialize(serialize(state)),loadedStep=createTrainSimulation();
  for(let index=0;index<100;index++){state.tick++;step(state);loaded.tick++;loadedStep(loaded);}
  assert.deepEqual(loaded,state);assert.equal(loaded.company.ledger.filter(entry=>entry.category==='passenger').length,1);
});
