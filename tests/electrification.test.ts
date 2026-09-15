import { test } from 'node:test';
import assert from 'node:assert/strict';
import { RailFrontierGame } from '../src/application/game.js';
import { ELECTRIFICATION_COST_PER_M,pathIsElectrified,quoteRouteElectrification,routeIsElectrified } from '../src/application/electrification.js';
import { createInitialState } from '../src/content/norway.js';
import type { CubicCurve,GameState,Vec3 } from '../src/domain/model.js';
import { companyReport } from '../src/simulation/accounting.js';
import { postDailyMaintenance } from '../src/simulation/maintenance.js';
import { Heightfield } from '../src/world/terrain.js';

const line=(p0:Vec3,p3:Vec3):CubicCurve=>({p0,p1:{x:(2*p0.x+p3.x)/3,y:(2*p0.y+p3.y)/3,z:(2*p0.z+p3.z)/3},p2:{x:(p0.x+2*p3.x)/3,y:(p0.y+2*p3.y)/3,z:(p0.z+2*p3.z)/3},p3});
function fixture(cash=250_000_000):GameState {
  const state=createInitialState(),a={x:0,y:0,z:0},b={x:100,y:0,z:0},c={x:200,y:0,z:0};
  state.company.cash=cash;state.company.openingCash=cash;
  state.railway={revision:1,nodes:[{id:'node:5',position:a},{id:'node:6',position:b},{id:'node:7',position:c}],edges:[{id:'edge:8',from:'node:5',to:'node:6',curve:line(a,b),speedLimitMps:20,ownerId:'company:1'},{id:'edge:9',from:'node:6',to:'node:7',curve:line(b,c),speedLimitMps:20,ownerId:'company:1'}]};
  state.operations.infrastructure={
    'edge:8':{spans:[{startM:0,endM:100,kind:'ground'}],constructionCost:100_000,maintenancePerDay:10,electrified:false,electrificationCost:0,electrificationMaintenancePerDay:0},
    'edge:9':{spans:[{startM:0,endM:100,kind:'ground'}],constructionCost:100_000,maintenancePerDay:10,electrified:false,electrificationCost:0,electrificationMaintenancePerDay:0}
  };
  state.stations=[{id:'station:10',nodeId:'node:5',townId:null,classId:'rural-halt',storage:[],layout:{kind:'legacy-node',version:1},constructionCost:2_500_000},{id:'station:11',nodeId:'node:7',townId:null,classId:'rural-halt',storage:[],layout:{kind:'legacy-node',version:1},constructionCost:2_500_000}];
  state.routes=[{id:'route:12',stops:['station:10','station:11'],mode:'shuttle'}];state.nextEntityId=13;
  return state;
}
const terrain=()=>new Heightfield(2,2,500,new Float64Array(4));

test('route quote includes each unelectrified path edge exactly once',()=>{
  const state=fixture(),quote=quoteRouteElectrification(state,'route:12');
  assert.deepEqual(quote.edgeIds,['edge:8','edge:9']);assert.equal(quote.lengthM,200);assert.equal(quote.cost,200*ELECTRIFICATION_COST_PER_M);
  assert.equal(routeIsElectrified(state,state.routes[0]!),false);assert.equal(pathIsElectrified(state,[{edgeId:'edge:8',reverse:false}]),false);
  state.operations.infrastructure['edge:8']!.electrified=true;state.operations.infrastructure['edge:8']!.electrificationCost=100*ELECTRIFICATION_COST_PER_M;state.operations.infrastructure['edge:8']!.electrificationMaintenancePerDay=72;
  assert.deepEqual(quoteRouteElectrification(state,'route:12').edgeIds,['edge:9']);
});

test('electrification commits one capital debit and immutable asset value',()=>{
  const game=new RailFrontierGame(fixture(),terrain()),before=game.snapshot(),quote=quoteRouteElectrification(before,'route:12');
  assert.deepEqual(game.dispatch({sequence:1,command:{type:'electrifyRoute',routeId:'route:12'}}),{ok:true,createdIds:[]});
  const state=game.snapshot();assert.equal(state.company.cash,before.company.cash-quote.cost);assert.equal(state.company.ledger.length,1);assert.deepEqual(state.company.ledger[0],{id:'transaction:13',tick:0,category:'construction',amount:-quote.cost,entityId:'route:12',description:'Route electrification'});
  assert.ok(Object.values(state.operations.infrastructure).every(item=>item.electrified));assert.equal(routeIsElectrified(state,state.routes[0]!),true);assert.equal(companyReport(state).infrastructureCost,200_000+quote.cost);
  assert.deepEqual(game.dispatch({sequence:2,command:{type:'electrifyRoute',routeId:'route:12'}}),{ok:false,reason:'Route is already fully electrified'});
});

test('unaffordable electrification is atomic and catenary upkeep is charged daily',()=>{
  const poor=new RailFrontierGame(fixture(1),terrain()),before=JSON.stringify(poor.snapshot());assert.deepEqual(poor.dispatch({sequence:1,command:{type:'electrifyRoute',routeId:'route:12'}}),{ok:false,reason:'Insufficient funds'});assert.equal(JSON.stringify(poor.snapshot()),before);
  const state=fixture(),quote=quoteRouteElectrification(state,'route:12');const game=new RailFrontierGame(state,terrain());assert.equal(game.dispatch({sequence:1,command:{type:'electrifyRoute',routeId:'route:12'}}).ok,true);const maintained=structuredClone(game.snapshot()) as GameState,ledgerBefore=maintained.company.ledger.length;postDailyMaintenance(maintained);
  assert.equal(maintained.company.ledger.length,ledgerBefore+6);assert.equal(maintained.company.ledger.filter(entry=>entry.description==='Electrification daily maintenance').reduce((sum,entry)=>sum-entry.amount,0),quote.maintenancePerDay);
});

test('splitting powered track preserves electrical status, historical cost and upkeep',()=>{
  const state=fixture(),infrastructure=state.operations.infrastructure['edge:8']!;infrastructure.electrified=true;infrastructure.electrificationCost=100*ELECTRIFICATION_COST_PER_M;infrastructure.electrificationMaintenancePerDay=72;
  const game=new RailFrontierGame(state,terrain()),curve=line({x:50,y:0,z:0},{x:50,y:0,z:100}),quote=game.previewTrack(curve),result=game.dispatch({sequence:1,command:{type:'buildTrack',curve,from:{position:curve.p0},to:{position:curve.p3},expectedRevision:1,quotedCost:quote.cost}});
  assert.equal(result.ok,true);const after=game.snapshot(),split=result.ok?result.createdIds.filter(id=>id.startsWith('edge:')).slice(0,2):[],records=split.map(id=>after.operations.infrastructure[id as `edge:${number}`]!);
  assert.equal(records.length,2);assert.ok(records.every(record=>record.electrified));assert.equal(records.reduce((sum,record)=>sum+record.electrificationCost,0),100*ELECTRIFICATION_COST_PER_M);assert.equal(records.reduce((sum,record)=>sum+record.electrificationMaintenancePerDay,0),72);
});
