import {test} from 'node:test';
import assert from 'node:assert/strict';
import {diagnoseSketch} from '../src/rail/sketch-diagnostics.js';
import {generateWishCandidates} from '../src/rail/wish-corridor.js';
import {trackClasses} from '../src/content/track-classes.js';
import {Heightfield} from '../src/world/terrain.js';
const p=(x:number,z:number)=>({x,y:0,z}),bounds={widthM:3000,depthM:3000};

test('self-crossing sketch reports its intersection and an editable point and never produces proposals',()=>{
 const points=[p(100,100),p(1500,1500),p(100,1500),p(1500,100)],issue=diagnoseSketch(points,bounds,100)!;
 assert.equal(issue.kind,'crossing');assert.equal(issue.blocking,true);assert.deepEqual(issue.position,p(800,800));assert.equal(issue.pointIndex,2);
 const terrain=new Heightfield(61,61,50,new Float64Array(61*61));assert.deepEqual(generateWishCandidates({anchors:points,terrain,trackClass:trackClasses.local}),[]);
});
test('normal corners, adjacent lines and an open return bend are not crossings',()=>{
 for(const points of [[p(100,100),p(500,100),p(900,100)],[p(100,100),p(900,100),p(900,100),p(900,1000)],[p(100,100),p(900,100),p(1200,500),p(900,900),p(100,900)]])assert.equal(diagnoseSketch(points,bounds,100)?.blocking??false,false);
});
test('collinear doubling back and touching a non-adjacent segment are identified',()=>{
 assert.equal(diagnoseSketch([p(100,100),p(900,100),p(400,100),p(1000,500)],bounds,100)?.kind,'overlap');
 assert.equal(diagnoseSketch([p(100,100),p(1000,100),p(1000,1000),p(500,100),p(500,500)],bounds,100)?.kind,'crossing');
});
test('an out-of-map point is marked at the boundary without rewriting the sketch',()=>{
 const points=[p(100,100),p(-50,600),p(1000,1000)],before=structuredClone(points),issue=diagnoseSketch(points,bounds,100)!;
 assert.equal(issue.kind,'outside');assert.equal(issue.pointIndex,1);assert.equal(issue.position.x,0);assert.deepEqual(points,before);
});
test('tight bends are advisory and the diagnosis follows the chosen radius standard',()=>{
 const points=[p(100,100),p(500,100),p(500,500)];assert.equal(diagnoseSketch(points,bounds,100),null);
 const issue=diagnoseSketch(points,bounds,320)!;assert.equal(issue.kind,'tight-bend');assert.equal(issue.blocking,false);assert.equal(issue.pointIndex,1);
});
