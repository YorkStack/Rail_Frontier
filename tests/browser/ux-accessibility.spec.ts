import {test,expect} from '@playwright/test';
import {mkdirSync} from 'node:fs';

test('Space activates focused controls while the canvas shortcut still pauses time',async({page})=>{
 await page.goto('/?draw-practice=1&lang=de');await expect(page.locator('#planner')).toBeVisible({timeout:30000});
 await page.keyboard.press('Escape');await page.locator('#game-menu-button').focus();await page.keyboard.press('Space');
 await expect(page.locator('#game-dialog')).toBeVisible();await expect(page.locator('#run-state')).toHaveText('PAUSIERT');
 await page.keyboard.press('Escape');await expect(page.locator('#game-dialog')).toBeHidden();
 await page.locator('#overlays').focus();await page.keyboard.press('Space');await expect(page.locator('#overlay-panel')).toBeVisible();
 await expect(page.locator('#run-state')).toHaveText('PAUSIERT');await page.keyboard.press('Escape');
 await page.locator('#world').focus();await page.keyboard.press('Space');await expect(page.locator('#run-state')).toHaveText('LÄUFT');
 await page.keyboard.press('Space');await expect(page.locator('#run-state')).toHaveText('PAUSIERT');
});

for(const lang of ['en','de'])for(const scale of ['1','1.25','1.5'])test(`compact controls keep names and separate hit areas (${lang}, ${scale})`,async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.goto(`/?lang=${lang}`);await page.waitForFunction(()=>window.__railProbe?.ready);
 await page.locator('[data-menu-view=settings]').click();await page.locator('#ui-scale-setting').selectOption(scale);
 await page.locator('[data-menu-view=campaign]').click();await page.locator('#choose-new-game').click();await page.locator('#new-game').click();
 await expect(page.locator('#regional')).toHaveAccessibleName(lang==='de'?'Übersicht':'Overview');
 await expect(page.locator('#overlays')).toHaveAccessibleName(lang==='de'?'Kartenebenen':'Overlays');
 for(const selector of ['#regional','#overlays','#place-station','#plan','#operations','#company-office','[data-speed="1"]']){
  const control=page.locator(selector);await expect(control).toBeInViewport();
  expect(await control.evaluate(el=>{const r=el.getBoundingClientRect();return el.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));}),selector).toBe(true);
 }
 const rects=await page.evaluate(()=>['.control-deck','.view-controls','.clock-deck'].map(s=>{const r=document.querySelector(s)!.getBoundingClientRect();return{top:r.top,bottom:r.bottom};}));
 expect(rects[0]!.top).toBeGreaterThanOrEqual(Math.max(rects[1]!.bottom,rects[2]!.bottom)+8);
 await page.locator('#place-station').click();await expect(page.locator('#commit-station')).toBeInViewport();
 const panel=await page.locator('#station-planner').boundingBox();expect(panel!.y+panel!.height).toBeLessThan(rects[1]!.top);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 mkdirSync('artifacts/evidence',{recursive:true});await page.screenshot({path:`artifacts/evidence/ux-compact-${scale}-${lang}.png`});
});
