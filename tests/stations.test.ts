import { test } from 'node:test';
import assert from 'node:assert/strict';
import { RailFrontierGame } from '../src/application/game.js';
import { createInitialState } from '../src/content/norway.js';
import type { CubicCurve, GameState, Vec3 } from '../src/domain/model.js';
import { industryCoverage,townCoverage } from '../src/simulation/coverage.js';
import { Heightfield } from '../src/world/terrain.js';
import { deserialize,serialize } from '../src/persistence/save.js';
import { stationDefinitions } from '../src/content/stations.js';
import { initialTownEconomy } from '../src/domain/operations.js';
import {surveyStationSite} from '../src/rail/station-layout.js';

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

test('two oriented stations can be built before external track and survive save reload',()=>{
  const state=createInitialState();state.towns=[{id:'town:2',name:'Testvik',position:{x:100,y:0,z:100},population:800}];state.operations.townEconomy=initialTownEconomy(state.towns);
  const game=new RailFrontierGame(state,terrain()),cost=stationDefinitions['rural-halt'].purchaseCost;
  assert.deepEqual(game.dispatch({sequence:1,command:{type:'placeStation',classId:'rural-halt',position:{x:100,z:100},orientationRad:Math.PI/2,expectedRevision:0,quotedCost:cost}}),{ok:true,createdIds:['station:5','node:6','node:7','node:8','edge:9','edge:10']});
  assert.deepEqual(game.dispatch({sequence:2,command:{type:'placeStation',classId:'rural-halt',position:{x:300,z:100},orientationRad:Math.PI/2,expectedRevision:1,quotedCost:cost}}),{ok:true,createdIds:['station:12','node:13','node:14','node:15','edge:16','edge:17']});
  const built=game.snapshot(),first=built.stations[0]!;assert.equal(built.railway.revision,2);assert.equal(built.railway.nodes.length,6);assert.equal(built.railway.edges.length,4);assert.equal(first.layout?.kind,'single-platform');assert.equal(first.constructionCost,cost);assert.equal(built.company.ledger.filter(entry=>entry.description==='Station construction').length,2);
  assert.equal(townCoverage(built).size,0);assert.equal(industryCoverage(built).size,0);
  assert.deepEqual(game.dispatch({sequence:3,command:{type:'purchaseTrain',locomotiveId:'nord-2-6-0',vehicleIds:['fjord-passenger-coach'],stationId:'station:5'}}),{ok:false,reason:'Purchase station needs an external track connection'});
  const loaded=deserialize(serialize(built));assert.deepEqual(loaded,built);
});

test('external track activates station coverage and train commissioning',()=>{
  const state=createInitialState();state.towns=[{id:'town:2',name:'Testvik',position:{x:100,y:0,z:100},population:800},{id:'town:3',name:'Portvik',position:{x:300,y:0,z:100},population:700}];state.operations.townEconomy=initialTownEconomy(state.towns);
  const game=new RailFrontierGame(state,terrain()),cost=stationDefinitions['rural-halt'].purchaseCost;
  assert.equal(game.dispatch({sequence:1,command:{type:'placeStation',classId:'rural-halt',position:{x:100,z:100},orientationRad:Math.PI/2,expectedRevision:0,quotedCost:cost}}).ok,true);
  assert.equal(game.dispatch({sequence:2,command:{type:'placeStation',classId:'rural-halt',position:{x:300,z:100},orientationRad:Math.PI/2,expectedRevision:1,quotedCost:cost}}).ok,true);
  const before=game.snapshot(),from=before.railway.nodes.find(node=>node.id==='node:8')!.position,to=before.railway.nodes.find(node=>node.id==='node:14')!.position,curve=line(from,to),quote=game.previewTrack(curve);
  assert.equal(game.dispatch({sequence:3,command:{type:'buildTrack',curve,from:{nodeId:'node:8'},to:{nodeId:'node:14'},expectedRevision:2,quotedCost:quote.cost}}).ok,true);
  assert.equal(townCoverage(game.snapshot()).get('town:2'),'station:5');assert.equal(townCoverage(game.snapshot()).get('town:3'),'station:12');
  assert.equal(game.dispatch({sequence:4,command:{type:'purchaseTrain',locomotiveId:'nord-2-6-0',vehicleIds:['fjord-passenger-coach'],stationId:'station:5'}}).ok,true);
});

