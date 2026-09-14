import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState } from '../src/content/norway.js';
import type { CubicCurve, GameState, Vec3 } from '../src/domain/model.js';
import { companyReport, rebuildMonthlyAccounts } from '../src/simulation/accounting.js';
import { ECONOMY_INTERVAL_TICKS } from '../src/simulation/clock.js';
import { postExpense, postIncome } from '../src/simulation/finance.js';
import { postDailyMaintenance } from '../src/simulation/maintenance.js';
import { evaluateObjectives } from '../src/simulation/objectives.js';
import { stationDefinition } from '../src/content/stations.js';
import { vehicleDefinition } from '../src/content/vehicles.js';

const line=(p0:Vec3,p3:Vec3):CubicCurve=>({p0,p1:{x:(2*p0.x+p3.x)/3,y:(2*p0.y+p3.y)/3,z:(2*p0.z+p3.z)/3},p2:{x:(p0.x+2*p3.x)/3,y:(p0.y+2*p3.y)/3,z:(p0.z+2*p3.z)/3},p3});
function assets():GameState {
  const state=createInitialState(),a={x:2200,y:state.towns[0]!.position.y,z:3200},b={x:4700,y:state.towns[1]!.position.y,z:4900};
  state.railway={revision:1,nodes:[{id:'node:5',position:a},{id:'node:6',position:b}],edges:[{id:'edge:7',from:'node:5',to:'node:6',curve:line(a,b),speedLimitMps:20,ownerId:'company:1'}]};
  state.operations.infrastructure['edge:7']={spans:[{startM:0,endM:3023.2437214726323,kind:'ground'}],constructionCost:1000,maintenancePerDay:100};
  state.stations=[{id:'station:8',nodeId:'node:5',townId:'town:2',classId:'rural-halt',storage:[]},{id:'station:9',nodeId:'node:6',townId:'town:3',classId:'rural-halt',storage:[]}];
  state.trains=[{id:'train:10',routeId:null,locomotiveId:'nord-2-6-0',vehicleIds:['fjord-passenger-coach'],motion:{path:[{edgeId:'edge:7',reverse:false}],leg:0,distanceM:0,arrived:false},speedMps:0,phase:'idle',dwellTicks:0,cargo:[]}];
  state.operations.trainServices['train:10']={nextStopIndex:0,direction:1,ageDays:0,condition:1,distanceM:0,revenue:0,operatingCosts:0,costRemainder:0};state.nextEntityId=11;
  return state;
}

test('monthly reports separate capital, operating cost and revenue',()=>{
  const state=createInitialState();postExpense(state,'construction',100,'edge:test','Build');postExpense(state,'maintenance',30,'edge:test','Maintain');postIncome(state,'passenger',80,'train:test','Fares');
  state.tick=30*ECONOMY_INTERVAL_TICKS;postIncome(state,'freight',25,'train:test','Freight');rebuildMonthlyAccounts(state);
  assert.deepEqual(state.operations.monthlyAccounts,[{month:0,revenue:80,operatingCost:30,capitalCost:100},{month:1,revenue:25,operatingCost:0,capitalCost:0}]);
});

test('daily maintenance posts one charge per owned asset and updates train service',()=>{
  const state=assets();postDailyMaintenance(state);
  assert.deepEqual(state.company.ledger.map(entry=>entry.amount),[-100,-2500,-2500,-22000]);
  assert.equal(state.operations.trainServices['train:10']!.operatingCosts,22000);assert.equal(state.operations.trainServices['train:10']!.ageDays,1);
  rebuildMonthlyAccounts(state);assert.equal(state.operations.monthlyAccounts[0]!.operatingCost,27100);
});

test('campaign objectives progress from connected coverage, delivery and operating profit exactly once',()=>{
  const state=assets();evaluateObjectives(state);
  assert.equal(state.objectiveProgress['first-connection'],2);assert.ok(state.operations.completedObjectives.includes('first-connection'));
  state.operations.delivered.passengers=200;state.operations.monthlyAccounts=[{month:0,revenue:1_100_000,operatingCost:50_000,capitalCost:5_000_000}];evaluateObjectives(state);evaluateObjectives(state);
  assert.ok(state.operations.completedObjectives.includes('first-passengers'));assert.ok(state.operations.completedObjectives.includes('profitable-railway'));
  assert.equal(new Set(state.operations.completedObjectives).size,state.operations.completedObjectives.length);
});

test('company report separates operating performance, capital and infrastructure value',()=>{
  const state=assets();
  postExpense(state,'construction',1000,'edge:7','Track construction');postExpense(state,'construction',5000,'station:8','Station construction');postExpense(state,'vehicle',4000,'train:10','Train purchase');
  postExpense(state,'maintenance',300,'train:10','Train running cost');postIncome(state,'passenger',800,'train:10','Passenger fares');
  state.operations.trainServices['train:10']={...state.operations.trainServices['train:10']!,distanceM:1250,revenue:800,operatingCosts:300};
  const report=companyReport(state);
  assert.deepEqual({revenue:report.revenue,operatingCost:report.operatingCost,capitalCost:report.capitalCost,operatingProfit:report.operatingProfit},{revenue:800,operatingCost:300,capitalCost:10_000,operatingProfit:500});
  const stationValue=2*stationDefinition('rural-halt')!.purchaseCost,vehicleValue=vehicleDefinition('nord-2-6-0')!.purchaseCost+vehicleDefinition('fjord-passenger-coach')!.purchaseCost;
  assert.equal(report.infrastructureCost,1000);assert.equal(report.stationValue,stationValue);assert.equal(report.vehicleValue,vehicleValue);assert.equal(report.ownedAssetValue,1000+stationValue+vehicleValue);assert.equal(report.companyValue,state.company.cash+report.ownedAssetValue);
  assert.deepEqual(report.currentMonth,{revenue:800,operatingCost:300,capitalCost:10_000,operatingProfit:500});
  assert.deepEqual(report.trains[0],{trainId:'train:10',routeId:null,revenue:800,operatingCost:300,capitalCost:0,operatingProfit:500,distanceM:1250});
});

test('route reports aggregate assigned trains and exclude unassigned stock',()=>{
  const state=assets();state.routes=[{id:'route:11',stops:['station:8','station:9'],mode:'shuttle'},{id:'route:12',stops:['station:9','station:8'],mode:'shuttle'}];state.trains[0]!.routeId='route:11';
  state.operations.trainServices['train:10']={...state.operations.trainServices['train:10']!,distanceM:1500,revenue:900,operatingCosts:250};
  state.trains.push({...structuredClone(state.trains[0]!),id:'train:13',routeId:'route:11'});state.operations.trainServices['train:13']={...state.operations.trainServices['train:10']!,distanceM:700,revenue:300,operatingCosts:400};
  state.trains.push({...structuredClone(state.trains[0]!),id:'train:14',routeId:null});state.operations.trainServices['train:14']={...state.operations.trainServices['train:10']!,distanceM:500,revenue:999,operatingCosts:1};
  const report=companyReport(state);
  assert.deepEqual(report.routes[0],{routeId:'route:11',trainIds:['train:10','train:13'],revenue:1200,operatingCost:650,capitalCost:0,operatingProfit:550,distanceM:2200});
  assert.deepEqual(report.routes[1],{routeId:'route:12',trainIds:[],revenue:0,operatingCost:0,capitalCost:0,operatingProfit:0,distanceM:0});
});
