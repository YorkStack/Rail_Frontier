import {test,expect} from '@playwright/test';
import {mkdirSync} from 'node:fs';

test('local comparison keeps a fixed price baseline, identifies retained sections and focuses the reviewed area',async({page})=>{
 test.setTimeout(120000);const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.setViewportSize({width:1280,height:720});
 await page.goto('/?draw-practice=1&lesson=inlet&lang=de');await page.waitForFunction(()=>window.__railProbe?.ready);
 await page.locator('#route-ports button').first().click();await page.locator('#route-ports button').first().click();await expect(page.locator('#commit-track')).toBeEnabled({timeout:20000});
 const before=await page.evaluate(()=>window.__railProbe.snapshot()),baseline=Number(await page.locator('#quote-cost').getAttribute('data-cost'));
 await page.locator('#route-obstacles button').first().click();await expect(page.locator('#commit-track')).toBeEnabled({timeout:20000});
 await expect(page.locator('#route-comparison')).toBeVisible();await expect(page.locator('#route-comparison strong')).toContainText('vergleichen');
 await expect(page.locator('.route-choice').first()).toContainText('Aktuellen Entwurf behalten');await expect(page.locator('.route-choice').first().locator('.route-choice-price')).toBeInViewport();
 const comparison=page.locator('.route-choice').nth(1),difference=Number(await comparison.locator('.route-choice-difference').getAttribute('data-cost-difference'));
 expect(difference).not.toBe(0);await comparison.focus();await page.keyboard.press('Enter');await expect(comparison).toBeFocused();const chosen=Number(await page.locator('#quote-cost').getAttribute('data-cost'));expect(chosen-baseline).toBe(difference);
 await expect(comparison).toHaveAttribute('aria-pressed','true');await expect(page.locator('#quote-valid')).toContainText('✓ Ausgewählt · 2');
 expect(Number(await comparison.locator('.route-choice-difference').getAttribute('data-cost-difference'))).toBe(difference);
 if((await page.locator('#route-comparison small').innerText()).includes('unverändert'))expect(await page.locator('#route-draft-overlay .route-proposal [class^="retained-"]').count()).toBeGreaterThan(0);
 await page.locator('#route-comparison button').click();await expect(page.locator('#quote-cost')).toHaveAttribute('data-cost',String(chosen));
 await comparison.scrollIntoViewIfNeeded();await expect(page.locator('#toast')).not.toHaveClass(/visible/,{timeout:10000});mkdirSync('artifacts/evidence/route-comparison',{recursive:true});await page.screenshot({path:'artifacts/evidence/route-comparison/local-de.png'});
 await page.locator('#undo-waypoint').click();await expect(page.locator('#quote-cost')).toHaveAttribute('data-cost',String(baseline));await page.locator('#redo-waypoint').click();await expect(page.locator('#quote-cost')).toHaveAttribute('data-cost',String(chosen));
 expect((await page.evaluate(()=>window.__railProbe.snapshot())).company.cash).toBe(before.company.cash);expect(errors).toEqual([]);
});
