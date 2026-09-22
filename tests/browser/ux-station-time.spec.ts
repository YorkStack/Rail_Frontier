import {test,expect} from '@playwright/test';
import {mkdirSync} from 'node:fs';
import {stationBearingDegrees} from '../../src/ui/station-direction.js';

for(const lang of ['de','en'])test(`station rotation is explicit, saved, and date survives open tools (${lang})`,async({page})=>{
 test.setTimeout(90000);await page.goto(`/?lang=${lang}`);await page.waitForFunction(()=>window.__railProbe?.ready);
 await page.locator('#choose-new-game').click();await page.locator('#new-game').click();await page.locator('#place-station').click();
 await expect(page.locator('#date')).toBeVisible();await expect(page.locator('#date')).toHaveText(lang==='de'?'Tag 1 · 1900':'Day 1 · 1900');
 const initial=await page.evaluate(()=>window.__railProbe.snapshot());
 await page.locator('#station-turn-left').click();await expect(page.locator('#station-orientation')).toHaveValue('345');
 await page.locator('#station-turn-right').click();await expect(page.locator('#station-orientation')).toHaveValue('0');
 await page.locator('#station-bearing-town').selectOption(initial.towns[1]!.id);await page.locator('#station-face-town').click();
 const bearing=stationBearingDegrees(initial.towns[0]!.position,initial.towns[1]!.position)!;
 await expect(page.locator('#station-orientation')).toHaveValue(String(bearing));await expect(page.locator('#commit-station')).toBeEnabled();
 expect((await page.evaluate(()=>window.__railProbe.snapshot())).company).toEqual(initial.company);
 await page.locator('#commit-station').click();const built=await page.evaluate(()=>window.__railProbe.snapshot().stations[0]!);
 expect(built.layout.kind).toBe('single-platform');if(built.layout.kind==='single-platform')expect(built.layout.orientationRad).toBeCloseTo(bearing*Math.PI/180);
 for(const tool of ['#plan','#operations','#overlays']){await page.locator(tool).click();await expect(page.locator('#date')).toBeVisible();await expect(page.locator('#date')).toBeInViewport();}
 await page.locator('#save').click();await expect(page.locator('#toast')).toContainText(lang==='de'?'gespeichert':'saved');
 await page.reload();await page.waitForFunction(()=>window.__railProbe?.ready);await page.locator('#continue-game').click();await expect(page.locator('#main-menu')).toBeHidden();
 expect((await page.evaluate(()=>window.__railProbe.snapshot())).stations[0]).toEqual(built);await expect(page.locator('#date')).toBeVisible();
 await page.locator('#place-station').click();await page.locator('#station-turn-right').click();
 expect((await page.evaluate(()=>window.__railProbe.snapshot())).stations[0]).toEqual(built);
 if(lang==='de'){await page.locator('#station-face-town').scrollIntoViewIfNeeded();mkdirSync('artifacts/evidence',{recursive:true});await page.screenshot({path:'artifacts/evidence/station-direction-time.png'});}
});
