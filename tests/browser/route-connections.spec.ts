import {test,expect} from '@playwright/test';
import {mkdirSync} from 'node:fs';

test('reopening a built alignment exposes real connections instead of its internal points',async({page})=>{
 test.setTimeout(120000);page.setDefaultTimeout(20000);const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto('/?draw-practice=1&lesson=highland&lang=de');await expect(page.locator('#planner')).toBeVisible({timeout:30000});
 await page.locator('#route-ports button').first().click();await page.locator('#route-ports button').first().click();await expect(page.locator('#commit-track')).toBeEnabled();await page.locator('#commit-track').click();
 const built=await page.evaluate(()=>window.__railProbe.snapshot());expect(built.railway.nodes.length).toBeGreaterThan(6);
 await page.locator('#plan').click();await expect(page.locator('#route-ports button')).toHaveCount(2);await expect(page.locator('.route-port')).toHaveCount(2);
 await page.locator('#regional').click();
 await expect.poll(()=>page.locator('.route-port:not([hidden])').count()).toBe(2);
 // Labels may collapse, but every real target retains a keyboard-accessible name.
 await page.locator('.route-port').last().focus();await expect(page.locator('.route-port').last()).not.toHaveClass(/label-collapsed/);
 const overlap=await page.locator('.route-port:not([hidden]):not(.label-collapsed) span').evaluateAll(elements=>{const boxes=elements.map(e=>e.getBoundingClientRect());return boxes.some((a,i)=>boxes.slice(i+1).some(b=>a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top));});expect(overlap).toBe(false);
 await page.locator('#route-ports button').first().click();await expect(page.locator('.route-port')).toHaveCount(1);await expect(page.locator('.route-port')).toHaveAttribute('aria-label',/Ziel hier/);
 await page.locator('#frame-route').click();await expect(page.locator('#practice-progress')).toBeHidden();await page.mouse.move(60,80);
 mkdirSync('artifacts/evidence/route-connections',{recursive:true});await page.screenshot({path:'artifacts/evidence/route-connections/clean-targets.png'});
 expect(await page.evaluate(()=>window.__railProbe.snapshot().company.cash)).toBe(built.company.cash);expect(errors).toEqual([]);
});
