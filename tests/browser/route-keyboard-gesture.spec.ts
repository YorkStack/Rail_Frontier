import {test,expect} from '@playwright/test';

const path='#route-draft-overlay svg > path';
async function setup(page:import('@playwright/test').Page){await page.goto('/?draw-practice=1&lang=en');await expect(page.locator('#planner')).toBeVisible();await page.locator('#route-ports button').first().click();await page.locator('#route-ports button').first().click();await expect(page.locator('#commit-track')).toBeEnabled();}

test('held arrows edit immediately but calculate and enter history only once',async({page})=>{
  await setup(page);const original=await page.locator(path).getAttribute('d'),before=await page.evaluate(()=>window.__railProbe.planning()),cash=await page.evaluate(()=>window.__railProbe.snapshot().company.cash);
  await page.locator('.route-handle').first().focus();for(let i=0;i<20;i++)await page.keyboard.down('ArrowRight');
  await expect(page.locator(path)).not.toHaveAttribute('d',original!);await expect(page.locator('#commit-track')).toBeDisabled();await expect(page.locator('.route-choice')).toHaveCount(0);
  expect((await page.evaluate(()=>window.__railProbe.planning())).requests).toBe(before.requests);
  await page.keyboard.up('ArrowRight');await expect(page.locator('#commit-track')).toBeEnabled();expect((await page.evaluate(()=>window.__railProbe.planning())).requests).toBe(before.requests+1);
  const changed=await page.locator(path).getAttribute('d');await page.locator('#undo-waypoint').click();await expect(page.locator(path)).toHaveAttribute('d',original!);await page.locator('#redo-waypoint').click();await expect(page.locator(path)).toHaveAttribute('d',changed!);
  expect(await page.evaluate(()=>window.__railProbe.snapshot().company.cash)).toBe(cash);
});

test('Escape cancels a held edit without consuming the previous undo step',async({page})=>{
  await setup(page);const original=await page.locator(path).getAttribute('d'),before=await page.evaluate(()=>window.__railProbe.planning());
  await page.locator('.route-handle').first().focus();await page.keyboard.down('ArrowUp');await page.keyboard.down('ArrowRight');await page.keyboard.up('ArrowUp');
  expect((await page.evaluate(()=>window.__railProbe.planning())).requests).toBe(before.requests);
  await page.keyboard.press('Escape');await page.keyboard.up('ArrowRight');await expect(page.locator(path)).toHaveAttribute('d',original!);await expect(page.locator('#planner')).toBeVisible();await expect(page.locator('#commit-track')).toBeEnabled();
  expect((await page.evaluate(()=>window.__railProbe.planning())).requests).toBe(before.requests);
  await page.locator('#undo-waypoint').click();await expect(page.locator('#commit-track')).toBeDisabled();await page.locator('#redo-waypoint').click();await expect(page.locator(path)).toHaveAttribute('d',original!);
});

test('moving focus completes a keyboard edit and later keyup does not duplicate it',async({page})=>{
  await setup(page);const before=await page.evaluate(()=>window.__railProbe.planning());await page.locator('.route-handle').first().focus();await page.keyboard.down('ArrowLeft');await page.keyboard.press('Tab');await page.keyboard.up('ArrowLeft');
  await expect(page.locator('#commit-track')).toBeEnabled();expect((await page.evaluate(()=>window.__railProbe.planning())).requests).toBe(before.requests+1);
});

test('a held edit past the map edge is cancellable without a terrain exception',async({page})=>{
 const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));await setup(page);const original=await page.locator(path).getAttribute('d');await page.locator('.route-handle').first().focus();await page.keyboard.down('Shift');for(let i=0;i<200;i++)await page.keyboard.down('ArrowLeft');await page.keyboard.press('Escape');await page.keyboard.up('ArrowLeft');await page.keyboard.up('Shift');await expect(page.locator(path)).toHaveAttribute('d',original!);await expect(page.locator('#commit-track')).toBeEnabled();expect(errors).toEqual([]);
});
