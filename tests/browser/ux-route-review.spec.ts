import {test,expect} from '@playwright/test';

test('closing and reopening planning preserves certified comparisons and the selected price',async({page})=>{
 test.setTimeout(90000);await page.goto('/?draw-practice=1&lesson=inlet&lang=de');await expect(page.locator('#planner')).toBeVisible({timeout:30000});
 await page.locator('#route-ports button').first().click();await page.locator('#route-ports button').first().click();await expect(page.locator('#commit-track')).toBeEnabled();
 const choices=page.locator('.route-choice');expect(await choices.count()).toBeGreaterThan(1);await choices.nth(1).click();
 const names=await choices.locator('strong').allTextContents(),price=await page.locator('#quote-cost').textContent(),selected=await page.locator('#route-alternative').inputValue(),before=await page.evaluate(()=>({state:window.__railProbe.snapshot(),requests:window.__railProbe.planning().requests}));
 await page.keyboard.press('Escape');await expect(page.locator('#planner')).toBeHidden();await page.locator('#plan').click();await expect(choices.locator('strong')).toHaveText(names);await expect(page.locator('#quote-cost')).toHaveText(price!);await expect(page.locator('#route-alternative')).toHaveValue(selected);
 // Switching tools also keeps the same quote, without rebuilding or spending.
 await page.locator('#operations').click();await page.locator('#plan').click();await expect(choices.locator('strong')).toHaveText(names);await expect(page.locator('#route-alternative')).toHaveValue(selected);
 const after=await page.evaluate(()=>({state:window.__railProbe.snapshot(),requests:window.__railProbe.planning().requests}));expect(after.state.company).toEqual(before.state.company);expect(after.state.railway).toEqual(before.state.railway);expect(after.requests).toBe(before.requests);
 // Editing remains the boundary: a new draft must trigger fresh certification.
 await page.locator('.route-handle').first().focus();await page.keyboard.press('ArrowRight');await expect.poll(()=>page.evaluate(()=>window.__railProbe.planning().requests)).toBeGreaterThan(before.requests);await expect(page.locator('#commit-track')).toBeEnabled();
});
