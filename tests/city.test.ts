import assert from 'node:assert/strict';
import test from 'node:test';
import { createInitialState } from '../src/content/norway.js';
import { advanceTownEconomies,connectedTowns } from '../src/simulation/city.js';
import { dailyLumberDemand,dailyMailDemand } from '../src/domain/operations.js';
import type { CubicCurve,GameState,Vec3 } from '../src/domain/model.js';

const line=(a:Vec3,b:Vec3):CubicCurve=>({p0:a,p1:{x:(2*a.x+b.x)/3,y:(2*a.y+b.y)/3,z:(2*a.z+b.z)/3},p2:{x:(a.x+2*b.x)/3,y:(a.y+2*b.y)/3,z:(a.z+2*b.z)/3},p3:b});
function connectedState():GameState {
  const state=createInitialState(),a=state.towns[0]!.position,b=state.towns[1]!.position;
  state.railway={revision:1,nodes:[{id:'node:5',position:a},{id:'node:6',position:b}],edges:[{id:'edge:7',from:'node:5',to:'node:6',curve:line(a,b),speedLimitMps:20,ownerId:'company:1'}]};
  state.stations=[{id:'station:8',nodeId:'node:5',townId:'town:2',classId:'rural-halt',storage:[]},{id:'station:9',nodeId:'node:6',townId:'town:3',classId:'town-station',storage:[]}];state.routes=[{id:'route:10',stops:['station:8','station:9'],mode:'shuttle'}];state.trains=[{id:'train:11',routeId:'route:10',locomotiveId:'nord-2-6-0',vehicleIds:['fjord-passenger-coach'],motion:{path:[],leg:0,distanceM:0,arrived:false},speedMps:0,phase:'idle',dwellTicks:0,cargo:[]}];state.nextEntityId=12;return state;
}

test('unserved towns accumulate bounded lumber and mail demand without growing',()=>{
  const state=createInitialState(),town=state.towns[0]!,economy=state.operations.townEconomy[town.id]!,population=town.population;
  for(let day=0;day<60;day++)advanceTownEconomies(state);
  assert.equal(town.population,population);assert.equal(economy.economicActivity,35);assert.equal(economy.connectedDays,0);
  assert.equal(economy.lumberDemand,dailyLumberDemand(population)*30);assert.equal(economy.mailWaiting,dailyMailDemand(population)*7);
});

test('route access and lumber supply raise activity and produce deterministic growth',()=>{
  const unassigned=connectedState();unassigned.trains=[];assert.equal(connectedTowns(unassigned).size,0);
  const a=connectedState(),b=structuredClone(a),town=a.towns[0]!,economy=a.operations.townEconomy[town.id]!;economy.lumberReceivedToday=dailyLumberDemand(town.population);economy.lumberDelivered=economy.lumberReceivedToday;b.operations.townEconomy[town.id]=structuredClone(economy);
  assert.deepEqual([...connectedTowns(a)].sort(),['town:2','town:3']);advanceTownEconomies(a);advanceTownEconomies(b);
  assert.deepEqual(a,b);assert.equal(economy.economicActivity,90);assert.equal(economy.connectedDays,1);assert.ok(economy.growthRemainder>0);assert.equal(economy.lumberReceivedToday,0);
  economy.lumberReceivedToday=dailyLumberDemand(town.population);economy.lumberDelivered+=economy.lumberReceivedToday;b.operations.townEconomy[town.id]=structuredClone(economy);advanceTownEconomies(a);advanceTownEconomies(b);
  assert.deepEqual(a,b);assert.ok(town.population>1800);assert.ok(economy.lastPopulationChange>0);
});
