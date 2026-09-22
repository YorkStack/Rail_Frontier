import {test,expect} from '@playwright/test';
import {mkdirSync} from 'node:fs';

test('built station track clears the grass along its platform before and after reload',async({page})=>{
 test.setTimeout(90000);const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto('/?lang=de');await page.waitForFunction(()=>window.__railProbe?.ready);
 await page.locator('#choose-new-game').click();await page.locator('#new-game').click();await expect(page.locator('#main-menu')).toBeHidden();
 await page.locator('#place-station').click();await page.locator('#station-orientation').fill('55');await page.locator('#commit-station').click();
 const built=await page.evaluate(()=>window.__railProbe.snapshot());
 for(const reload of [false,true]){
  if(reload){await page.locator('#save').click();await expect(page.locator('#toast')).toContainText('gespeichert');await page.reload();await page.waitForFunction(()=>window.__railProbe?.ready);await page.locator('#continue-game').click();await expect(page.locator('#main-menu')).toBeHidden();}
  const state=await page.evaluate(()=>window.__railProbe.snapshot());expect(state.railway).toEqual(built.railway);
  const station=state.stations[0]!;if(station.layout.kind!=='single-platform')throw new Error('Expected placed platform');
  const center=station.layout.pad.center;await page.evaluate(p=>window.__railProbe.focus(p),center);
  await page.mouse.move(730,440);await page.mouse.wheel(0,-700);await page.waitForTimeout(1000);
  // Pick the actual rendered terrain along the internal track, not only saved operation metadata.
  for(const fraction of [-.45,-.2,0,.2,.45]){
   const distance=station.layout.pad.lengthM*fraction,angle=station.layout.orientationRad;
   const point={x:center.x+Math.sin(angle)*distance,y:center.y-.55,z:center.z+Math.cos(angle)*distance};
   const sample=await page.evaluate(p=>{const screen=window.__railProbe.project(p);return {screen,hit:window.__railProbe.pick(screen.x,screen.y)};},point);
   expect(sample.screen.visible).toBe(true);expect(sample.hit).not.toBeNull();expect(sample.hit!.y).toBeCloseTo(point.y,2);
  }
  expect((await page.evaluate(()=>window.__railProbe.stats())).terrainErrorM).toBeLessThan(.001);
  if(reload){mkdirSync('artifacts/evidence',{recursive:true});await page.screenshot({path:'artifacts/evidence/station-continuous-track.png'});}
 }
 expect(errors).toEqual([]);
});
