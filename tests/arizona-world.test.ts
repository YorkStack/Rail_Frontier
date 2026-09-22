import {createHash} from 'node:crypto';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {arizonaTerrainStudy,arizonaV2} from '../src/content/arizona.js';
import {campaignContentRegistry} from '../src/content/registry.js';
import {straightCurve} from '../src/content/norway-preview.js';
import {compileCurve} from '../src/rail/geometry.js';
import {engineeringSpans,quoteTrack} from '../src/rail/planner.js';
import {arizonaV2MainDrainage,arizonaV2WorldGenerator} from '../src/world/arizona-v2.js';
import type {CampaignDefinition} from '../src/domain/model.js';
import type {WorldGenerator} from '../src/world/generator.js';
import {arizonaBuildingAssets,generateArizonaSettlements} from '../src/rendering/arizona-settlement-placement.js';

const fingerprint=(campaign:CampaignDefinition,generator:WorldGenerator,seed=campaign.world.seed)=>{const definition={...campaign.world,seed},terrain=generator.generate(definition),values:string[]=[];for(let z=0;z<=definition.depthM;z+=800)for(let x=0;x<=definition.widthM;x+=800){const sample=terrain.sample(x,z);values.push(sample.elevationM.toFixed(6),sample.forest.toFixed(6),sample.rock.toFixed(6),sample.urban.toFixed(6));}return createHash('sha256').update(values.join('|')).digest('hex');};

test('production Arizona terrain has a stable fingerprint',()=>{
  assert.equal(fingerprint(arizonaV2,arizonaV2WorldGenerator),'369ae3086e050523b1ee522e2bcd7ceba5ebf3d4e2a045d40320dd5a67d6a7fd');
  assert.notEqual(fingerprint(arizonaV2,arizonaV2WorldGenerator,arizonaV2.world.seed+1),fingerprint(arizonaV2,arizonaV2WorldGenerator));
});

test('Arizona V2 cross-sections express basin, stepped mesas, incised drainage and plateau rim',()=>{
  const terrain=arizonaV2WorldGenerator.generate(arizonaV2.world);
  assert.ok(terrain.sample(2000,12000).elevationM>terrain.sample(12000,12000).elevationM+400);
  assert.ok(terrain.sample(22000,12000).elevationM>terrain.sample(12000,12000).elevationM+400);
  assert.ok(terrain.sample(6900,6750).elevationM>terrain.sample(9300,6750).elevationM+400);
  assert.ok(terrain.sample(15400,17700).elevationM>terrain.sample(12600,17700).elevationM+300);
  assert.ok(terrain.sample(11900,14050).elevationM<terrain.sample(11900,13200).elevationM-180);
  assert.ok(terrain.sample(17900,9600).elevationM>terrain.sample(16800,9600).elevationM+90);
  assert.ok(arizonaV2MainDrainage.length>=7);
});

test('all Arizona settlements occupy flat buildable terrain',()=>{
  const terrain=arizonaV2WorldGenerator.generate(arizonaV2.world);
  for(const town of arizonaV2.towns){const sample=terrain.sample(town.position.x,town.position.z),east=terrain.sample(town.position.x+40,town.position.z).elevationM,south=terrain.sample(town.position.x,town.position.z+40).elevationM;assert.ok(Math.abs(sample.elevationM-town.position.y)<1e-9);assert.ok(sample.urban>.9);assert.ok(Math.hypot(east-sample.elevationM,south-sample.elevationM)/40<.01);}
});

test('two long Arizona V2 corridors remain feasible and the northern one crosses an 809 m bridge',()=>{
  const terrain=arizonaV2WorldGenerator.generate(arizonaV2.world),quotes=[1,2].map(index=>quoteTrack(compileCurve(straightCurve(arizonaV2.towns[index-1]!.position,arizonaV2.towns[index]!.position)),terrain));
  for(const quote of quotes){assert.equal(quote.valid,true,quote.reasons.join(' · '));assert.ok(quote.intervals.length>100);assert.ok(quote.maxGrade<.01);}
  const bridge=engineeringSpans(quotes[1]!).find(span=>span.kind==='bridge');assert.ok(bridge);assert.ok(bridge.endM-bridge.startM>800&&bridge.endM-bridge.startM<820);assert.equal(quotes[1]!.cost,413_434_970);
});

test('Arizona exposes only the current study and rejects removed V1 content',()=>{
  const resolved=campaignContentRegistry.resolve({campaignId:arizonaTerrainStudy.id,campaignVersion:arizonaTerrainStudy.version,world:arizonaTerrainStudy.world});
  assert.throws(()=>campaignContentRegistry.resolve({campaignId:'arizona-terrain-study',campaignVersion:1,world:{...arizonaV2.world,generatorVersion:1}}),/Unsupported campaign content/);
  assert.equal(resolved.worldGenerator.id,'arizona-basin-v2');assert.equal(resolved.presentation.rendererId,'terrain-study');assert.equal(resolved.presentation.assetManifestUrl,'/packs/arizona.json');assert.equal(resolved.presentation.entryCameraId,'entry');assert.deepEqual(Object.keys(resolved.presentation.cameraPresets),['ranch','entry','regional','canyon','escarpment','wash','settlement','street','house-close','vegetation','industry','train']);
});

test('Arizona architecture occupies deterministic street plots with the complete building kit',()=>{
  const terrain=arizonaV2WorldGenerator.generate(arizonaV2.world),placements=generateArizonaSettlements(terrain,{world:arizonaV2.world,towns:arizonaV2.towns});
  assert.equal(placements.length,180);assert.equal(new Set(placements.map(item=>item.id)).size,180);assert.deepEqual([...new Set(placements.map(item=>item.assetId))].sort(),[...arizonaBuildingAssets].sort());
  for(const item of placements)assert.ok(Math.abs(item.y-terrain.sample(item.x,item.z).elevationM)<1e-9);
  for(const town of arizonaV2.towns)assert.equal(placements.filter(item=>item.townId===town.id).length,60);
});
