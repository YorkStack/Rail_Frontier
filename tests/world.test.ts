import { createHash } from 'node:crypto';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { norway,norwayV2 } from '../src/content/norway.js';
import type { CubicCurve, Vec3 } from '../src/domain/model.js';
import { compileCurve } from '../src/rail/geometry.js';
import { quoteTrack } from '../src/rail/planner.js';
import {norwayV2WorldGenerator,norwayV3WorldGenerator} from '../src/world/norway-generators.js';
import type {WorldGenerator} from '../src/world/generator.js';

const line=(p0:Vec3,p3:Vec3):CubicCurve=>({p0,p1:{x:(2*p0.x+p3.x)/3,y:(2*p0.y+p3.y)/3,z:(2*p0.z+p3.z)/3},p2:{x:(p0.x+2*p3.x)/3,y:(p0.y+2*p3.y)/3,z:(p0.z+2*p3.z)/3},p3});
const fingerprint=(seed:number,definitionBase=norway.world,generator:WorldGenerator=norwayV3WorldGenerator)=>{
  const definition={...definitionBase,seed},terrain=generator.generate(definition),values:string[]=[];
  for(let z=0;z<=definition.depthM;z+=800)for(let x=0;x<=definition.widthM;x+=800) {
    const sample=terrain.sample(x,z);values.push(sample.elevationM.toFixed(6),sample.forest.toFixed(6),sample.rock.toFixed(6),sample.urban.toFixed(6));
  }
  return createHash('sha256').update(values.join('|')).digest('hex');
};

test('production Norway terrain has a stable fingerprint',()=>{
  const first=fingerprint(norway.world.seed);
  assert.equal(first,fingerprint(norway.world.seed));
  assert.notEqual(first,fingerprint(norway.world.seed+1));
  assert.equal(first,'3f639ef123fbf66b265a2f4c31e73e6a02f2e60427929cc318d27eeb761d7b3c');
});

test('Norway V2 has stable two-bank fjord landforms distinct from production',()=>{
  assert.equal(fingerprint(norwayV2.world.seed,norwayV2.world,norwayV2WorldGenerator),'de823d1afe68daa35aa9ec8f6e28a16596b1807beb21c445637e02c4ee26e031');
  const terrain=norwayV2WorldGenerator.generate(norwayV2.world);
  for(const z of [800,3200,6500,10500,15000]){
    const waterXs:number[]=[];for(let x=0;x<=terrain.widthM;x+=100)if(terrain.sample(x,z).elevationM<0)waterXs.push(x);
    assert.ok(waterXs.length>=10,`fjord is missing at z=${z}`);assert.ok(Math.min(...waterXs)>0,`west bank is missing at z=${z}`);assert.ok(Math.max(...waterXs)<terrain.widthM,`east bank is missing at z=${z}`);
  }
  assert.notEqual(fingerprint(norwayV2.world.seed,norwayV2.world,norwayV2WorldGenerator),fingerprint(norway.world.seed));
});

test('Norway settlements sit on authoritative land with deterministic masks',()=>{
  const terrain=norwayV3WorldGenerator.generate(norway.world);
  for(const town of norway.towns) {
    const sample=terrain.sample(town.position.x,town.position.z);
    assert.ok(sample.elevationM>0);
    assert.ok(Math.abs(sample.elevationM-town.position.y)<1e-9);
    assert.ok(sample.urban>.9);
    assert.ok(sample.forest>=0&&sample.forest<=1&&sample.rock>=0&&sample.rock<=1);
  }
  assert.equal(norway.version,3);assert.equal(norway.world.generatorVersion,3);
});

test('the authored valley provides a feasible first inter-town rail corridor',()=>{
  const terrain=norwayV3WorldGenerator.generate(norway.world),curve=line(norway.towns[0]!.position,norway.towns[1]!.position),quote=quoteTrack(compileCurve(curve),terrain);
  assert.equal(quote.valid,true,quote.reasons.join(' · '));
  assert.ok(quote.intervals.length>100);
});

test('registered Norway generators expose current landform anchors and water banks',()=>{
  const v2=norwayV2WorldGenerator.landforms,v3=norwayV3WorldGenerator.landforms,b=v2.waterCrossSection(3200);
  assert.deepEqual(Object.keys(v2.anchors),['settlement-1','settlement-2','settlement-3']);
  assert.ok(b.westBankX!==null&&b.eastBankX!==null&&b.westBankX<b.eastBankX);assert.equal(v2.waterfall?.bank,'east');assert.ok(v3.watercourse);assert.ok(v3.watercourse!.upstream.x>v3.watercourse!.lip.x&&v3.watercourse!.lip.x>v3.watercourse!.plunge.x&&v3.watercourse!.plunge.x>v3.watercourse!.outlet.x);
});

test('Norway V3 adds steep cliff clusters and a descending connected watercourse',()=>{
  const terrain=norwayV3WorldGenerator.generate(norway.world),course=norwayV3WorldGenerator.landforms.watercourse!;
  const heights=[course.upstream,course.lip,course.plunge,course.outlet].map(point=>terrain.sample(point.x,point.z).elevationM);assert.ok(heights[0]!>heights[1]!);assert.ok(heights[1]!-heights[2]!>120);assert.ok(heights[2]!>=heights[3]!);
  for(const [x,z] of [[4300,7350],[10100,8850],[900,10600]] as const){const centre=terrain.sample(x,z).elevationM,face=terrain.sample(x-260,z).elevationM;assert.ok(Math.abs(centre-face)>35);}
});


test('production fjord remains below sea level and requires a real water crossing',()=>{
  const terrain=norwayV3WorldGenerator.generate(norway.world);
  for(const z of [800,3200,6500,10500,15000]){
    const section=norwayV3WorldGenerator.landforms.waterCrossSection(z);
    assert.ok(terrain.sample((section.westBankX!+section.eastBankX!)/2,z).elevationM<0);
  }
  const quote=quoteTrack(compileCurve(line({x:600,y:10,z:3200},{x:1800,y:10,z:3200})),terrain);
  assert.ok(quote.intervals.filter(s=>s.kind==='bridge').reduce((sum,s)=>sum+s.endM-s.startM,0)>1000);
});
