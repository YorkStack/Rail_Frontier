import {expect,test,type Page} from '@playwright/test';
import {mkdirSync,writeFileSync} from 'node:fs';

async function waitForStableScene(page:Page):Promise<void>{
  for(let attempt=0;attempt<4;attempt++){
    await page.waitForFunction(()=>window.__railProbe?.ready===true);
    await page.waitForTimeout(650);
    if(await page.evaluate(()=>window.__railProbe?.ready===true))return;
  }
  throw new Error('Scene did not remain initialized');
}

async function capturePreset(page:Page,preset:string,path:string):Promise<unknown>{
  for(let attempt=0;attempt<4;attempt++){
    await waitForStableScene(page);
    try{
      await page.evaluate(id=>{window.__railProbe.setSpeed(0);window.__railProbe.cameraPreset(id);},preset);
      await page.waitForTimeout(120);
      const stats=await page.evaluate(()=>window.__railProbe.stats());
      await page.locator('#world').screenshot({path});
      return stats;
    }catch(error){if(attempt===3)throw error;}
  }
  throw new Error('Scene capture failed');
}

test('natural terrain material renders Norway and Arizona without shader errors',async({page})=>{
  test.setTimeout(90_000);
  const errors:string[]=[];
  page.on('pageerror',error=>errors.push(error.message));
  page.on('console',message=>{if(message.type()==='error'||message.type()==='warning')errors.push(message.text());});
  mkdirSync('artifacts/evidence/gfx-r03',{recursive:true});

  const captures:Record<string,unknown>={};
  await page.goto('/?skip-menu=1');
  for(const preset of ['regional','shore','rock-face'] as const){
    captures[`norway-${preset}`]=await capturePreset(page,preset,`artifacts/evidence/gfx-r03/norway-${preset}.png`);
  }

  await page.goto('/?skip-menu=1&world=arizona');
  for(const preset of ['regional','canyon','settlement'] as const){
    captures[`arizona-${preset}`]=await capturePreset(page,preset,`artifacts/evidence/gfx-r03/arizona-${preset}.png`);
  }

  await waitForStableScene(page);
  const stats=await page.evaluate(()=>window.__railProbe.stats());
  expect(stats.textures).toBeGreaterThanOrEqual(3);
  expect(stats.triangles).toBeLessThan(2_000_000);
  expect(stats.terrainErrorM).toBeLessThan(.001);
  expect(errors).toEqual([]);
  writeFileSync('artifacts/evidence/gfx-r03/manifest.json',JSON.stringify({capturedAt:new Date().toISOString(),captures,errors},null,2));
});
