import {expect,test} from '@playwright/test';
import {mkdirSync,writeFileSync} from 'node:fs';

test('captures the registered Norway V2 landform blockout',async({page})=>{
  const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));page.on('console',message=>{if(message.type()==='error'||message.type()==='warning')errors.push(message.text());});
  await page.goto('/?skip-menu=1');await page.waitForFunction(()=>window.__railProbe?.ready===true);await page.evaluate(()=>{window.__railProbe.setSpeed(0);window.__railProbe.setTerrainBlockout(true);window.__railProbe.cameraPreset('regional');});await page.waitForTimeout(300);
  const state=await page.evaluate(()=>window.__railProbe.snapshot()),stats=await page.evaluate(()=>window.__railProbe.stats());expect(state.campaignVersion).toBe(2);expect(state.world.generatorVersion).toBe(2);expect(stats.terrainErrorM).toBeLessThan(.001);
  mkdirSync('artifacts/evidence/gfx-003',{recursive:true});await page.screenshot({path:'artifacts/evidence/gfx-003/v2-regional-blockout.png'});writeFileSync('artifacts/evidence/gfx-003/manifest.json',JSON.stringify({campaignVersion:state.campaignVersion,world:state.world,stats},null,2));expect(errors).toEqual([]);
});
