import {expect,test} from '@playwright/test';
import {mkdirSync,writeFileSync} from 'node:fs';

test('loads and renders the mixed Blender Norway scenery kit',async({page})=>{
  const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));page.on('console',message=>{if(message.type()==='error'||message.type()==='warning')errors.push(message.text());});
  await page.goto('/?skip-menu=1');await page.waitForFunction(()=>window.__railProbe?.ready===true);await page.evaluate(()=>window.__railProbe.setSpeed(0));
  const assets=await page.evaluate(()=>window.__railProbe.assets),names=new Set(assets.map(asset=>asset.name));
  for(const id of ['norway-spruce','norway-spruce-narrow','norway-pine','norway-birch','norway-alder','norway-boulder-a','norway-outcrop-a','norway-scree'])expect(names.has(id)).toBe(true);
  expect(assets).toHaveLength(72);expect(assets.every(asset=>asset.normalsFinite)).toBe(true);
  mkdirSync('artifacts/evidence/gfx-005',{recursive:true});for(const preset of ['forest-edge','rock-face'] as const){await page.evaluate(id=>window.__railProbe.cameraPreset(id),preset);await page.waitForTimeout(350);await page.screenshot({path:`artifacts/evidence/gfx-005/${preset}.png`});}
  const stats=await page.evaluate(()=>window.__railProbe.stats());expect(stats.trees).toBe(28000);expect(stats.contextLost).toBe(false);expect(errors).toEqual([]);writeFileSync('artifacts/evidence/gfx-005/runtime.json',JSON.stringify({assets:assets.length,uniqueAssets:names.size,stats},null,2));
});
