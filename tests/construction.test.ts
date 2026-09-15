import { test } from 'node:test';
import assert from 'node:assert/strict';
import { RailFrontierGame } from '../src/application/game.js';
import { createInitialState } from '../src/content/norway.js';
import type { CubicCurve, GameState, Vec3 } from '../src/domain/model.js';
import { compileCurve,pointAt } from '../src/rail/geometry.js';
import { solveHorizontalAlignment } from '../src/rail/alignment-solver.js';
import {trackClasses} from '../src/content/track-classes.js';
import {ENGINEERING_RULES_VERSION} from '../src/content/engineering-rules.js';
import {quoteTrack} from '../src/rail/planner.js';
import { deserialize, serialize } from '../src/persistence/save.js';
import { Heightfield } from '../src/world/terrain.js';

const terrain=()=>new Heightfield(2,2,500,new Float64Array(4));
const line=(p0:Vec3,p3:Vec3):CubicCurve=>({p0,p1:{x:(2*p0.x+p3.x)/3,y:(2*p0.y+p3.y)/3,z:(2*p0.z+p3.z)/3},p2:{x:(p0.x+2*p3.x)/3,y:(p0.y+2*p3.y)/3,z:(p0.z+2*p3.z)/3},p3});
const build=(game:RailFrontierGame,sequence:number,curve:CubicCurve,quotedCost=game.previewTrack(curve).cost)=>game.dispatch({sequence,command:{type:'buildTrack',curve,from:{position:curve.p0},to:{position:curve.p3},expectedRevision:game.snapshot().railway.revision,quotedCost}});

test('legal affordable construction commits graph, spans and one debit',()=>{
  const game=new RailFrontierGame(createInitialState(),terrain()),curve=line({x:20,y:0,z:100},{x:180,y:0,z:100}),quote=game.previewTrack(curve);
  assert.equal(quote.valid,true);
  assert.deepEqual(build(game,1,curve),{ok:true,createdIds:['node:5','node:6','edge:7']});
  const state=game.snapshot();
  assert.equal(state.railway.revision,1);assert.equal(state.railway.edges.length,1);assert.equal(state.company.ledger.length,1);
  assert.equal(state.company.cash,state.company.openingCash-quote.cost);
  assert.equal(state.operations.infrastructure['edge:7']!.constructionCost,quote.cost);
  assert.deepEqual(deserialize(serialize(structuredClone(state) as GameState)),state);
});

test('changed quote and insufficient funds leave construction state identical',()=>{
  const curve=line({x:20,y:0,z:100},{x:180,y:0,z:100});
  const game=new RailFrontierGame(createInitialState(),terrain()),before=JSON.stringify(game.snapshot());
  assert.deepEqual(build(game,1,curve,game.previewTrack(curve).cost+1),{ok:false,reason:'Track quote has changed'});
  assert.equal(JSON.stringify(game.snapshot()),before);
  const poor=createInitialState(),cost=game.previewTrack(curve).cost;poor.company.cash=cost-1;poor.company.openingCash=cost-1;
  const poorGame=new RailFrontierGame(poor,terrain()),poorBefore=JSON.stringify(poorGame.snapshot());
  assert.deepEqual(build(poorGame,1,curve),{ok:false,reason:'Insufficient funds'});
  assert.equal(JSON.stringify(poorGame.snapshot()),poorBefore);
});

test('endpoint construction splits an existing edge and preserves its historical cost',()=>{
  const game=new RailFrontierGame(createInitialState(),terrain()),trunk=line({x:20,y:0,z:100},{x:220,y:0,z:100});
  assert.equal(build(game,1,trunk).ok,true);
  const junction=pointAt(trunk,.5),branch=line(junction,{x:120,y:0,z:220}),quote=game.previewTrack(branch);
  const result=game.dispatch({sequence:2,command:{type:'buildTrack',curve:branch,from:{position:junction},to:{position:branch.p3},expectedRevision:1,quotedCost:quote.cost}});
  assert.deepEqual(result,{ok:true,createdIds:['node:9','edge:10','edge:11','node:12','edge:13']});
  const state=game.snapshot();
  assert.equal(state.railway.edges.length,3);assert.equal(state.railway.nodes.length,4);assert.equal(state.railway.edges.some(edge=>edge.id==='edge:7'),false);
  assert.equal(state.company.ledger[0]!.entityId,'edge:7');
  assert.equal(state.operations.infrastructure['edge:10']!.constructionCost+state.operations.infrastructure['edge:11']!.constructionCost,state.company.ledger[0]!.amount*-1);
  assert.doesNotThrow(()=>serialize(structuredClone(state) as GameState));
});

