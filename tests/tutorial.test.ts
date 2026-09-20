import test from 'node:test';
import assert from 'node:assert/strict';
import {createInitialState} from '../src/content/norway.js';
import {createFirstRailwayLearning,tutorialPrompt,updateLearningAfterCommand,updateLearningFromSimulation} from '../src/ui/tutorial.js';
import type {CubicCurve,GameState,Vec3} from '../src/domain/model.js';

const line=(p0:Vec3,p3:Vec3):CubicCurve=>({p0,p1:{x:(p0.x*2+p3.x)/3,y:0,z:0},p2:{x:(p0.x+p3.x*2)/3,y:0,z:0},p3});
const learningState=()=>{const state=createInitialState();state.learning=createFirstRailwayLearning(state);return state;};

test('first-railway reducer advances only from real bound entities and connected track',()=>{
  const state=learningState(),a={x:0,y:0,z:0},b={x:100,y:0,z:0};state.railway.nodes=[{id:'node:5',position:a},{id:'node:6',position:b}];
  state.stations.push({id:'station:7',nodeId:'node:5',townId:'town:2',classId:'rural-halt',storage:[],layout:{kind:'legacy-node',version:1},constructionCost:2_500_000});updateLearningAfterCommand(state,{type:'buildStation',nodeId:'node:5',classId:'rural-halt'},['station:7']);assert.equal(tutorialPrompt(state)?.stage,'station-two');
  state.stations.push({id:'station:8',nodeId:'node:6',townId:'town:3',classId:'rural-halt',storage:[],layout:{kind:'legacy-node',version:1},constructionCost:2_500_000});updateLearningAfterCommand(state,{type:'buildStation',nodeId:'node:6',classId:'rural-halt'},['station:8']);assert.equal(tutorialPrompt(state)?.stage,'track-planned');
  state.railway.edges.push({id:'edge:9',from:'node:5',to:'node:6',curve:line(a,b),speedLimitMps:20,ownerId:'company:1'});state.railway.revision=1;updateLearningAfterCommand(state,{type:'buildTrack',curve:line(a,b),from:{nodeId:'node:5'},to:{nodeId:'node:6'},expectedRevision:0,quotedCost:0},['edge:9']);assert.equal(tutorialPrompt(state)?.stage,'train-bought');assert.deepEqual(state.learning?.completedStages.slice(0,4),['station-one','station-two','track-planned','track-built']);
});

test('tutorial requires its bound train and route plus new passenger revenue',()=>{
  const state=learningState();state.learning!.completedStages=['station-one','station-two','track-planned','track-built'];state.trains.push({id:'train:5',routeId:null,locomotiveId:'nord-2-6-0',vehicleIds:['fjord-passenger-coach'],motion:{path:[],leg:0,distanceM:0,arrived:false},speedMps:0,phase:'idle',dwellTicks:0,cargo:[]});updateLearningAfterCommand(state,{type:'purchaseTrain',locomotiveId:'nord-2-6-0',vehicleIds:['fjord-passenger-coach'],stationId:'station:99'},['train:5']);assert.equal(tutorialPrompt(state)?.stage,'service-started');
  state.routes.push({id:'route:6',stops:['station:7','station:8'],mode:'shuttle'});updateLearningAfterCommand(state,{type:'createRoute',stops:['station:7','station:8'],mode:'shuttle'},['route:6']);state.trains[0]!.routeId='route:6';updateLearningAfterCommand(state,{type:'assignRoute',trainId:'train:5',routeId:'route:6'},[]);assert.equal(tutorialPrompt(state)?.stage,'first-revenue');
  state.operations.delivered.passengers=1;updateLearningFromSimulation(state);assert.equal(state.learning?.status,'active');state.company.ledger.push({id:'transaction:7',tick:0,category:'passenger',amount:100,entityId:'train:5',description:'Fare'});updateLearningFromSimulation(state);assert.equal(state.learning?.status,'complete');
});
