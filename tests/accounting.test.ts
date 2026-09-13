import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState } from '../src/content/norway.js';
import type { CubicCurve, GameState, Vec3 } from '../src/domain/model.js';
import { rebuildMonthlyAccounts } from '../src/simulation/accounting.js';
import { ECONOMY_INTERVAL_TICKS } from '../src/simulation/clock.js';
import { postExpense, postIncome } from '../src/simulation/finance.js';
import { postDailyMaintenance } from '../src/simulation/maintenance.js';
import { evaluateObjectives } from '../src/simulation/objectives.js';

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