test('an interior crossing does not create connectivity without an endpoint anchor',()=>{
  const game=new RailFrontierGame(createInitialState(),terrain());
  assert.equal(build(game,1,line({x:50,y:0,z:150},{x:250,y:0,z:150})).ok,true);
  assert.equal(build(game,2,line({x:150,y:0,z:50},{x:150,y:0,z:250})).ok,true);
  assert.equal(game.snapshot().railway.nodes.length,4);
  assert.equal(game.snapshot().railway.edges.length,2);
});

test('multi-section alignment commits once with smooth waypoint joins',()=>{
  const game=new RailFrontierGame(createInitialState(),terrain()),points=[{x:20,y:0,z:100},{x:240,y:0,z:130},{x:460,y:0,z:100}],curves=solveHorizontalAlignment(points),quotedCost=curves.reduce((sum,curve)=>sum+game.previewTrack(curve).cost,0);
  assert.equal(curves.length,2);
  const result=game.dispatch({sequence:1,command:{type:'buildAlignment',curves,from:{position:points[0]!},to:{position:points[2]!},expectedRevision:0,quotedCost}});
  assert.equal(result.ok,true);
  const state=game.snapshot();
  assert.equal(state.railway.revision,1);assert.equal(state.railway.edges.length,2);assert.equal(state.railway.nodes.length,3);assert.equal(state.company.ledger.length,1);assert.equal(state.company.ledger[0]!.amount,-quotedCost);
  assert.equal(state.operations.infrastructure[state.railway.edges[0]!.id]!.constructionCost+state.operations.infrastructure[state.railway.edges[1]!.id]!.constructionCost,quotedCost);
});

test('invalid or stale multi-section alignment is atomic',()=>{
  const game=new RailFrontierGame(createInitialState(),terrain()),curves=solveHorizontalAlignment([{x:20,y:0,z:100},{x:240,y:0,z:130},{x:460,y:0,z:100}]),cost=curves.reduce((sum,curve)=>sum+game.previewTrack(curve).cost,0),before=JSON.stringify(game.snapshot());
  const broken=structuredClone(curves);broken[1]!.p0.x+=1;
  assert.equal(game.dispatch({sequence:1,command:{type:'buildAlignment',curves:broken,from:{position:broken[0]!.p0},to:{position:broken[1]!.p3},expectedRevision:0,quotedCost:cost}}).ok,false);
  assert.equal(JSON.stringify(game.snapshot()),before);
  assert.deepEqual(game.dispatch({sequence:1,command:{type:'buildAlignment',curves,from:{position:curves[0]!.p0},to:{position:curves[1]!.p3},expectedRevision:1,quotedCost:cost}}),{ok:false,reason:'Track preview is stale'});
  assert.equal(JSON.stringify(game.snapshot()),before);
});

test('track class revalidation sets its authoritative speed and exact premium',()=>{
  const game=new RailFrontierGame(createInitialState(),terrain()),curve=line({x:20,y:0,z:100},{x:480,y:0,z:100}),definition=trackClasses.regional,quote=quoteTrack(compileCurve(curve),terrain(),definition.constraints,definition.costMultiplier),local=game.previewTrack(curve);
  assert.ok(quote.cost>local.cost);assert.equal(game.dispatch({sequence:1,command:{type:'buildTrack',curve,from:{position:curve.p0},to:{position:curve.p3},expectedRevision:0,quotedCost:quote.cost,trackClassId:'regional',rulesVersion:ENGINEERING_RULES_VERSION}}).ok,true);
  const edge=game.snapshot().railway.edges[0]!;assert.equal(edge.speedLimitMps,definition.speedLimitMps);assert.equal(game.snapshot().operations.infrastructure[edge.id]!.constructionCost,quote.cost);
});

test('stale engineering rules reject classed construction atomically',()=>{
  const game=new RailFrontierGame(createInitialState(),terrain()),curve=line({x:20,y:0,z:100},{x:180,y:0,z:100}),before=JSON.stringify(game.snapshot()),quote=game.previewTrack(curve);
  assert.deepEqual(game.dispatch({sequence:1,command:{type:'buildTrack',curve,from:{position:curve.p0},to:{position:curve.p3},expectedRevision:0,quotedCost:quote.cost,trackClassId:'local',rulesVersion:ENGINEERING_RULES_VERSION+1}}),{ok:false,reason:'Engineering rules have changed'});assert.equal(JSON.stringify(game.snapshot()),before);
});
