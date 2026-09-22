import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createConstructionPractice,constructionPracticeProgress} from '../src/application/construction-practice.js';
import {practiceService} from '../src/ui/practice-service.js';
import {RailFrontierGame} from '../src/application/game.js';
import {campaignContentRegistry} from '../src/content/registry.js';
import {generateWishCandidates} from '../src/rail/wish-corridor.js';
import {evaluateCorridorAlternatives} from '../src/rail/corridor-alternatives.js';
import {trackClasses} from '../src/content/track-classes.js';
import {ENGINEERING_RULES_VERSION} from '../src/content/engineering-rules.js';
import type {GameCommand} from '../src/application/ports.js';
import {serialize,deserialize} from '../src/persistence/save.js';

function fixture(){
 const state=createConstructionPractice('valley'),game=new RailFrontierGame(state,campaignContentRegistry.resolve(state).worldGenerator.generate(state.world));
 const step=()=>practiceService(game.snapshot(),constructionPracticeProgress(game.snapshot())!);
 const dispatch=(command:GameCommand)=>{const result=game.dispatch({sequence:game.snapshot().operations.lastCommandSequence+1,command});assert.equal(result.ok,true,JSON.stringify(result));return result;};
 assert.equal(step().stage,'build');
 const ports=state.stations.map((s,i)=>{if(s.layout.kind!=='single-platform')throw Error('No platform');const port=s.layout.ports[i===0?1:0];return {point:state.railway.nodes.find(n=>n.id===port.nodeId)!.position,outward:port.outward};});
 const candidates=generateWishCandidates({anchors:ports.map(p=>p.point),terrain:game.terrain,trackClass:trackClasses.local,maxOffsetM:300,tangents:{start:ports[0]!.outward,end:{x:-ports[1]!.outward.x,z:-ports[1]!.outward.z}}}),choice=evaluateCorridorAlternatives(candidates,game.terrain,trackClasses.local,true)[0]!;
 dispatch({type:'buildAlignment',curves:choice.curves,from:{position:choice.curves[0]!.p0},to:{position:choice.curves.at(-1)!.p3},quotedCost:choice.cost,expectedRevision:state.railway.revision,trackClassId:'local',rulesVersion:ENGINEERING_RULES_VERSION});
 return {game,step,dispatch};
}
test('practice guidance follows real purchases, stops and service through save/load',()=>{
 const {game,step,dispatch}=fixture(),stations=game.snapshot().stations;
 assert.equal(step().stage,'buy');assert.equal(step().passengerTowns,true);
 dispatch({type:'purchaseTrain',stationId:stations[1]!.id,locomotiveId:'nord-2-6-0',vehicleIds:['fjord-passenger-coach','fjord-passenger-coach']});assert.equal(step().stage,'route');assert.equal(step().purchaseStationId,stations[1]!.id);
 dispatch({type:'createRoute',stops:stations.map(s=>s.id),mode:'shuttle'});assert.equal(step().stage,'assign');const selected=step();
 const restored=deserialize(serialize(structuredClone(game.snapshot())));assert.deepEqual(practiceService(restored,constructionPracticeProgress(restored)!),selected);
 dispatch({type:'assignRoute',trainId:selected.trainId!,routeId:selected.routeId!});assert.equal(step().stage,'run');const unchanged=structuredClone(game.snapshot());step();assert.deepEqual(game.snapshot(),unchanged);
});
test('routes prepared before purchase are reused and remote exercises do not promise town demand',()=>{
 const {game,step,dispatch}=fixture();dispatch({type:'createRoute',stops:game.snapshot().stations.map(s=>s.id),mode:'shuttle'});const routeId=step().routeId;assert.equal(step().stage,'buy');assert.ok(routeId);
 dispatch({type:'purchaseTrain',stationId:game.snapshot().stations[0]!.id,locomotiveId:'nord-2-6-0',vehicleIds:['fjord-passenger-coach']});assert.equal(step().stage,'assign');assert.equal(step().routeId,routeId);
 const remote=createConstructionPractice('highland');assert.equal(practiceService(remote,constructionPracticeProgress(remote)!).passengerTowns,false);
});

test('guidance ignores an idle train away from a practice platform and unrelated routes',()=>{
 const {game,dispatch}=fixture();dispatch({type:'purchaseTrain',stationId:game.snapshot().stations[0]!.id,locomotiveId:'nord-2-6-0',vehicleIds:['fjord-passenger-coach']});
 const state=structuredClone(game.snapshot()),progress=constructionPracticeProgress(state)!;state.trains[0]!.motion.distanceM=5;
 state.routes.push({id:'route:999',stops:[state.stations[0]!.id,state.stations[0]!.id],mode:'shuttle'});
 const result=practiceService(state,progress);assert.equal(result.stage,'buy');assert.equal(result.trainId,null);assert.equal(result.routeId,null);
});
