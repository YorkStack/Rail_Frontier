import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Heightfield} from '../src/world/terrain.js';
import {compileCurve} from '../src/rail/geometry.js';
import {quoteTrack} from '../src/rail/planner.js';
import {buildEngineeringProfile} from '../src/ui/engineering-profile.js';

const terrain=new Heightfield(5,5,50,new Float64Array(25));

test('engineering profile combines curve chainage, structure totals and exact quoted costs',()=>{
  const curves=[{p0:{x:0,y:2,z:25},p1:{x:30,y:2,z:25},p2:{x:70,y:2,z:25},p3:{x:100,y:2,z:25}},{p0:{x:100,y:2,z:25},p1:{x:130,y:2,z:25},p2:{x:170,y:2,z:25},p3:{x:200,y:2,z:25}}],geometries=curves.map(curve=>compileCurve(curve)),quotes=geometries.map(geometry=>quoteTrack(geometry,terrain)),profile=buildEngineeringProfile(geometries,quotes,terrain,20);
  assert.equal(profile.lengthM,200);assert.equal(profile.totalCost,quotes.reduce((sum,quote)=>sum+quote.cost,0));assert.equal(profile.lengthByKind.ground,200);assert.equal(profile.spans.length,1);assert.equal(profile.points[0]!.distanceM,0);assert.equal(profile.points.at(-1)!.distanceM,200);assert.equal(profile.minimumRadiusM,Infinity);
});

test('engineering profile reports finite horizontal radius for a curved alignment',()=>{
  const geometry=compileCurve({p0:{x:0,y:2,z:0},p1:{x:0,y:2,z:80},p2:{x:80,y:2,z:100},p3:{x:150,y:2,z:100}}),quote=quoteTrack(geometry,terrain),profile=buildEngineeringProfile([geometry],[quote],terrain);
  assert.ok(Number.isFinite(profile.minimumRadiusM));assert.ok(profile.minimumRadiusM>50);assert.ok(profile.maxGrade<.001);
});
