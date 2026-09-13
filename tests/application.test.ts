import { test } from 'node:test';
import assert from 'node:assert/strict';
import { RailFrontierGame, GameSession, type AnimationEnvironment } from '../src/application/game.js';
import type { CommandHandlers } from '../src/application/commands.js';
import type { WorldRenderer } from '../src/application/ports.js';
import { createInitialState } from '../src/content/norway.js';
import { allocateId, type GameState, type Vec3 } from '../src/domain/model.js';
import { postExpense } from '../src/simulation/finance.js';
import { Heightfield } from '../src/world/terrain.js';

const terrain=()=>new Heightfield(2,2,16000,new Float64Array(4));
const withNode=():GameState=>{
  const state=createInitialState();
  state.railway.nodes.push({id:'node:5',position:{x:100,y:0,z:100}});
  state.nextEntityId=6;
  return state;
};
const json=(value:unknown)=>JSON.stringify(value);

test('gateway commits a successful handler once and rejects its replay',()=>{
  const handlers:CommandHandlers={buildStation:(state,command)=>{
    const stationId=allocateId(state,'station');
    state.stations.push({id:stationId,nodeId:command.nodeId,townId:null,classId:command.classId,storage:[]});
    postExpense(state,'construction',500,stationId,'Station construction');
    return {createdIds:[stationId]};
  }};
  const game=new RailFrontierGame(withNode(),terrain(),{handlers});
  const command={sequence:1,command:{type:'buildStation' as const,nodeId:'node:5' as const,classId:'rural-halt'}};
  assert.deepEqual(game.dispatch(command),{ok:true,createdIds:['station:6']});
  const after=json(game.snapshot());
  assert.deepEqual(game.dispatch(command),{ok:false,reason:'Expected command sequence 2'});
  assert.equal(json(game.snapshot()),after);
  assert.equal(game.snapshot().company.cash,249_999_500);
  assert.equal(game.snapshot().company.ledger.length,1);
});

test('handler exceptions and invalid references cannot leak partial state',()=>{
  let called=false;
  const handlers:CommandHandlers={buildStation:state=>{called=true;state.company.cash=0;state.stations.length=0;throw new Error('Construction failed');}};
  const game=new RailFrontierGame(withNode(),terrain(),{handlers}),before=json(game.snapshot());
  assert.deepEqual(game.dispatch({sequence:1,command:{type:'buildStation',nodeId:'node:999',classId:'rural-halt'}}),{ok:false,reason:'Unknown station node: node:999'});
  assert.equal(called,false);
  assert.equal(json(game.snapshot()),before);
  assert.deepEqual(game.dispatch({sequence:1,command:{type:'buildStation',nodeId:'node:5',classId:'rural-halt'}}),{ok:false,reason:'Construction failed'});
  assert.equal(called,true);
  assert.equal(json(game.snapshot()),before);
});

test('stale previews reject before construction and snapshots are deeply immutable',()=>{
  let called=false;
  const handlers:CommandHandlers={buildTrack:()=>{called=true;return {createdIds:[]};}};
  const game=new RailFrontierGame(withNode(),terrain(),{handlers});
  const curve={p0:{x:100,y:0,z:100},p1:{x:130,y:0,z:100},p2:{x:170,y:0,z:100},p3:{x:200,y:0,z:100}};
  const before=json(game.snapshot());
  const result=game.dispatch({sequence:1,command:{type:'buildTrack',curve,from:{nodeId:'node:5'},to:{position:curve.p3},expectedRevision:2,quotedCost:100}});
  assert.deepEqual(result,{ok:false,reason:'Track preview is stale'});
  assert.equal(called,false);
  const snapshot=game.snapshot();
  assert.throws(()=>{(snapshot.towns[0]!.position as Vec3).x=999;});
  assert.equal(json(game.snapshot()),before);
});

test('fixed simulation ticks honor speed commands and loaded sessions restart paused',()=>{
  const game=new RailFrontierGame(createInitialState(),terrain());
  assert.deepEqual(game.dispatch({sequence:1,command:{type:'setSpeed',speed:2}}),{ok:true,createdIds:[]});
  assert.equal(game.advance(.5).steps,20);
  assert.equal(game.snapshot().tick,20);
  const loaded=structuredClone(game.snapshot()) as GameState;
  game.replaceState(loaded);
  assert.equal(game.speed,0);
  assert.equal(game.advance(10).steps,0);
});

test('session visibility pause prevents hidden-time catch-up and dispose is complete',()=>{
  let callback:((time:number)=>void)|null=null,visibility:(()=>void)|null=null,cancelled=0,disposed=0,hidden=false,now=0;
  const environment:AnimationEnvironment={
    now:()=>now,
    requestFrame:next=>{callback=next;return 7;},
    cancelFrame:()=>{cancelled++;callback=null;},
    hidden:()=>hidden,
    listenVisibility:next=>{visibility=next;return ()=>{visibility=null;};}
  };
  const renderer:WorldRenderer={update:()=>{},pick:()=>null,focus:()=>{},dispose:()=>{disposed++;}};
  const game=new RailFrontierGame(createInitialState(),terrain());
  const session=new GameSession(game,renderer,environment);
  session.start();
  now=100;callback!(now);
  assert.equal(game.snapshot().tick,2);
  hidden=true;now=200;visibility!();
  now=10_200;callback!(now);
  assert.equal(game.snapshot().tick,2);
  hidden=false;now=20_200;visibility!();
  now=20_300;callback!(now);
  assert.equal(game.snapshot().tick,2);
  session.dispose();session.dispose();
  assert.equal(cancelled,1);assert.equal(disposed,1);assert.equal(visibility,null);
});