test('station survey rejects stale, misquoted and steep placements atomically',()=>{
  const cost=stationDefinitions['rural-halt'].purchaseCost,game=new RailFrontierGame(createInitialState(),terrain()),before=JSON.stringify(game.snapshot());
  assert.deepEqual(game.dispatch({sequence:1,command:{type:'placeStation',classId:'rural-halt',position:{x:100,z:100},orientationRad:0,expectedRevision:1,quotedCost:cost}}),{ok:false,reason:'Station preview is stale'});assert.equal(JSON.stringify(game.snapshot()),before);
  assert.deepEqual(game.dispatch({sequence:1,command:{type:'placeStation',classId:'rural-halt',position:{x:100,z:100},orientationRad:0,expectedRevision:0,quotedCost:cost+1}}),{ok:false,reason:'Station quote is stale'});assert.equal(JSON.stringify(game.snapshot()),before);
  const steep=new Heightfield(2,2,500,new Float64Array([0,100,0,100])),steepGame=new RailFrontierGame(createInitialState(),steep),steepBefore=JSON.stringify(steepGame.snapshot()),result=steepGame.dispatch({sequence:1,command:{type:'placeStation',classId:'rural-halt',position:{x:250,z:250},orientationRad:Math.PI/2,expectedRevision:0,quotedCost:cost}});assert.equal(result.ok,false);if(!result.ok)assert.match(result.reason,/too steep/);assert.equal(JSON.stringify(steepGame.snapshot()),steepBefore);
});

test('station survey quotes and publishes balanced cut and fill on a moderate slope',()=>{
  const slope=new Heightfield(2,2,500,new Float64Array([0,50,0,50])),position={x:250,z:250},orientationRad=Math.PI/2,definition=stationDefinitions['rural-halt'],site=surveyStationSite(slope,position,orientationRad,definition.platformLengthM),quotedCost=definition.purchaseCost+site.earthworkCost,game=new RailFrontierGame(createInitialState(),slope),beforeCash=game.snapshot().company.cash;
  assert.ok(site.maxReliefM>2.5&&site.maxReliefM<12);assert.ok(site.cutVolumeM3>0);assert.ok(site.fillVolumeM3>0);assert.ok(site.earthworkCost>0);
  assert.deepEqual(game.dispatch({sequence:1,command:{type:'placeStation',classId:'rural-halt',position,orientationRad,expectedRevision:0,quotedCost}}),{ok:true,createdIds:['station:5','node:6','node:7','node:8','edge:9','edge:10']});
  const built=game.snapshot(),station=built.stations[0]!;assert.equal(station.constructionCost,quotedCost);assert.equal(built.company.cash,beforeCash-quotedCost);assert.equal(built.operations.terrain.operations[0]?.kind,'station-pad');
  for(const point of [site.center,site.portA,site.portB])assert.ok(Math.abs(game.terrain.sample(point.x,point.z).elevationM-(site.center.y-.55))<.001);
});

test('town coverage chooses one closest station with stable ID tie-breaking',()=>{
  const state=createInitialState();state.towns=[{id:'town:2',name:'Test',position:{x:100,y:0,z:100},population:100}];
  state.railway.nodes=[{id:'node:5',position:{x:50,y:0,z:100}},{id:'node:6',position:{x:150,y:0,z:100}}];
  state.stations=[{id:'station:7',nodeId:'node:6',townId:null,classId:'rural-halt',storage:[],layout:{kind:'legacy-node',version:1},constructionCost:2_500_000},{id:'station:8',nodeId:'node:5',townId:null,classId:'rural-halt',storage:[],layout:{kind:'legacy-node',version:1},constructionCost:2_500_000}];
  assert.equal(townCoverage(state).get('town:2'),'station:7');
  state.railway.nodes[0]!.position.x=99;
  assert.equal(townCoverage(state).get('town:2'),'station:8');
});

