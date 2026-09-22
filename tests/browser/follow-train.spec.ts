import {motionPosition} from '../../src/simulation/motion.js';
import {compileGraph} from '../../src/rail/graph.js';
import {test,expect} from '@playwright/test';

test('track without a train never offers follow or moves the camera on F',async({page})=>{
 const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));await page.goto('/?draw-practice=1&lesson=highland&lang=de');await expect(page.locator('#planner')).toBeVisible({timeout:20000});
 await page.locator('#route-ports button').first().click();await page.locator('#route-ports button').first().click();await expect(page.locator('#commit-track')).toBeEnabled();await page.locator('#commit-track').click();await expect(page.locator('#planner')).toBeHidden();
 expect(await page.evaluate(()=>window.__railProbe.snapshot().trains.length)).toBe(0);await expect(page.locator('#follow')).toBeHidden();
 await page.evaluate(()=>window.__railProbe.setSpeed(0));await page.waitForTimeout(500);
 const before=await page.evaluate(()=>window.__railProbe.snapshot().towns.map(town=>window.__railProbe.project(town.position)));
 await page.locator('#regional').focus();await page.keyboard.press('f');await page.evaluate(()=>window.__railProbe.focusTrain());await page.waitForTimeout(300);
 const after=await page.evaluate(()=>window.__railProbe.snapshot().towns.map(town=>window.__railProbe.project(town.position)));
 for(let i=0;i<before.length;i++){expect(after[i]!.visible).toBe(before[i]!.visible);expect(after[i]!.x).toBeCloseTo(before[i]!.x,6);expect(after[i]!.y).toBeCloseTo(before[i]!.y,6);}expect(errors).toEqual([]);
});

test('a paused active service can be followed at its actual track location',async({page})=>{
 await page.goto('/?skip-menu=1&lang=en');await page.waitForFunction(()=>window.__railProbe?.ready);await page.evaluate(()=>window.__railProbe.setSpeed(0));await expect(page.locator('#follow')).toBeVisible();await page.locator('#follow').click();await page.waitForTimeout(300);
 const state=await page.evaluate(()=>window.__railProbe.snapshot()),train=state.trains[0]!,position=motionPosition(train.motion,compileGraph(state.railway));
 const projected=await page.evaluate(point=>window.__railProbe.project(point),position);
 expect(projected.visible).toBe(true);expect(projected.x).toBeGreaterThan(400);expect(projected.x).toBeLessThan(1040);expect(projected.y).toBeGreaterThan(180);expect(projected.y).toBeLessThan(720);
 expect(await page.evaluate(()=>window.__railProbe.stats().lod)).toBe(0);
 await expect(page.locator('#toast')).toContainText('Following the selected train.');
});
