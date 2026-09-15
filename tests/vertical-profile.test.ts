import {test} from 'node:test';
import assert from 'node:assert/strict';
import type {CubicCurve,Vec3} from '../src/domain/model.js';
import {solveHorizontalAlignment} from '../src/rail/alignment-solver.js';
import {derivative,tangentCompatible} from '../src/rail/constraints.js';
import {certifyVerticalProfile,solveVerticalProfile} from '../src/rail/vertical-profile.js';
import {trackClasses} from '../src/content/track-classes.js';

const points=(values:readonly [number,number,number][]):Vec3[]=>values.map(([x,y,z])=>({x,y,z}));
const grade=(curve:CubicCurve,t:number)=>{const value=derivative(curve,t);return value.y/Math.hypot(value.x,value.z);};

test('vertical profile meets platforms level and joins with continuous grade',()=>{
  const anchors=points([[0,10,0],[450,20,80],[900,15,0]]),horizontal=solveHorizontalAlignment(anchors),limits=trackClasses.local.constraints,profile=solveVerticalProfile(horizontal,anchors.map(point=>point.y),limits,{startGrade:0,endGrade:0});
  assert.equal(profile.length,2);assert.ok(Math.abs(grade(profile[0]!,0))<1e-12);assert.ok(Math.abs(grade(profile[1]!,1))<1e-12);assert.ok(tangentCompatible(profile[0]!,profile[1]!));
  const certificate=certifyVerticalProfile(profile,limits);assert.equal(certificate.valid,true);assert.ok(certificate.maxGrade<=limits.maxGrade);
});

test('vertical solver rejects an impossible class grade without mutating input',()=>{
  const anchors=points([[0,0,0],[100,10,0]]),horizontal=solveHorizontalAlignment(anchors),before=structuredClone(horizontal);
  assert.throws(()=>solveVerticalProfile(horizontal,[0,10],trackClasses.mainline.constraints,{startGrade:0,endGrade:0}),/Required average grade/);assert.deepEqual(horizontal,before);
});

test('track classes progressively tighten geometry and raise speed and cost',()=>{
  const {local,regional,mainline}=trackClasses;assert.ok(local.constraints.maxGrade>regional.constraints.maxGrade&&regional.constraints.maxGrade>mainline.constraints.maxGrade);assert.ok(local.constraints.minRadiusM<regional.constraints.minRadiusM&&regional.constraints.minRadiusM<mainline.constraints.minRadiusM);assert.ok(local.speedLimitMps<regional.speedLimitMps&&regional.speedLimitMps<mainline.speedLimitMps);assert.ok(local.costMultiplier<regional.costMultiplier&&regional.costMultiplier<mainline.costMultiplier);
});
