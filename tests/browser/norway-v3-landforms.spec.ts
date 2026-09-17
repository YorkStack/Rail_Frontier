import {expect,test} from '@playwright/test';
import {mkdirSync,writeFileSync} from 'node:fs';

test('Norway V3 renders authored cliffs and its connected waterfall',async({page})=>{
  const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));page.on('console',message=>{if(message.type()==='error'||message.type()==='warning')errors.push(message.text());});
  await page.goto('/?skip-menu=1');await page.waitForFunction(()=>window.__railProbe?.ready===true);await page.evaluate(()=>window.__railProbe.setSpeed(0));mkdirSync('artifacts/evidence/gfx-r05',{recursive:true});
  const captures:Record<string,unknown>={};for(const preset of ['waterfall','rock-face','regional'] as const){await page.evaluate(id=>window.__railProbe.cameraPreset(id),preset);await page.waitForTimeout(500);captures[preset]=await page.evaluate(()=>window.__railProbe.stats());await page.screenshot({path:`artifacts/evidence/gfx-r05/${preset}.png`});}
  const state=await page.evaluate(()=>window.__railProbe.snapshot());expect(state.world.generatorVersion).toBe(3);expect(state.campaignVersion).toBe(3);expect(errors).toEqual([]);expect(Object.values(captures).every(value=>(value as {terrainErrorM:number}).terrainErrorM<.001)).toBe(true);writeFileSync('artifacts/evidence/gfx-r05/runtime.json',JSON.stringify(captures,null,2));
});
