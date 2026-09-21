import {test} from 'node:test';
import assert from 'node:assert/strict';
import {comparisonBaseline,comparisonRange,routeDifference} from '../src/ui/route-comparison.js';
import {straightCurve} from '../src/content/norway-preview.js';
import type {CorridorAlternative} from '../src/rail/corridor-alternatives.js';

const option=(id:string,cost:number)=>({id,cost,lengthM:1000} as CorridorAlternative);
const curve=(a:number,b:number)=>straightCurve({x:a,y:0,z:0},{x:b,y:0,z:0});
test('price comparison uses the current engineering plan even when a cheaper option comes first',()=>{
 const cheap=option('engineering:detour',40000),current=option('engineering:current',80000),expensive=option('engineering:tunnel',120000),choices=[cheap,current,expensive];
 assert.equal(comparisonBaseline(choices),current);assert.deepEqual(routeDifference(cheap,current),{cost:-40000,lengthM:0});assert.equal(routeDifference(expensive,current).cost,40000);
 assert.equal(comparisonBaseline([cheap,expensive]),cheap);assert.equal(comparisonBaseline([]),undefined);
});
test('local splice display preserves exact outside curves when the compared section changes count',()=>{
 const baseline=[curve(0,100),curve(100,200),curve(200,300),curve(300,400)],candidate=[baseline[0]!,curve(100,150),curve(150,250),curve(250,300),baseline[3]!],scope={fromCurve:1,toCurve:2};
 assert.deepEqual(comparisonRange(candidate,baseline,scope),{from:1,to:4,retainsOutside:true});
 assert.deepEqual(comparisonRange(baseline,baseline,scope),{from:1,to:3,retainsOutside:true});
 assert.deepEqual(comparisonRange(candidate,baseline,{fromCurve:0,toCurve:3}),{from:0,to:5,retainsOutside:false});
});
test('changed outside geometry or invalid boundaries cannot be described as retained',()=>{
 const baseline=[curve(0,100),curve(100,200),curve(200,300)],candidate=structuredClone(baseline);candidate[0]!.p1.y=1;
 assert.deepEqual(comparisonRange(candidate,baseline,{fromCurve:1,toCurve:1}),{from:0,to:3,retainsOutside:false});
 for(const scope of [{fromCurve:-1,toCurve:1},{fromCurve:1,toCurve:5},{fromCurve:2,toCurve:1}])assert.equal(comparisonRange(baseline,baseline,scope).retainsOutside,false);
});