test('all six station classes form a strictly increasing capability ladder',()=>{
  const definitions=Object.values(stationDefinitions);assert.equal(definitions.length,6);
  assert.deepEqual(definitions.map(item=>item.id),['rural-halt','small-station','town-station','city-station','freight-terminal','major-terminal']);
  for(let index=1;index<definitions.length;index++){const before=definitions[index-1]!,after=definitions[index]!;assert.ok(after.purchaseCost>before.purchaseCost);assert.ok(after.maintenancePerDay>before.maintenancePerDay);assert.ok(after.coverageRadiusM>=before.coverageRadiusM);assert.ok(after.storageCapacity>=before.storageCapacity);assert.ok(after.platformLengthM>=before.platformLengthM);}
});

test('station upgrade charges only the capability difference and expands town coverage',()=>{
  const original=builtGame(),state=structuredClone(original.snapshot()) as GameState;state.towns[0]!.position={x:1100,y:0,z:100};
  state.stations=[{id:'station:9',nodeId:'node:5',townId:null,classId:'rural-halt',storage:[],layout:{kind:'legacy-node',version:1},constructionCost:2_500_000}];state.nextEntityId=10;
  const game=new RailFrontierGame(state,terrain()),beforeCash=game.snapshot().company.cash;
  assert.deepEqual(game.dispatch({sequence:2,command:{type:'upgradeStation',stationId:'station:9',classId:'small-station'}}),{ok:true,createdIds:[]});
  const upgraded=game.snapshot();assert.equal(upgraded.stations[0]!.classId,'small-station');assert.equal(upgraded.stations[0]!.townId,'town:2');assert.equal(upgraded.company.cash,beforeCash-2_000_000);assert.equal(upgraded.company.ledger.at(-1)!.amount,-2_000_000);
  const snapshot=JSON.stringify(upgraded);assert.deepEqual(game.dispatch({sequence:3,command:{type:'upgradeStation',stationId:'station:9',classId:'small-station'}}),{ok:false,reason:'Station already has this class'});assert.equal(JSON.stringify(game.snapshot()),snapshot);assert.deepEqual(game.dispatch({sequence:3,command:{type:'upgradeStation',stationId:'station:9',classId:'rural-halt'}}),{ok:false,reason:'Station upgrades cannot reduce capability'});assert.equal(JSON.stringify(game.snapshot()),snapshot);
  const poor=structuredClone(state);poor.company.cash=1_999_999;poor.company.openingCash=poor.company.cash-poor.company.ledger.reduce((sum,entry)=>sum+entry.amount,0);const poorGame=new RailFrontierGame(poor,terrain()),poorBefore=JSON.stringify(poorGame.snapshot());assert.deepEqual(poorGame.dispatch({sequence:2,command:{type:'upgradeStation',stationId:'station:9',classId:'small-station'}}),{ok:false,reason:'Insufficient funds'});assert.equal(JSON.stringify(poorGame.snapshot()),poorBefore);
});

test('save validation enforces station class and cargo storage capacity',()=>{
  const game=builtGame();assert.equal(game.dispatch({sequence:2,command:{type:'buildStation',nodeId:'node:5',classId:'rural-halt'}}).ok,true);
  const state=structuredClone(game.snapshot()) as GameState,station=state.stations[0]!;station.storage=[{kind:'mail',quantity:501,originId:station.id,destinationId:station.id,loadedTick:0,distanceM:0}];
  assert.throws(()=>serialize(state),/Station storage exceeds capacity/);station.storage=[];station.classId='unknown';assert.throws(()=>serialize(state),/Unknown station class/);
});

test('a built platform cannot buy an impossible class expansion or lose money on rejection',()=>{
 const game=new RailFrontierGame(createInitialState(),terrain()),site=surveyStationSite(game.terrain,{x:250,z:250},0,90);
 assert.equal(game.dispatch({sequence:1,command:{type:'placeStation',classId:'rural-halt',position:site.center,orientationRad:0,expectedRevision:0,quotedCost:stationDefinitions['rural-halt'].purchaseCost+site.earthworkCost}}).ok,true);
 const before=JSON.stringify(game.snapshot()),station=game.snapshot().stations[0]!;
 const result=game.dispatch({sequence:2,command:{type:'upgradeStation',stationId:station.id,classId:'major-terminal'}});
 assert.equal(result.ok,false);if(!result.ok)assert.match(result.reason,/requires rebuilding/);
 assert.equal(JSON.stringify(game.snapshot()),before);
});
