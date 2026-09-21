import {test,expect} from '@playwright/test';
test('chosen railway survives tools, undo, save/reload before real construction',async({page})=>{
 test.setTimeout(120000);const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/?draw-practice=1&lesson=inlet&lang=en');await page.waitForFunction(()=>window.__railProbe?.ready);
 await page.locator('#route-ports button').first().click();await page.locator('#route-ports button').first().click();await expect(page.locator('#commit-track')).toBeEnabled();
 const first=await page.locator('#quote-cost').getAttribute('data-cost');await expect(page.locator('.route-choice').nth(1)).toBeVisible();await page.locator('.route-choice').nth(1).click();const chosen=await page.locator('#quote-cost').getAttribute('data-cost');expect(chosen).not.toBe(first);
 const before=await page.evaluate(()=>window.__railProbe.snapshot());await page.locator('#operations').click();await page.locator('#plan').click();await expect(page.locator('#quote-cost')).toHaveAttribute('data-cost',chosen!);
 await page.locator('#undo-waypoint').click();await expect(page.locator('#quote-cost')).toHaveAttribute('data-cost',first!);await page.locator('#redo-waypoint').click();await expect(page.locator('#quote-cost')).toHaveAttribute('data-cost',chosen!);
 await page.locator('#save').click();await expect(page.locator('#toast')).toContainText('saved');await page.goto('/?lang=en');await page.waitForFunction(()=>window.__railProbe?.ready);await page.locator('#continue-game').click();await page.locator('#plan').click();await expect(page.locator('#commit-track')).toBeEnabled();await expect(page.locator('#quote-cost')).toHaveAttribute('data-cost',chosen!);
 await page.locator('#undo-waypoint').click();await expect(page.locator('#quote-cost')).toHaveAttribute('data-cost',first!);await page.locator('#redo-waypoint').click();await expect(page.locator('#quote-cost')).toHaveAttribute('data-cost',chosen!);
 await page.locator('#commit-track').click();const after=await page.evaluate(()=>window.__railProbe.snapshot());expect(before.company.cash-after.company.cash).toBe(Number(chosen));await page.locator('#plan').click();await expect(page.locator('#planner')).toHaveAttribute('data-phase','start');expect(errors).toEqual([]);
});

test('local engineering comparison is reversible and cancelling a wider search preserves the chosen design',async({page})=>{
 test.setTimeout(90000);await page.goto('/?draw-practice=1&lesson=inlet&lang=en');await page.waitForFunction(()=>window.__railProbe?.ready);
 await page.locator('#route-ports button').first().click();await page.locator('#route-ports button').first().click();await expect(page.locator('#commit-track')).toBeEnabled();const baseline=await page.locator('#quote-cost').getAttribute('data-cost');
 await page.locator('#route-obstacles button').first().click();await expect(page.locator('#commit-track')).toBeEnabled();await expect(page.locator('.route-choice').nth(1)).toBeVisible();await page.locator('.route-choice').nth(1).click();const changed=await page.locator('#quote-cost').getAttribute('data-cost');expect(changed).not.toBe(baseline);
 await page.locator('#undo-waypoint').click();await expect(page.locator('#quote-cost')).toHaveAttribute('data-cost',baseline!);await page.locator('#redo-waypoint').click();await expect(page.locator('#quote-cost')).toHaveAttribute('data-cost',changed!);
 await page.locator('#retry-corridor').click();await page.locator('#undo-waypoint').click();await expect(page.locator('#quote-cost')).toHaveAttribute('data-cost',changed!);await expect(page.locator('#commit-track')).toBeEnabled();
});
