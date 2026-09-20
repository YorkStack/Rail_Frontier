import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createConstructionPractice,constructionPracticeProgress,PRACTICE_CAPITAL} from '../src/application/construction-practice.js';
import {RailFrontierGame} from '../src/application/game.js';
import {campaignContentRegistry} from '../src/content/registry.js';
import {generateWishCandidates} from '../src/rail/wish-corridor.js';
import {evaluateCorridorAlternatives} from '../src/rail/corridor-alternatives.js';
import {trackClasses} from '../src/content/track-classes.js';
import {ENGINEERING_RULES_VERSION} from '../src/content/engineering-rules.js';
import {serialize,deserialize} from '../src/persistence/save.js';
import type {GameState} from '../src/domain/model.js';

for(const id of ['valley','inlet','ridge'] as const)test(`${id}: prepared stations are charged and certified choices build at the quoted price`,()=>{
  const state=createConstructionPractice(id),base=campaignContentRegistry.resolve(state).worldGenerator.generate(state.world),game=new RailFrontierGame(state,base),progress=constructionPracticeProgress(state)!;
  assert.equal(progress.lesson.id,id);assert.equal(progress.complete,false);assert.equal(state.company.openingCash,PRACTICE_CAPITAL);assert.equal(state.company.ledger.length,2);assert.ok(state.company.cash<PRACTICE_CAPITAL);assert.ok(state.company.cash>700_000_000);
  const ports=state.stations.map((s,i)=>{assert.equal(s.layout.kind,'single-platform');if(s.layout.kind!=='single-platform')throw new Error('No platform');const port=s.layout.ports[i===0?1:0]!;return {point:state.railway.nodes.find(n=>n.id===port.nodeId)!.position,outward:port.outward};});
  const candidates=generateWishCandidates({anchors:ports.map(p=>p.point),terrain:game.terrain,trackClass:trackClasses.local,maxOffsetM:300,tangents:{start:ports[0]!.outward,end:{x:-ports[1]!.outward.x,z:-ports[1]!.outward.z}}});
  assert.equal(new Set(candidates.map(c=>c.id)).size,candidates.length);
  const choices=evaluateCorridorAlternatives(candidates,game.terrain,trackClasses.local,true);assert.ok(choices.length>=2);
  if(id==='inlet'){assert.ok(choices.some(c=>c.structureM<1),'land alternative');assert.ok(choices.some(c=>c.quotes.some(q=>q.intervals.some(i=>i.kind==='bridge'))),'water crossing');}
  if(id==='ridge')assert.ok(choices.some(c=>c.quotes.some(q=>q.intervals.some(i=>i.kind==='tunnel'))));
  for(const choice of choices){
    const buildGame=new RailFrontierGame(state,base),result=buildGame.dispatch({sequence:state.operations.lastCommandSequence+1,command:{type:'buildAlignment',curves:choice.curves,from:{position:choice.curves[0]!.p0},to:{position:choice.curves.at(-1)!.p3},quotedCost:choice.cost,expectedRevision:state.railway.revision,trackClassId:'local',rulesVersion:ENGINEERING_RULES_VERSION}});
    assert.equal(result.ok,true,JSON.stringify(result));const built=buildGame.snapshot();assert.equal(state.company.cash-built.company.cash,choice.cost);assert.equal(built.company.ledger.length,state.company.ledger.length+1);assert.equal(constructionPracticeProgress(built)?.complete,true);
    const restored=deserialize(serialize(structuredClone(built) as GameState));assert.equal(constructionPracticeProgress(restored)?.complete,true);assert.equal(restored.company.cash,built.company.cash);
  }
});
