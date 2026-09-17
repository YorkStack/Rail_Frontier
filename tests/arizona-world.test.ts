import {createHash} from 'node:crypto';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {arizonaTerrainStudy} from '../src/content/arizona.js';
import {campaignContentRegistry} from '../src/content/registry.js';
import {straightCurve} from '../src/content/norway-preview.js';
import {compileCurve} from '../src/rail/geometry.js';
import {engineeringSpans,quoteTrack} from '../src/rail/planner.js';
import {arizonaV1WorldGenerator} from '../src/world/arizona-v1.js';

const fingerprint=(seed:number)=>{const definition={...arizonaTerrainStudy.world,seed},terrain=arizonaV1WorldGenerator.generate(definition),values:string[]=[];for(let z=0;z<=definition.depthM;z+=800)for(let x=0;x<=definition.widthM;x+=800){const sample=terrain.sample(x,z);values.push(sample.elevationM.toFixed(6),sample.forest.toFixed(6),sample.rock.toFixed(6),sample.urban.toFixed(6));}return createHash('sha256').update(values.join('|')).digest('hex');};

test('Arizona terrain study has a stable versioned fingerprint',()=>{
  assert.equal(fingerprint(arizonaTerrainStudy.world.seed),'e6c668d8fc0545e0bb29cdc6f881275d0b213dc3c66f7a73d49f19786bff30a5');
  assert.notEqual(fingerprint(arizonaTerrainStudy.world.seed+1),fingerprint(arizonaTerrainStudy.world.seed));
});

test('Arizona landform cross-sections express basin, mesas, canyon and plateau rim',()=>{
  const terrain=arizonaV1WorldGenerator.generate(arizonaTerrainStudy.world);
  assert.ok(terrain.sample(2000,12000).elevationM>terrain.sample(12000,12000).elevationM+400);
  assert.ok(terrain.sample(22000,12000).elevationM>terrain.sample(12000,12000).elevationM+400);
  assert.ok(terrain.sample(7000,6700).elevationM>terrain.sample(9300,6700).elevationM+300);
  assert.ok(terrain.sample(15400,17700).elevationM>terrain.sample(12600,17700).elevationM+300);
  assert.ok(terrain.sample(12000,13900).elevationM<terrain.sample(12000,12800).elevationM-100);
});

test('all Arizona settlements occupy flat buildable terrain',()=>{
  const terrain=arizonaV1WorldGenerator.generate(arizonaTerrainStudy.world);
  for(const town of arizonaTerrainStudy.towns){const sample=terrain.sample(town.position.x,town.position.z),east=terrain.sample(town.position.x+40,town.position.z).elevationM,south=terrain.sample(town.position.x,town.position.z+40).elevationM;assert.ok(Math.abs(sample.elevationM-town.position.y)<1e-9);assert.ok(sample.urban>.9);assert.ok(Math.hypot(east-sample.elevationM,south-sample.elevationM)/40<.01);}
});

test('two long Arizona corridors are feasible and the northern one bridges the tributary canyon',()=>{
  const terrain=arizonaV1WorldGenerator.generate(arizonaTerrainStudy.world),quotes=[1,2].map(index=>quoteTrack(compileCurve(straightCurve(arizonaTerrainStudy.towns[index-1]!.position,arizonaTerrainStudy.towns[index]!.position)),terrain));
  for(const quote of quotes){assert.equal(quote.valid,true,quote.reasons.join(' · '));assert.ok(quote.intervals.length>100);assert.ok(quote.maxGrade<.01);}
  const spans=engineeringSpans(quotes[1]!);assert.ok(spans.some(span=>span.kind==='bridge'&&span.endM-span.startM>900));
});

test('Arizona study resolves as independent content with fixed review cameras',()=>{
  const resolved=campaignContentRegistry.resolve({campaignId:arizonaTerrainStudy.id,campaignVersion:arizonaTerrainStudy.version,world:arizonaTerrainStudy.world});
  assert.equal(resolved.worldGenerator.id,'arizona-basin-v1');assert.equal(resolved.presentation.rendererId,'terrain-study');assert.equal(resolved.presentation.assetManifestUrl,null);assert.equal(resolved.presentation.entryCameraId,'entry');assert.deepEqual(Object.keys(resolved.presentation.cameraPresets),['entry','regional','canyon','settlement','vegetation','industry','train']);
});
