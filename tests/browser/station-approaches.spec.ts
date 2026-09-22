import {test,expect} from '@playwright/test';
import {mkdirSync} from 'node:fs';

for(const reverse of [false,true])test(`untouched default station orientation builds in ${reverse?'reverse':'forward'} direction`,async({page})=>{
 test.setTimeout(120000);page.setDefaultTimeout(20000);const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto('/?lang=de');await page.waitForFunction(()=>window.__railProbe?.ready);await page.locator('#choose-new-game').click();await page.locator('#new-game').click();await page.evaluate(()=>window.__railProbe.setSpeed(0));
 for(let i=0;i<2;i++){await page.locator('#place-station').click();await expect(page.locator('#station-orientation')).toHaveValue('0');await expect(page.locator('#commit-station')).toBeEnabled();await page.locator('#commit-station').click();}
 const before=await page.evaluate(()=>window.__railProbe.snapshot());await page.locator('#plan').click();await page.locator('#frame-route').click();
 await page.locator('#route-ports button').nth(reverse?1:0).click();await page.locator('#route-ports button').first().click();await expect(page.locator('#commit-track')).toBeEnabled({timeout:30000});await expect(page.locator('#planner-copy')).toContainText('Die farbige Strecke wird gebaut.');await expect(page.locator('#route-choices')).toContainText(/Bahnhofsbogen|Sanfte Kurven|Kurven glätten/);
 expect(await page.evaluate(()=>window.__railProbe.snapshot().company.cash)).toBe(before.company.cash);const cost=Number(await page.locator('#quote-cost').getAttribute('data-cost'));
 if(reverse){await page.mouse.move(50,80);mkdirSync('artifacts/evidence/station-approaches',{recursive:true});await page.screenshot({path:'artifacts/evidence/station-approaches/granli-sundvik.png'});}
 await page.locator('#commit-track').click();await expect(page.locator('#planner')).toBeHidden();const after=await page.evaluate(()=>window.__railProbe.snapshot());expect(after.railway.revision).toBe(before.railway.revision+1);expect(after.company.cash).toBe(before.company.cash-cost);expect(after.stations.map(s=>s.layout)).toEqual(before.stations.map(s=>s.layout));
 await page.evaluate(()=>window.__railProbe.save());await page.reload();await page.waitForFunction(()=>window.__railProbe?.ready);await page.locator('#continue-game').click();await expect(page.locator('#main-menu')).toBeHidden();expect((await page.evaluate(()=>window.__railProbe.snapshot())).railway).toEqual(after.railway);expect(errors).toEqual([]);
});
