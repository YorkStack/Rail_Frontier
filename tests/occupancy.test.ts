import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState } from '../src/content/norway.js';
import type { CubicCurve, GameState, Vec3 } from '../src/domain/model.js';
import { createTrainSimulation } from '../src/simulation/trains.js';

const line=(p0:Vec3,p3:Vec3):CubicCurve=>({p0,p1:{x:(2*p0.x+p3.x)/3,y:(2*p0.y+p3.y)/3,z:(2*p0.z+p3.z)/3},p2:{x:(p0.x+2*p3.x)/3,y:(p0.y+2*p3.y)/3,z:(p0.z+2*p3.z)/3},p3});
function opposing():GameState {
  const state=createInitialState(),a={x:0,y:0,z:0},b={x:80,y:0,z:0};
  state.railway={revision:1,nodes:[{id:'node:5',position:a},{id:'node:6',position:b}],edges:[{id:'edge:7',from:'node:5',to:'node:6',curve:line(a,b),speedLimitMps:15,ownerId:'company:1'}]};
  state.stations=[{id:'station:8',nodeId:'node:5',townId:null,classId:'rural-halt',storage:[],layout:{kind:'legacy-node',version:1},constructionCost:2_500_000},{id:'station:9',nodeId:'node:6',townId:null,classId:'rural-halt',storage:[],layout:{kind:'legacy-node',version:1},constructionCost:2_500_000}];
  state.routes=[{id:'route:10',stops:['station:8','station:9'],mode:'shuttle'}];
  state.trains=[
    {id:'train:11',routeId:'route:10',locomotiveId:'nord-2-6-0',vehicleIds:[],motion:{path:[{edgeId:'edge:7',reverse:false}],leg:0,distanceM:0,arrived:false},speedMps:0,phase:'running',dwellTicks:0,cargo:[]},
    {id:'train:12',routeId:'route:10',locomotiveId:'nord-2-6-0',vehicleIds:[],motion:{path:[{edgeId:'edge:7',reverse:true}],leg:0,distanceM:0,arrived:false},speedMps:0,phase:'running',dwellTicks:0,cargo:[]}
  ];
  state.operations.trainServices['train:11']={nextStopIndex:1,direction:1,ageDays:0,condition:1,distanceM:0,revenue:0,operatingCosts:0,costRemainder:0};
  state.operations.trainServices['train:12']={nextStopIndex:0,direction:-1,ageDays:0,condition:1,distanceM:0,revenue:0,operatingCosts:0,costRemainder:0};state.nextEntityId=13;
  return state;
}

test('opposing trains cannot share a reserved edge and the waiter resumes after release',()=>{
  const state=opposing(),step=createTrainSimulation();state.tick++;step(state);
  assert.equal(state.trains[0]!.phase,'running');assert.equal(state.trains[1]!.phase,'blocked');
  assert.deepEqual(state.operations.reservations,[{edgeId:'edge:7',trainId:'train:11'}]);assert.equal(state.trains[1]!.motion.distanceM,0);
  const firstPhase=()=>state.trains[0]!.phase;
  let ticks=0;while(firstPhase()!=='dwelling'&&ticks++<3000){state.tick++;step(state);}
  assert.equal(state.trains[0]!.phase,'dwelling');state.tick++;step(state);
  assert.equal(state.trains[1]!.phase,'running');assert.equal(state.operations.reservations[0]!.trainId,'train:12');
});

test('reservation state is deterministically rebuilt from active train IDs',()=>{
  const a=opposing(),b=opposing(),stepA=createTrainSimulation(),stepB=createTrainSimulation();
  a.operations.reservations=[{edgeId:'edge:7',trainId:'train:12'}];
  stepA(a);stepB(b);
  assert.deepEqual(a.operations.reservations,b.operations.reservations);assert.deepEqual(a.trains,b.trains);
});

test('opposing departures reserve the complete single-track corridor before entry',()=>{
  const state=createInitialState(),points=[0,80,160,240].map(x=>({x,y:0,z:0}));
  state.railway={revision:1,nodes:points.map((position,index)=>({id:`node:${index+5}` as `node:${number}`,position})),edges:[0,1,2].map(index=>({id:`edge:${index+9}` as `edge:${number}`,from:`node:${index+5}` as `node:${number}`,to:`node:${index+6}` as `node:${number}`,curve:line(points[index]!,points[index+1]!),speedLimitMps:15,ownerId:'company:1'}))};
  state.stations=[{id:'station:12',nodeId:'node:5',townId:null,classId:'rural-halt',storage:[],layout:{kind:'legacy-node',version:1},constructionCost:2_500_000},{id:'station:13',nodeId:'node:8',townId:null,classId:'rural-halt',storage:[],layout:{kind:'legacy-node',version:1},constructionCost:2_500_000}];state.routes=[{id:'route:14',stops:['station:12','station:13'],mode:'shuttle'}];
  state.trains=[{id:'train:15',routeId:'route:14',locomotiveId:'nord-2-6-0',vehicleIds:[],motion:{path:[{edgeId:'edge:9',reverse:false},{edgeId:'edge:10',reverse:false},{edgeId:'edge:11',reverse:false}],leg:0,distanceM:0,arrived:false},speedMps:0,phase:'running',dwellTicks:0,cargo:[]},{id:'train:16',routeId:'route:14',locomotiveId:'nord-2-6-0',vehicleIds:[],motion:{path:[{edgeId:'edge:11',reverse:true},{edgeId:'edge:10',reverse:true},{edgeId:'edge:9',reverse:true}],leg:0,distanceM:0,arrived:false},speedMps:0,phase:'running',dwellTicks:0,cargo:[]}];
  state.operations.trainServices['train:15']={nextStopIndex:1,direction:1,ageDays:0,condition:1,distanceM:0,revenue:0,operatingCosts:0,costRemainder:0};state.operations.trainServices['train:16']={nextStopIndex:0,direction:-1,ageDays:0,condition:1,distanceM:0,revenue:0,operatingCosts:0,costRemainder:0};state.nextEntityId=17;
  const step=createTrainSimulation();state.tick++;step(state);assert.deepEqual(state.operations.reservations,[{edgeId:'edge:10',trainId:'train:15'},{edgeId:'edge:11',trainId:'train:15'},{edgeId:'edge:9',trainId:'train:15'}]);assert.equal(state.trains[1]!.phase,'blocked');assert.equal(state.trains[1]!.motion.distanceM,0);
  let ticks=0;while(state.trains[0]!.phase!=='dwelling'&&ticks++<5000){state.tick++;step(state);}assert.equal(state.trains[0]!.phase,'dwelling');state.tick++;step(state);assert.equal(state.trains[1]!.phase,'running');assert.deepEqual(new Set(state.operations.reservations.map(item=>item.edgeId)),new Set(['edge:9','edge:10','edge:11']));assert.ok(state.operations.reservations.every(item=>item.trainId==='train:16'));
});
