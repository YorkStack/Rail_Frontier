import assert from 'node:assert/strict';
import test from 'node:test';
import type { CubicCurve, GameState, Vec3 } from '../src/domain/model.js';
import { createInitialState } from '../src/content/norway.js';
import { advanceIndustries } from '../src/simulation/industry.js';
import { serviceFreight } from '../src/simulation/transfer.js';
import { deserialize, serialize } from '../src/persistence/save.js';

const line=(a:Vec3,b:Vec3):CubicCurve=>({p0:a,p1:{x:(2*a.x+b.x)/3,y:0,z:0},p2:{x:(a.x+2*b.x)/3,y:0,z:0},p3:b});

function freightState():GameState {
  const state=createInitialState(),a={x:100,y:0,z:0},b={x:300,y:0,z:0};
  state.towns=[{id:'town:2',name:'Timberton',position:a,population:1000},{id:'town:3',name:'Millhaven',position:b,population:1000},{id:'town:4',name:'Elsewhere',position:{x:900,y:0,z:0},population:1000}];
  state.railway={revision:1,nodes:[{id:'node:5',position:a},{id:'node:6',position:b}],edges:[{id:'edge:7',from:'node:5',to:'node:6',curve:line(a,b),speedLimitMps:18,ownerId:'company:1'}]};
  state.stations=[{id:'station:8',nodeId:'node:5',townId:'town:2',classId:'rural-halt',storage:[]},{id:'station:9',nodeId:'node:6',townId:'town:3',classId:'rural-halt',storage:[]}];
  state.routes=[{id:'route:10',stops:['station:8','station:9'],mode:'shuttle'}];
  state.trains=[{id:'train:11',routeId:'route:10',locomotiveId:'nord-2-6-0',vehicleIds:['fjord-freight-wagon'],motion:{path:[{edgeId:'edge:7',reverse:false}],leg:0,distanceM:0,arrived:false},speedMps:0,phase:'running',dwellTicks:0,cargo:[]}];
  state.industries=[{id:'industry:12',definitionId:'forest',position:a,inventory:{}},{id:'industry:13',definitionId:'sawmill',position:b,inventory:{}}];
  state.operations.trainServices['train:11']={nextStopIndex:1,direction:1,ageDays:0,condition:1,distanceM:0,revenue:0,operatingCosts:0,costRemainder:0};
  state.operations.industryCycleTicks={'industry:12':0,'industry:13':0};state.nextEntityId=14;
  return state;
}

test('forest and sawmill complete exact atomic recipes',()=>{
  const state=freightState(),forest=state.industries[0]!,sawmill=state.industries[1]!;
  for(let tick=0;tick<1199;tick++)advanceIndustries(state);
  assert.deepEqual(forest.inventory,{});advanceIndustries(state);assert.deepEqual(forest.inventory,{timber:20});
  assert.equal(state.operations.industryCycleTicks[forest.id],0);
  assert.equal(state.operations.industryCycleTicks[sawmill.id],600);
  sawmill.inventory.timber=10;advanceIndustries(state);
  assert.deepEqual(sawmill.inventory,{lumber:7});assert.equal(state.operations.industryCycleTicks[sawmill.id],0);
});

test('full storage and missing inputs block completed cycles without mutation',()=>{
  const state=freightState(),forest=state.industries[0]!,sawmill=state.industries[1]!;
  forest.inventory.timber=490;state.operations.industryCycleTicks[forest.id]=1199;advanceIndustries(state);
  assert.equal(forest.inventory.timber,490);assert.equal(state.operations.industryCycleTicks[forest.id],1200);
  forest.inventory.timber=470;advanceIndustries(state);assert.equal(forest.inventory.timber,490);assert.equal(state.operations.industryCycleTicks[forest.id],0);
  state.operations.industryCycleTicks[sawmill.id]=599;advanceIndustries(state);
  assert.deepEqual(sawmill.inventory,{});assert.equal(state.operations.industryCycleTicks[sawmill.id],600);
  sawmill.inventory.timber=10;advanceIndustries(state);assert.deepEqual(sawmill.inventory,{lumber:7});
});

test('freight chain conserves stock, pays each delivery once, and survives reload',()=>{
  const state=freightState(),train=state.trains[0]!,forest=state.industries[0]!,sawmill=state.industries[1]!;
  forest.inventory.timber=40;serviceFreight(state,train,'station:8');
  assert.deepEqual(forest.inventory,{});assert.deepEqual(train.cargo.map(lot=>[lot.kind,lot.quantity,lot.destinationId]),[['timber',40,'station:9']]);
  train.cargo[0]!.distanceM=2000;serviceFreight(state,train,'station:9');
  assert.equal(sawmill.inventory.timber,40);assert.equal(state.operations.delivered.timber,40);assert.equal(state.company.ledger[0]!.amount,2000);
  for(let tick=0;tick<600;tick++)advanceIndustries(state);
  assert.deepEqual(sawmill.inventory,{timber:30,lumber:7});serviceFreight(state,train,'station:9');
  assert.deepEqual(train.cargo.map(lot=>[lot.kind,lot.quantity,lot.destinationId]),[['lumber',7,'station:8']]);
  const loaded=deserialize(serialize(state)),loadedTrain=loaded.trains[0]!;assert.deepEqual(loaded,state);
  loadedTrain.cargo[0]!.distanceM=2000;serviceFreight(loaded,loadedTrain,'station:8');
  assert.equal(loaded.operations.delivered.lumber,7);assert.equal(loaded.company.ledger.filter(entry=>entry.category==='freight').length,2);
  assert.equal(loaded.operations.townEconomy['town:2']!.lumberDelivered,7);assert.equal(loaded.operations.townEconomy['town:2']!.lumberDemand,21);
  assert.equal(loaded.company.ledger[1]!.amount,350);assert.equal(loaded.company.cash,loaded.company.openingCash+2350);
  const cash=loaded.company.cash;serviceFreight(loaded,loadedTrain,'station:8');assert.equal(loaded.company.cash,cash);
});

test('towns accept only requested lumber and retain excess cargo aboard',()=>{
  const state=freightState(),train=state.trains[0]!,economy=state.operations.townEconomy['town:2']!;economy.lumberDemand=3;train.cargo=[{kind:'lumber',quantity:7,destinationId:'station:8',originId:'station:9',loadedTick:0,distanceM:2000}];
  serviceFreight(state,train,'station:8');assert.equal(economy.lumberDemand,0);assert.equal(economy.lumberDelivered,3);assert.equal(economy.lumberReceivedToday,3);assert.equal(state.operations.delivered.lumber,3);assert.equal(train.cargo[0]?.quantity,4);
  const cash=state.company.cash;serviceFreight(state,train,'station:8');assert.equal(state.company.cash,cash);assert.equal(train.cargo[0]?.quantity,4);
});

test('a full sawmill only accepts available space and retains the remainder aboard',()=>{
  const state=freightState(),train=state.trains[0]!,sawmill=state.industries[1]!;
  sawmill.inventory.lumber=490;train.cargo=[{kind:'timber',quantity:20,destinationId:'station:9',originId:'station:8',loadedTick:0,distanceM:1000}];
  serviceFreight(state,train,'station:9');
  assert.equal(sawmill.inventory.timber,10);assert.deepEqual(train.cargo.map(lot=>[lot.kind,lot.quantity]),[['timber',10],['lumber',30]]);assert.equal(state.operations.delivered.timber,10);
  assert.equal((sawmill.inventory.lumber??0)+(sawmill.inventory.timber??0)+train.cargo.reduce((sum,lot)=>sum+lot.quantity,0),510);
});
