import test from 'node:test';
import assert from 'node:assert/strict';
import {createNorwayPreviewState} from '../src/content/norway-preview.js';
import {norway} from '../src/content/norway.js';
import {norwayV3WorldGenerator} from '../src/world/norway-generators.js';
import {previewConsist} from '../src/ui/service-builder.js';

const state=()=>createNorwayPreviewState(norwayV3WorldGenerator.generate(norway.world));

test('recommended 1900 passenger consist reports real cost, capacity and platform fit',()=>{
  const game=state(),stationId=game.stations[0]!.id,preview=previewConsist(game,{stationId,locomotiveId:'nord-2-6-0',wagonId:'fjord-passenger-coach',wagonCount:2,year:1900});
  assert.equal(preview.valid,true);
  assert.equal(preview.purchaseCost,18_000_000);
  assert.ok(Math.abs(preview.lengthM-52)<1e-9);
  assert.equal(preview.passengers,96);
  assert.equal(preview.mail,48);
  assert.equal(preview.runningCostPerKm,6_600);
  assert.equal(preview.maintenancePerDay,26_000);
  assert.equal(preview.platformLengthM,90);
});

test('consist preview explains disconnected stations and platform overruns',()=>{
  const game=state(),stationId=game.stations[0]!.id;
  game.railway.edges=[];
  assert.match(previewConsist(game,{stationId,locomotiveId:'nord-2-6-0',wagonId:'fjord-passenger-coach',wagonCount:2,year:1900}).reason,/Connect this station/);
  const connected=state(),long=previewConsist(connected,{stationId:connected.stations[0]!.id,locomotiveId:'nord-2-6-0',wagonId:'fjord-passenger-coach',wagonCount:5,year:1900});
  assert.equal(long.valid,false);assert.match(long.reason,/too long/);
});

test('consist preview explains budget and electric-power requirements before purchase',()=>{
  const poor=state(),stationId=poor.stations[0]!.id;poor.company.cash=1;
  assert.match(previewConsist(poor,{stationId,locomotiveId:'nord-2-6-0',wagonId:'fjord-passenger-coach',wagonCount:1,year:1900}).reason,/cannot afford/);
  const electric=state();
  assert.match(previewConsist(electric,{stationId:electric.stations[0]!.id,locomotiveId:'nord-el-1',wagonId:'fjord-passenger-coach',wagonCount:1,year:1922}).reason,/overhead line/);
});
