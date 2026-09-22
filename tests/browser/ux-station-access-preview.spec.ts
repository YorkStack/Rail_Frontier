import {test,expect} from '@playwright/test';
import {mkdirSync} from 'node:fs';

for(const lang of ['de','en'])test(`access preview follows the final rotation, matches construction and survives reload (${lang})`,async({page})=>{
 test.setTimeout(120000);const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`/?lang=${lang}`);await page.waitForFunction(()=>window.__railProbe?.ready);await page.locator('#choose-new-game').click();await page.locator('#new-game').click();await expect(page.locator('#main-menu')).toBeHidden();
 const before=await page.evaluate(()=>window.__railProbe.snapshot());await page.locator('#place-station').click();
 for(const angle of [0,55,180,55])await page.locator('#station-orientation').fill(String(angle));
 await expect(page.locator('#commit-station')).toBeEnabled();await expect(page.locator('#station-access-review')).toHaveAttribute('aria-busy','false');
 await expect(page.locator('#station-access-summary')).toBeInViewport();
 const preview=await page.evaluate(()=>window.__railProbe.stationAccessPreview());expect(preview).not.toBeNull();expect(preview!.status).toBe('connected');expect(preview!.court.valid).toBe(true);
 const direction={x:preview!.court.exit.x-preview!.court.entrance.x,z:preview!.court.exit.z-preview!.court.entrance.z};expect(Math.atan2(-direction.z,direction.x)).toBeCloseTo(55*Math.PI/180);
 const afterPreview=await page.evaluate(()=>window.__railProbe.snapshot());expect(afterPreview.company).toEqual(before.company);expect(afterPreview.railway).toEqual(before.railway);expect(afterPreview.operations.terrain).toEqual(before.operations.terrain);
 await expect(page.locator('#station-access-copy')).toContainText(lang==='de'?'Ortsanschluss möglich':'town connection are possible');
 if(lang==='de'){mkdirSync('artifacts/evidence',{recursive:true});await page.locator('#station-access-review').scrollIntoViewIfNeeded();await expect(page.locator('#toast')).not.toHaveClass(/visible/);await page.screenshot({path:'artifacts/evidence/station-access-preview.png'});}
 await page.locator('#commit-station').click();await expect.poll(()=>page.evaluate(()=>window.__railProbe.snapshot().stations.length)).toBe(1);
 await expect.poll(()=>page.evaluate(()=>window.__railProbe.settlementAccess())).toEqual(preview!.network);
 await page.locator('#save').click();await expect(page.locator('#toast')).toContainText(lang==='de'?'gespeichert':'saved');await page.reload();await page.waitForFunction(()=>window.__railProbe?.ready);await page.locator('#continue-game').click();await expect(page.locator('#main-menu')).toBeHidden();
 expect(await page.evaluate(()=>window.__railProbe.settlementAccess())).toEqual(preview!.network);
 if(lang==='de'){await page.evaluate(p=>window.__railProbe.focus(p),{x:preview!.court.exit.x+20,y:preview!.court.exit.y,z:preview!.court.exit.z+70});await expect(page.locator('#toast')).not.toHaveClass(/visible/);await page.waitForTimeout(700);await page.screenshot({path:'artifacts/evidence/station-forecourt.png'});await page.evaluate(p=>window.__railProbe.focus(p),preview!.court.entrance);await page.mouse.move(810,360);await page.mouse.down();await page.mouse.move(590,360,{steps:20});await page.mouse.up();await page.mouse.wheel(0,-2400);await page.waitForTimeout(1200);await page.screenshot({path:'artifacts/evidence/station-forecourt-close.png'});}
 expect(errors).toEqual([]);
});

test('cancel, switch tool, failed worker and retry never accept a stale station preview',async({page})=>{
 test.setTimeout(120000);await page.goto('/?lang=de');await page.waitForFunction(()=>window.__railProbe?.ready);await page.locator('#choose-new-game').click();await page.locator('#new-game').click();await expect(page.locator('#main-menu')).toBeHidden();
 const before=await page.evaluate(()=>window.__railProbe.snapshot());
 await page.route('**/station-access.worker-*.js',route=>route.abort());
 await page.locator('#place-station').click();await expect(page.locator('#retry-station-access')).toBeVisible();await expect(page.locator('#commit-station')).toBeDisabled();expect(await page.evaluate(()=>window.__railProbe.stationAccessPreview())).toBeNull();
 await page.unroute('**/station-access.worker-*.js');await page.locator('#retry-station-access').click();await expect(page.locator('#commit-station')).toBeEnabled();
 // A changed orientation invalidates the old ready result immediately; closing stops the replacement worker.
 await page.locator('#station-orientation').fill('90');await page.locator('#close-station').click();await expect(page.locator('#station-planner')).toBeHidden();await page.waitForTimeout(600);expect(await page.evaluate(()=>window.__railProbe.stationAccessPreview())).toBeNull();await expect(page.locator('#commit-station')).toBeDisabled();
 await page.locator('#place-station').click();await page.locator('#operations').click();await expect(page.locator('#station-planner')).toBeHidden();await page.waitForTimeout(600);expect(await page.evaluate(()=>window.__railProbe.stationAccessPreview())).toBeNull();
 await page.locator('#place-station').click();await expect(page.locator('#commit-station')).toBeEnabled();await page.locator('#station-turn-right').focus();await page.keyboard.press('Escape');await expect(page.locator('#station-planner')).toBeHidden();expect(await page.evaluate(()=>window.__railProbe.stationAccessPreview())).toBeNull();
 const after=await page.evaluate(()=>window.__railProbe.snapshot());expect(after.stations).toEqual(before.stations);expect(after.company.cash).toBe(before.company.cash);expect(after.railway).toEqual(before.railway);
});
