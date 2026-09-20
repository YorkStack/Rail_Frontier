import type {GameCommand} from '../application/ports.js';
import type {GameState,Id,LearningState,TutorialStage} from '../domain/model.js';
import {RailNetwork} from '../rail/graph.js';

export const FIRST_RAILWAY_LESSON='norway-first-railway' as const;
export const TUTORIAL_STAGES:readonly TutorialStage[]=['station-one','station-two','track-planned','track-built','train-bought','service-started','first-revenue'];

export interface TutorialPrompt {step:number;total:number;stage:TutorialStage;title:string;instruction:string;action:'station'|'track'|'operations'|'observe'}

export function createFirstRailwayLearning(state:Pick<GameState,'operations'|'company'>):LearningState {
  return {lessonId:FIRST_RAILWAY_LESSON,version:1,status:'active',completedStages:[],bound:{stationIds:[],trainId:null,routeId:null},baseline:{passengersDelivered:state.operations.delivered.passengers,ledgerEntries:state.company.ledger.length}};
}

const addStage=(learning:LearningState,stage:TutorialStage)=>{if(!learning.completedStages.includes(stage))learning.completedStages.push(stage);};

export function updateLearningAfterCommand(state:GameState,command:GameCommand,createdIds:readonly string[]):void {
  const learning=state.learning;if(!learning||learning.status!=='active')return;
  if(command.type==='placeStation'||command.type==='buildStation')for(const id of createdIds){if(id.startsWith('station:')&&learning.bound.stationIds.length<2&&!learning.bound.stationIds.includes(id as Id<'station'>))learning.bound.stationIds.push(id as Id<'station'>);}
  if(command.type==='purchaseTrain'&&createdIds[0]?.startsWith('train:'))learning.bound.trainId=createdIds[0] as Id<'train'>;
  if(command.type==='createRoute'&&createdIds[0]?.startsWith('route:'))learning.bound.routeId=createdIds[0] as Id<'route'>;
  reconcileLearning(state);
}

export function updateLearningFromSimulation(state:GameState):void {if(state.learning?.status==='active')reconcileLearning(state);}

export function dismissLearning(state:GameState):void {if(state.learning?.status==='active')state.learning.status='dismissed';}

export function reconcileLearning(state:GameState):void {
  const learning=state.learning;if(!learning||learning.status!=='active')return;
  const stations=learning.bound.stationIds.filter(id=>state.stations.some(station=>station.id===id));learning.bound.stationIds=stations;
  if(stations.length>=1)addStage(learning,'station-one');if(stations.length>=2)addStage(learning,'station-two');
  if(stations.length>=2){const [first,second]=stations.map(id=>state.stations.find(station=>station.id===id)!);if(new RailNetwork(state.railway).findPath(first!.nodeId,second!.nodeId)){addStage(learning,'track-planned');addStage(learning,'track-built');}}
  const train=state.trains.find(item=>item.id===learning.bound.trainId);if(train)addStage(learning,'train-bought');
  const route=state.routes.find(item=>item.id===learning.bound.routeId);if(train&&route&&train.routeId===route.id)addStage(learning,'service-started');
  const newPassengerFare=state.company.ledger.slice(learning.baseline.ledgerEntries).some(entry=>entry.category==='passenger'&&entry.amount>0);
  if(state.operations.delivered.passengers>learning.baseline.passengersDelivered&&newPassengerFare)addStage(learning,'first-revenue');
  learning.completedStages.sort((a,b)=>TUTORIAL_STAGES.indexOf(a)-TUTORIAL_STAGES.indexOf(b));if(learning.completedStages.includes('first-revenue'))learning.status='complete';
}

export function tutorialPrompt(state:Readonly<GameState>,trackDraftReady=false):TutorialPrompt|null {
  const learning=state.learning;if(!learning||learning.status!=='active')return null;
  let stage=TUTORIAL_STAGES.find(candidate=>!learning.completedStages.includes(candidate))??'first-revenue';
  if(stage==='track-planned'&&trackDraftReady)stage='track-built';
  const copy:Record<TutorialStage,Omit<TutorialPrompt,'step'|'total'|'stage'>>={
    'station-one':{title:'Build the first station in Sundvik',instruction:'Open Build station, choose level ground near Sundvik and turn the platform toward Granli.',action:'station'},
    'station-two':{title:'Build the destination station',instruction:'Place a second station near Granli. It may exist before the connecting railway.',action:'station'},
    'track-planned':{title:'Plan the railway',instruction:'Drag from a highlighted station end to draw your route. Release at the other station. You can reshape the line by dragging its handles.',action:'track'},
    'track-built':{title:'Build the railway',instruction:'Review gradient, structures and cost, then buy the complete alignment once.',action:'track'},
    'train-bought':{title:'Assemble your first train',instruction:'Open Trains & lines and buy the recommended steam locomotive with two passenger coaches.',action:'operations'},
    'service-started':{title:'Start the shuttle service',instruction:'Keep the two ordered stops, create the shuttle and assign the waiting train.',action:'operations'},
    'first-revenue':{title:'Watch the first fare arrive',instruction:'Resume time and follow the train. The lesson completes after a real passenger delivery posts revenue.',action:'observe'}
  };
  return {step:TUTORIAL_STAGES.indexOf(stage)+1,total:TUTORIAL_STAGES.length,stage,...copy[stage]};
}
