import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createNorwayGameState} from '../src/content/industries.js';
import {campaignContentRegistry} from '../src/content/registry.js';
import {RailFrontierGame} from '../src/application/game.js';
import {surveyStationSite} from '../src/rail/station-layout.js';
import {stationDefinition} from '../src/content/stations.js';
import {generateWishCandidates} from '../src/rail/wish-corridor.js';
import {trackClasses} from '../src/content/track-classes.js';
import {captureTerrainWindow,hydrateTerrainWindow} from '../src/rail/terrain-window.js';
import {evaluateCorridorAlternatives} from '../src/rail/corridor-alternatives.js';
import {derivative} from '../src/rail/constraints.js';
import {followsOrderedCorridor} from '../src/rail/ordered-corridor.js';
import {ENGINEERING_RULES_VERSION} from '../src/content/engineering-rules.js';
import {Heightfield} from '../src/world/terrain.js';

for(const reverse of [false,true])test(`default station directions admit a certified valley railway (${reverse?'Granli → Sundvik':'Sundvik → Granli'})`,()=>{
 const initial=createNorwayGameState(),game=new RailFrontierGame(initial,campaignContentRegistry.resolve(initial).worldGenerator.generate(initial.world)),definition=stationDefinition('rural-halt')!;
 for(const town of initial.towns.slice(0,2)){
  const site=surveyStationSite(game.terrain,town.position,0,definition.platformLengthM),state=game.snapshot();
  const result=game.dispatch({sequence:state.operations.lastCommandSequence+1,command:{type:'placeStation',position:town.position,orientationRad:0,classId:definition.id,quotedCost:definition.purchaseCost+site.earthworkCost,expectedRevision:state.railway.revision}});assert.ok(result.ok);
 }
 const before=game.snapshot(),ports=before.stations.map((s,i)=>{if(s.layout.kind!=='single-platform')throw Error('Expected platform');const p=s.layout.ports[i===0?1:0];return {point:before.railway.nodes.find(n=>n.id===p.nodeId)!.position,outward:p.outward};});if(reverse)ports.reverse();
 const a=ports[0]!,b=ports[1]!,anchors=[a.point,{x:a.point.x+(b.point.x-a.point.x)*.75+20,y:1000,z:a.point.z+(b.point.z-a.point.z)*.75},b.point],unchanged=structuredClone(anchors),tangents={start:a.outward,end:{x:-b.outward.x,z:-b.outward.z}},terrain=hydrateTerrainWindow(captureTerrainWindow(game.terrain,anchors));
 const candidates=generateWishCandidates({anchors,terrain,trackClass:trackClasses.local,maxOffsetM:60,searchExpansionBudget:6000,tangents}),choices=evaluateCorridorAlternatives(candidates,game.terrain,trackClasses.local);
 assert.ok(choices.length,'Default platform orientation must not leave the starter valley without a route');assert.deepEqual(anchors,unchanged);assert.equal(game.snapshot().company.cash,before.company.cash);
 for(const choice of choices){
  assert.deepEqual(choice.curves[0]!.p0,a.point);assert.deepEqual(choice.curves.at(-1)!.p3,b.point);
  assert.ok(followsOrderedCorridor(choice.curves,anchors,choice.id.startsWith('wish:relaxed:')?150:120));
  for(const [d,t] of [[derivative(choice.curves[0]!,0),tangents.start],[derivative(choice.curves.at(-1)!,1),tangents.end]] as const){const length=Math.hypot(d.x,d.z);assert.ok(Math.abs(d.x/length-t.x)<1e-8);assert.ok(Math.abs(d.z/length-t.z)<1e-8);assert.ok(Math.abs(d.y)<1e-8);}
  assert.ok(choice.quotes.every(q=>q.valid));
 }
 const choice=choices[0]!;const result=game.dispatch({sequence:before.operations.lastCommandSequence+1,command:{type:'buildAlignment',curves:choice.curves,from:{position:a.point},to:{position:b.point},quotedCost:choice.cost,expectedRevision:before.railway.revision,trackClassId:'local',rulesVersion:ENGINEERING_RULES_VERSION}});
 assert.ok(result.ok,JSON.stringify(result));assert.equal(game.snapshot().company.cash,before.company.cash-choice.cost);assert.equal(game.snapshot().railway.revision,before.railway.revision+1);
});

test('station approach retries keep impossible heights and backwards departures invalid',()=>{
 const terrain=new Heightfield(41,41,50,new Float64Array(41*41));
 for(const anchors of [[{x:100,y:0,z:1000},{x:1900,y:800,z:1000}],[{x:900,y:0,z:1000},{x:1100,y:0,z:1000}]]){
  const candidates=generateWishCandidates({anchors,terrain,trackClass:trackClasses.local,maxOffsetM:60,tangents:{start:{x:-1,z:0},end:{x:-1,z:0}}});assert.deepEqual(candidates,[]);
 }
});
