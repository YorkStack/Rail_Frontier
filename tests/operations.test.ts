import { test } from 'node:test';
import assert from 'node:assert/strict';
import { RailFrontierGame } from '../src/application/game.js';
import { createInitialState } from '../src/content/norway.js';
import type { CubicCurve, GameState, Vec3 } from '../src/domain/model.js';
import { Heightfield } from '../src/world/terrain.js';

const line=(p0:Vec3,p3:Vec3):CubicCurve=>({p0,p1:{x:(2*p0.x+p3.x)/3,y:(2*p0.y+p3.y)/3,z:(2*p0.z+p3.z)/3},p2:{x:(p0.x+2*p3.x)/3,y:(p0.y+2*p3.y)/3,z:(p0.z+2*p3.z)/3},p3});
function operationalState():GameState {
  const state=createInitialState(),a={x:20,y:0,z:100},b={x:220,y:0,z:100};
  state.railway={revision:1,nodes:[{id:'node:5',position:a},{id:'node:6',position:b}],edges:[{id:'edge:7',from:'node:5',to:'node:6',curve:line(a,b),speedLimitMps:20,ownerId:'company:1'}]};
  state.stations=[{id:'station:8',nodeId:'node:5',townId:null,classId:'rural-halt',storage:[]},{id:'station:9',nodeId:'node:6',townId:null,classId:'rural-halt',storage:[]}];state.nextEntityId=10;
  return state;
}
const game=()=>new RailFrontierGame(operationalState(),new Heightfield(2,2,500,new Float64Array(4)));

test('mixed invalid vehicle selection and overdraft produce no train or debit',()=>{
  const instance=game(),before=JSON.stringify(instance.snapshot());
  assert.deepEqual(instance.dispatch({sequence:1,command:{type:'purchaseTrain',locomotiveId:'nord-2-6-0',vehicleIds:['missing'],stationId:'station:8'}}),{ok:false,reason:'Unknown rail vehicle: missing'});
  assert.equal(JSON.stringify(instance.snapshot()),before);
  const poor=operationalState();poor.company.cash=1;poor.company.openingCash=1;
  const poorGame=new RailFrontierGame(poor,new Heightfield(2,2,500,new Float64Array(4))),poorBefore=JSON.stringify(poorGame.snapshot());
  assert.deepEqual(poorGame.dispatch({sequence:1,command:{type:'purchaseTrain',locomotiveId:'nord-2-6-0',vehicleIds:['fjord-passenger-coach'],stationId:'station:8'}}),{ok:false,reason:'Insufficient funds'});
  assert.equal(JSON.stringify(poorGame.snapshot()),poorBefore);
});

test('train purchase creates an idle consist and one capital transaction',()=>{
  const instance=game();
  assert.deepEqual(instance.dispatch({sequence:1,command:{type:'purchaseTrain',locomotiveId:'nord-2-6-0',vehicleIds:['fjord-passenger-coach','fjord-passenger-coach'],stationId:'station:8'}}),{ok:true,createdIds:['train:10']});
  const state=instance.snapshot(),train=state.trains[0]!;
  assert.equal(train.phase,'idle');assert.equal(train.motion.path[0]!.edgeId,'edge:7');assert.equal(train.motion.path[0]!.reverse,false);
  assert.equal(state.company.ledger[0]!.amount,-18_000_000);assert.ok(state.operations.trainServices['train:10']);
});

test('route creation validates repeated and disconnected stops',()=>{
  const instance=game(),before=JSON.stringify(instance.snapshot());
  assert.deepEqual(instance.dispatch({sequence:1,command:{type:'createRoute',stops:['station:8','station:8'],mode:'shuttle'}}),{ok:false,reason:'A route cannot repeat a station'});
  assert.equal(JSON.stringify(instance.snapshot()),before);
  const state=operationalState();state.railway.edges=[];
  const disconnected=new RailFrontierGame(state,new Heightfield(2,2,500,new Float64Array(4)));
  assert.deepEqual(disconnected.dispatch({sequence:1,command:{type:'createRoute',stops:['station:8','station:9'],mode:'shuttle'}}),{ok:false,reason:'Route contains disconnected stops'});
});

test('purchased train can receive a connected shuttle route from its current station',()=>{
  const instance=game();
  assert.equal(instance.dispatch({sequence:1,command:{type:'purchaseTrain',locomotiveId:'nord-2-6-0',vehicleIds:['fjord-passenger-coach'],stationId:'station:8'}}).ok,true);
  assert.deepEqual(instance.dispatch({sequence:2,command:{type:'createRoute',stops:['station:8','station:9'],mode:'shuttle'}}),{ok:true,createdIds:['route:12']});
  assert.deepEqual(instance.dispatch({sequence:3,command:{type:'assignRoute',trainId:'train:10',routeId:'route:12'}}),{ok:true,createdIds:[]});
  const state=instance.snapshot(),train=state.trains[0]!;
  assert.equal(train.routeId,'route:12');assert.equal(train.phase,'running');assert.deepEqual(train.motion.path,[{edgeId:'edge:7',reverse:false}]);
  assert.equal(state.operations.trainServices['train:10']!.nextStopIndex,1);
});

test('station platforms reject overlong purchases and route assignments until upgraded',()=>{
  const instance=game(),longConsist=Array<string>(5).fill('fjord-passenger-coach'),before=JSON.stringify(instance.snapshot());
  assert.deepEqual(instance.dispatch({sequence:1,command:{type:'purchaseTrain',locomotiveId:'nord-2-6-0',vehicleIds:longConsist,stationId:'station:8'}}),{ok:false,reason:'Train is too long for the purchase station platform'});assert.equal(JSON.stringify(instance.snapshot()),before);
  assert.equal(instance.dispatch({sequence:1,command:{type:'upgradeStation',stationId:'station:8',classId:'small-station'}}).ok,true);
  assert.equal(instance.dispatch({sequence:2,command:{type:'purchaseTrain',locomotiveId:'nord-2-6-0',vehicleIds:longConsist,stationId:'station:8'}}).ok,true);
  assert.equal(instance.dispatch({sequence:3,command:{type:'createRoute',stops:['station:8','station:9'],mode:'shuttle'}}).ok,true);
  assert.deepEqual(instance.dispatch({sequence:4,command:{type:'assignRoute',trainId:'train:11',routeId:'route:13'}}),{ok:false,reason:'Train is too long for the platform at station:9'});
  assert.equal(instance.dispatch({sequence:4,command:{type:'upgradeStation',stationId:'station:9',classId:'small-station'}}).ok,true);
  assert.equal(instance.dispatch({sequence:5,command:{type:'assignRoute',trainId:'train:11',routeId:'route:13'}}).ok,true);
});
