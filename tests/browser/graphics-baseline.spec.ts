import {expect,test} from '@playwright/test';
import {mkdirSync,writeFileSync} from 'node:fs';
import type {NorwayCameraPresetId} from '../../src/rendering/norway-camera-presets.js';

test('captures the fixed GFX-001 V1 comparison views',async({page})=>{
  const errors:string[]=[];
  page.on('pageerror',error=>errors.push(error.message));
  page.on('console',message=>{if(message.type()==='error'||message.type()==='warning')errors.push(message.text());});
  await page.goto('/?skip-menu=1');
  await page.waitForFunction(()=>window.__railProbe?.ready===true);
  await page.evaluate(()=>window.__railProbe!.setSpeed(0));
  mkdirSync('artifacts/evidence/gfx-001',{recursive:true});
  const ids:NorwayCameraPresetId[]=['regional','shore','station','train','forest-edge','rock-face','village'];
  const captures:Record<string,unknown>={};
  for(const id of ids){
    await page.evaluate(preset=>window.__railProbe!.cameraPreset(preset),id);
    await page.waitForTimeout(250);
    captures[id]=await page.evaluate(()=>window.__railProbe!.stats());
    await page.screenshot({path:`artifacts/evidence/gfx-001/${id}.png`});
  }
  const snapshot=await page.evaluate(()=>window.__railProbe!.snapshot());
  const metrics=await page.evaluate(()=>window.__railProbe!.metrics());
  writeFileSync('artifacts/evidence/gfx-001/manifest.json',JSON.stringify({
    capturedAt:new Date().toISOString(),campaignId:snapshot.campaignId,campaignVersion:snapshot.campaignVersion,
    generatorVersion:snapshot.world.generatorVersion,world:snapshot.world,userAgent:metrics.userAgent,
    viewport:metrics.viewport,dpr:metrics.dpr,presets:ids,captures
  },null,2));
  expect(snapshot.campaignVersion).toBe(1);
  expect(snapshot.world.generatorVersion).toBe(1);
  expect(errors).toEqual([]);
});
