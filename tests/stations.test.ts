import { test } from 'node:test';
import assert from 'node:assert/strict';
import { RailFrontierGame } from '../src/application/game.js';
import { createInitialState } from '../src/content/norway.js';
import type { CubicCurve, GameState, Vec3 } from '../src/domain/model.js';
import { townCoverage } from '../src/simulation/coverage.js';
import { Heightfield } from '../src/world/terrain.js';

const line=(p0:Vec3,p3:Vec3):CubicCurve=>({p0,p1:{x:(2*p0.x+p3.x)/3,y:(2*p0.y+p3.y)/3,z:(2*p0.z+p3.z)/3},p2:{x:(p0.x+2*p3.x)/3,y:(p0.y+2*p3.y)/3,z:(p0.z+2*p3.z)/3},p3});
const terrain=()=>new Heightfield(2,2,500,new Float64Array(4));
const builtGame=()=>{
  const game=new RailFrontierGame(createInitialState(),terrain()),curve=line({x:20,y:0,z:100},{x:180,y:0,z:100}),cost=game.previewTrack(curve).cost;
  assert.equal(game.dispatch({sequence:1,command:{type:'buildTrack',curve,from:{position:curve.p0},to:{position:curve.p3},expectedRevision:0,quotedCost:cost}}).ok,true);
  return game;
};

test('station construction requires rail, ground, known content and funds',()=>{
  const game=builtGame(),before=JSON.stringify(game.snapshot());
  assert.deepEqual(game.dispatch({sequence:2,command:{type:'buildStation',nodeId:'node:5',classId:'missing'}}),{ok:false,reason:'Unknown station class: missing'});
  assert.equal(JSON.stringify(game.snapshot()),before);
  const poor=structuredClone(game.snapshot()) as GameState;poor.company.openingCash=0;poor.company.cash=poor.company.ledger.reduce((sum,entry)=>sum+entry.amount,0);
  // Existing construction debit makes a zero opening balance invalid, so retain reconciliation with just less than station cost.
  poor.company.openingCash=poor.company.ledger[0]!.amount*-1+2_499_999;poor.company.cash=2_499_999;
  const poorGame=new RailFrontierGame(poor,terrain()),poorBefore=JSON.stringify(poorGame.snapshot());
  assert.deepEqual(poorGame.dispatch({sequence:2,command:{type:'buildStation',nodeId:'node:5',classId:'rural-halt'}}),{ok:false,reason:'Insufficient funds'});
  assert.equal(JSON.stringify(poorGame.snapshot()),poorBefore);
});

test('station purchase posts once and duplicate node placement rejects atomically',()=>{
  const game=builtGame();
  assert.deepEqual(game.dispatch({sequence:2,command:{type:'buildStation',nodeId:'node:5',classId:'rural-halt'}}),{ok:true,createdIds:['station:9']});
  const after=JSON.stringify(game.snapshot());
  assert.deepEqual(game.dispatch({sequence:3,command:{type:'buildStation',nodeId:'node:5',classId:'town-station'}}),{ok:false,reason:'A station already occupies this rail node'});
  assert.equal(JSON.stringify(game.snapshot()),after);
  assert.equal(game.snapshot().company.ledger.at(-1)!.amount,-2_500_000);
});

test('town coverage chooses one closest station with stable ID tie-breaking',()=>{
  const state=createInitialState();state.towns=[{id:'town:2',name:'Test',position:{x:100,y:0,z:100},population:100}];
  state.railway.nodes=[{id:'node:5',position:{x:50,y:0,z:100}},{id:'node:6',position:{x:150,y:0,z:100}}];
  state.stations=[{id:'station:7',nodeId:'node:6',townId:null,classId:'rural-halt',storage:[]},{id:'station:8',nodeId:'node:5',townId:null,classId:'rural-halt',storage:[]}];
  assert.equal(townCoverage(state).get('town:2'),'station:7');
  state.railway.nodes[0]!.position.x=99;
  assert.equal(townCoverage(state).get('town:2'),'station:8');
});
