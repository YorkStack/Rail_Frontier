import {test,expect} from '@playwright/test';
import {mkdirSync} from 'node:fs';

test('Arizona terrain study stays inside the landscape composition budget',async({page})=>{
  const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));page.on('console',event=>{if(event.type()==='error'||event.type()==='warning')errors.push(event.text());});
  await page.goto('/?skip-menu=1&world=arizona');await page.waitForFunction(()=>window.__railProbe?.ready);await page.evaluate(()=>window.__railProbe.setSpeed(0));
  await expect(page.getByRole('complementary',{name:'Arizona terrain study controls'})).toBeVisible();await expect(page.getByText('This is a scenery preview.')).toBeVisible();
  const study=await page.evaluate(()=>({state:window.__railProbe.snapshot(),assets:window.__railProbe.assets,stats:window.__railProbe.stats()}));
  expect(study.state.campaignId).toBe('arizona-terrain-study');expect(study.state.world.widthM).toBe(24000);expect(study.state.world.depthM).toBe(24000);expect(study.assets).toEqual([]);expect(study.stats.trees).toBe(10500);expect(study.stats.detailedTrees+study.stats.simplifiedTrees).toBe(10500);expect(study.stats.buildings).toBe(180);expect(study.stats.triangles).toBeLessThan(2_000_000);expect(study.stats.calls).toBeLessThan(50);expect(study.stats.terrainErrorM).toBeLessThan(.001);
  mkdirSync('artifacts/evidence/exp-003',{recursive:true});
  await page.screenshot({path:'artifacts/evidence/exp-003/arizona-entry.png'});
  for(const preset of ['regional','canyon','settlement','vegetation','industry','train']){await page.evaluate(id=>window.__railProbe.cameraPreset(id),preset);await page.waitForTimeout(220);await page.locator('#world').screenshot({path:`artifacts/evidence/exp-003/arizona-${preset}.png`});}await page.evaluate(()=>window.__railProbe.cameraPreset('vegetation'));await page.waitForTimeout(220);const close=await page.evaluate(()=>window.__railProbe.stats());expect(close.detailedTrees).toBeGreaterThan(0);expect(close.detailedTrees+close.simplifiedTrees).toBe(10500);
  expect(errors).toEqual([]);
});
