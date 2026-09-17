import {expect,test} from '@playwright/test';
import {mkdirSync,writeFileSync} from 'node:fs';

test('renders the Norway V3 surface maps under production daylight',async({page})=>{
  const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));page.on('console',message=>{if(message.type()==='error'||message.type()==='warning')errors.push(message.text());});
  await page.goto('/?skip-menu=1');await page.waitForFunction(()=>window.__railProbe?.ready===true);await page.evaluate(()=>window.__railProbe.setSpeed(0));
  mkdirSync('artifacts/evidence/gfx-004',{recursive:true});
  for(const preset of ['regional','rock-face'] as const){await page.evaluate(value=>window.__railProbe.cameraPreset(value),preset);await page.waitForTimeout(350);await page.screenshot({path:`artifacts/evidence/gfx-004/${preset}.png`});}
  const stats=await page.evaluate(()=>window.__railProbe.stats()),state=await page.evaluate(()=>window.__railProbe.snapshot());
  expect(state.world.generatorVersion).toBe(3);expect(stats.textures).toBeGreaterThanOrEqual(3);expect(stats.terrainErrorM).toBeLessThan(.001);expect(errors).toEqual([]);
  writeFileSync('artifacts/evidence/gfx-004/manifest.json',JSON.stringify({world:state.world,stats},null,2));
});
