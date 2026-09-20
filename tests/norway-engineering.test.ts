import {test} from 'node:test';
import assert from 'node:assert/strict';
import {norway} from '../src/content/norway.js';
import {norwayStudyCorridors,norwayStudyCurve} from '../src/content/norway-engineering.js';
import {campaignContentRegistry} from '../src/content/registry.js';
import {compileCurve} from '../src/rail/geometry.js';
import {engineeringSpans,quoteTrack} from '../src/rail/planner.js';

const content=campaignContentRegistry.resolve({campaignId:norway.id,campaignVersion:norway.version,world:norway.world});
const terrain=content.worldGenerator.generate(norway.world),eastBankX=content.worldGenerator.landforms.waterCrossSection(3200).eastBankX;
if(eastBankX===null)throw new Error('Norway engineering fixtures require an east fjord bank');

test('default fjord crossing is an affordable bridge with buildable approaches',()=>{
  const preset=norwayStudyCorridors.bridge,curve=norwayStudyCurve('bridge',preset.defaultElevationM,eastBankX,norway.towns),quote=quoteTrack(compileCurve(curve),terrain),spans=engineeringSpans(quote),bridgeM=spans.filter(span=>span.kind==='bridge').reduce((sum,span)=>sum+span.endM-span.startM,0),groundM=spans.filter(span=>span.kind==='ground').reduce((sum,span)=>sum+span.endM-span.startM,0);
  assert.equal(quote.valid,true);assert.ok(quote.cost<norway.startingCash);assert.ok(bridgeM>300);assert.ok(groundM>300);assert.equal(spans[0]?.kind,'bridge');assert.equal(spans.at(-1)?.kind,'ground');
});

test('default mountain spur is an affordable tunnel with portals at surface transitions',()=>{
  const preset=norwayStudyCorridors.tunnel,curve=norwayStudyCurve('tunnel',preset.defaultElevationM,eastBankX,norway.towns),quote=quoteTrack(compileCurve(curve),terrain),spans=engineeringSpans(quote),tunnel=spans.find(span=>span.kind==='tunnel');
  assert.equal(quote.valid,true);assert.ok(quote.cost<norway.startingCash);assert.ok(tunnel);assert.ok(tunnel.endM-tunnel.startM>800);assert.equal(spans[0]?.kind,'ground');assert.equal(spans.at(-1)?.kind,'ground');assert.ok(tunnel.startM>5);assert.ok(tunnel.endM<compileCurve(curve).lengthM-5);
});
