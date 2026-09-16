import {expect,test} from '@playwright/test';
import {mkdirSync,writeFileSync} from 'node:fs';

test('loads and renders the mixed Blender Norway scenery kit',async({page})=>{
  const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));page.on('console',message=>{if(message.type()==='error'||message.type()==='warning')errors.push(message.text());});
  await page.goto('/?skip-menu=1');await page.waitForFunction(()=>window.__railProbe?.ready===true);await page.evaluate(()=>window.__railProbe.setSpeed(0));
  const assets=await page.evaluate(()=>window.__railProbe.assets),names=new Set(assets.map(asset=>asset.name));
  for(const id of ['norway-spruce','norway-spruce-narrow','norway-pine','norway-birch','norway-alder','norway-boulder-a','norway-outcrop-a','norway-scree'])expect(names.has(id)).toBe(true);
  expect(assets).toHaveLength(72);expect(assets.every(asset=>asset.normalsFinite)).toBe(true);
  mkdirSync('artifacts/evidence/gfx-r04',{recursive:true});await page.evaluate(()=>window.__railProbe.cameraPreset('forest-edge'));await page.waitForTimeout(700);const nearStats=await page.evaluate(()=>window.__railProbe.stats());await page.screenshot({path:'artifacts/evidence/gfx-r04/forest-edge.png'});
  expect(nearStats.detailedTrees).toBeGreaterThan(0);expect(nearStats.detailedTrees+nearStats.simplifiedTrees).toBe(28000);
  await page.evaluate(()=>window.__railProbe.cameraPreset('regional'));await page.waitForTimeout(700);const regionalStats=await page.evaluate(()=>window.__railProbe.stats());await page.screenshot({path:'artifacts/evidence/gfx-r04/regional.png'});
  expect(regionalStats.detailedTrees+regionalStats.simplifiedTrees).toBe(28000);expect(regionalStats.simplifiedTrees).toBeGreaterThan(nearStats.simplifiedTrees);expect(regionalStats.contextLost).toBe(false);expect(errors).toEqual([]);writeFileSync('artifacts/evidence/gfx-r04/runtime.json',JSON.stringify({assets:assets.length,uniqueAssets:names.size,nearStats,regionalStats},null,2));
});
