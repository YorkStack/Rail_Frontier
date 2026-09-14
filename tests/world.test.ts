import { createHash } from 'node:crypto';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { norway,norwayV1 } from '../src/content/norway.js';
import type { CubicCurve, Vec3 } from '../src/domain/model.js';
import { compileCurve } from '../src/rail/geometry.js';
import { quoteTrack } from '../src/rail/planner.js';
import { generateWorld } from '../src/world/generator.js';
import {norwayV1WorldProfile} from '../src/world/norway-v1.js';

const line=(p0:Vec3,p3:Vec3):CubicCurve=>({p0,p1:{x:(2*p0.x+p3.x)/3,y:(2*p0.y+p3.y)/3,z:(2*p0.z+p3.z)/3},p2:{x:(p0.x+2*p3.x)/3,y:(p0.y+2*p3.y)/3,z:(p0.z+2*p3.z)/3},p3});
const fingerprint=(seed:number,definitionBase=norwayV1.world)=>{
  const definition={...definitionBase,seed},terrain=generateWorld(definition),values:string[]=[];
  for(let z=0;z<=definition.depthM;z+=800)for(let x=0;x<=definition.widthM;x+=800) {
    const sample=terrain.sample(x,z);values.push(sample.elevationM.toFixed(6),sample.forest.toFixed(6),sample.rock.toFixed(6),sample.urban.toFixed(6));
  }
  return createHash('sha256').update(values.join('|')).digest('hex');
};

test('production Norway terrain has a stable versioned fingerprint',()=>{
  const first=fingerprint(norwayV1.world.seed);
  assert.equal(first,fingerprint(norwayV1.world.seed));
  assert.notEqual(first,fingerprint(norwayV1.world.seed+1));
  assert.equal(first,'5e0a5b63073156cc412b17986651d1e777270198ab10f9e902e78e3cce5e7f1e');
});

test('Norway V2 has stable two-bank fjord landforms distinct from V1',()=>{
  assert.equal(fingerprint(norway.world.seed,norway.world),'de823d1afe68daa35aa9ec8f6e28a16596b1807beb21c445637e02c4ee26e031');
  const terrain=generateWorld(norway.world);
  for(const z of [800,3200,6500,10500,15000]){
    const waterXs:number[]=[];for(let x=0;x<=terrain.widthM;x+=100)if(terrain.sample(x,z).elevationM<0)waterXs.push(x);
    assert.ok(waterXs.length>=10,`fjord is missing at z=${z}`);assert.ok(Math.min(...waterXs)>0,`west bank is missing at z=${z}`);assert.ok(Math.max(...waterXs)<terrain.widthM,`east bank is missing at z=${z}`);
  }
  assert.notEqual(fingerprint(norway.world.seed,norway.world),fingerprint(norwayV1.world.seed,norwayV1.world));
});

test('V1 simulation profile is frozen and independent of the art palette',()=>{
  assert.ok(Object.isFrozen(norwayV1WorldProfile));
  assert.deepEqual({...norwayV1WorldProfile},{biomeId:'fjord',widthM:16000,depthM:16000,cellM:25,peakM:1250,seaLevelM:0,generatorVersion:1});
});

test('Norway settlements sit on authoritative land with deterministic masks',()=>{
  const terrain=generateWorld(norway.world);
  for(const town of norway.towns) {
    const sample=terrain.sample(town.position.x,town.position.z);
    assert.ok(sample.elevationM>0);
    assert.ok(Math.abs(sample.elevationM-town.position.y)<1e-9);
    assert.ok(sample.urban>.9);
    assert.ok(sample.forest>=0&&sample.forest<=1&&sample.rock>=0&&sample.rock<=1);
  }
  assert.equal(norway.version,2);assert.equal(norway.world.generatorVersion,2);
});

test('the authored valley provides a feasible first inter-town rail corridor',()=>{
  const terrain=generateWorld(norway.world),curve=line(norway.towns[0]!.position,norway.towns[1]!.position),quote=quoteTrack(compileCurve(curve),terrain);
  assert.equal(quote.valid,true,quote.reasons.join(' · '));
  assert.ok(quote.intervals.length>100);
});
