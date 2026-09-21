import {createNorwayGameState} from '../content/industries.js';
import {campaignContentRegistry} from '../content/registry.js';
import {stationDefinition} from '../content/stations.js';
import type {GameState} from '../domain/model.js';
import {surveyStationSite} from '../rail/station-layout.js';
import {findPath} from '../rail/graph.js';
import {RailFrontierGame} from './game.js';

export const PRACTICE_CAPITAL=1_000_000_000;
export const constructionLessons=[
  {id:'valley',en:'1 · Through the valley',hintEn:'Connect Sundvik and Granli. Sketch your path and drag the line until it feels right.',names:['Sundvik','Granli'],angle:55,sites:null},
  {id:'inlet',en:'2 · Around the inlet',hintEn:'Straight across the water or along the west bank? Compare bridge length and cost. Wider detours reveal more options.',names:['South shore','North shore'],angle:0,sites:[{x:400,z:2000},{x:500,z:4500}]},
  {id:'ridge',en:'3 · Through the ridge',hintEn:'A ridge blocks the way. Compare tunnels and side detours: going around can shorten the tunnel, but may also need bridges.',names:['West ridge camp','East ridge camp'],angle:90,sites:[{x:9500,z:5250},{x:11000,z:5250}]},
  {id:'highland',en:'4 · Across the highlands',hintEn:'Between rock shoulders and deep gullies: compare a direct tunnel with a high route. Large changes can require extra bridges.',names:['West highland camp','East highland camp'],angle:50,sites:[{x:10650,z:7600},{x:11950,z:8650}]},
] as const;
export type ConstructionLessonId=typeof constructionLessons[number]['id'];
export function createConstructionPractice(id:ConstructionLessonId):GameState{
  const lesson=constructionLessons.find(l=>l.id===id)!;const candidate=createNorwayGameState();
  candidate.company.cash=PRACTICE_CAPITAL;candidate.company.openingCash=PRACTICE_CAPITAL;
  const content=campaignContentRegistry.resolve(candidate),practice=new RailFrontierGame(candidate,content.worldGenerator.generate(candidate.world),{initialSpeed:0}),definition=stationDefinition('rural-halt')!,orientationRad=lesson.angle*Math.PI/180;
  for(const position of lesson.sites??candidate.towns.slice(0,2).map(t=>t.position)){
    const site=surveyStationSite(practice.terrain,position,orientationRad,definition.platformLengthM),state=practice.snapshot(),result=practice.dispatch({sequence:state.operations.lastCommandSequence+1,command:{type:'placeStation',position,orientationRad,classId:definition.id,expectedRevision:state.railway.revision,quotedCost:definition.purchaseCost+site.earthworkCost}});
    if(!result.ok)throw new Error(result.reason);
  }
  return structuredClone(practice.snapshot()) as GameState;
}
/** Identify fixed practice sites after loading too; completion always comes from the real graph. */
export function constructionPracticeProgress(state:Readonly<GameState>){
  if(state.campaignId!=='norwegian-fjords'||state.campaignVersion!==3||state.company.openingCash!==PRACTICE_CAPITAL)return null;
  for(const lesson of constructionLessons){
    const sites=lesson.sites??state.towns.slice(0,2).map(t=>t.position),stations=sites.map(p=>state.stations.slice(0,2).find(s=>{const n=state.railway.nodes.find(n=>n.id===s.nodeId);return n&&Math.hypot(n.position.x-p.x,n.position.z-p.z)<1;}));
    if(stations.length===2&&stations.every(s=>s!==undefined))return {lesson,stationIds:stations.map(s=>s!.id),complete:findPath(state.railway,stations[0]!.nodeId,stations[1]!.nodeId)!==null};
  }return null;
}
