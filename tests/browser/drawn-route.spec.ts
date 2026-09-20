import {test,expect} from '@playwright/test';
import {mkdirSync} from 'node:fs';

test('draw, reshape, compare, cancel and build a real railway without camera or cash side effects',async({page})=>{
  test.setTimeout(180000);const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/');await page.waitForFunction(()=>window.__railProbe?.ready);await page.locator('#try-drawing').click();await expect(page.locator('#main-menu')).toBeHidden();await expect(page.locator('#planner')).toBeVisible();
  const before=await page.evaluate(()=>window.__railProbe.snapshot());expect(before.stations).toHaveLength(2);expect(before.railway.edges).toHaveLength(4);
  const ports=await page.evaluate(()=>{const state=window.__railProbe.snapshot();return state.stations.map((station,i)=>{if(station.layout.kind!=='single-platform')throw new Error('Missing station ports');const nodeId=station.layout.ports[i===0?1:0]!.nodeId;return state.railway.nodes.find(n=>n.id===nodeId)!.position;});});
  const screens=await page.evaluate(ports=>ports.map(p=>window.__railProbe.project(p)),ports),a=screens[0]!,b=screens[1]!;
  await page.mouse.move(a.x,a.y);await page.mouse.down();await page.mouse.move((a.x+b.x)/2-18,(a.y+b.y)/2+20,{steps:15});await page.mouse.move(b.x,b.y,{steps:15});await page.mouse.up();
  await expect(page.locator('#commit-track')).toBeEnabled({timeout:20000});await expect(page.locator('.route-choice').first()).toBeVisible();
  expect(await page.evaluate(p=>window.__railProbe.project(p),ports[0]!)).toEqual(screens[0]);
  expect(await page.evaluate(()=>window.__railProbe.snapshot().company.cash)).toBe(before.company.cash);
  const original=await page.locator('#route-draft-overlay svg > path').getAttribute('d');
  const handle=page.locator('.route-handle').first();await expect(handle).toBeVisible();const box=(await handle.boundingBox())!;
  await page.mouse.move(box.x+22,box.y+22);await page.mouse.down();await page.mouse.move(box.x+37,box.y+12,{steps:3});await page.keyboard.press('Escape');await page.mouse.up();await expect(page.locator('#route-draft-overlay svg > path')).toHaveAttribute('d',original!);await expect(page.locator('#planner')).toBeVisible();
  await page.locator('#undo-waypoint').click();await expect(page.locator('#commit-track')).toBeDisabled();await page.locator('#redo-waypoint').click();await expect(page.locator('#commit-track')).toBeEnabled({timeout:20000});
  const choices=page.locator('.route-choice');if(await choices.count()>1){const price=await page.locator('#quote-cost').innerText();await choices.nth(1).click();expect(await page.locator('#quote-cost').innerText()).not.toBe(price);await choices.first().click();}
  // A completed draft must survive a click on empty terrain.
  await page.mouse.click(450,650);await expect(page.locator('#route-draft-overlay svg > path')).toHaveAttribute('d',original!);
  mkdirSync('artifacts/evidence/drawn-route-live',{recursive:true});await page.screenshot({path:'artifacts/evidence/drawn-route-live/review.png'});
  const priceText=await page.locator('#quote-cost').innerText(),cost=Math.round(Number(priceText.replace(/[^\d.]/g,''))*100);await page.locator('#commit-track').click();await expect(page.locator('#planner')).toBeHidden();
  const built=await page.evaluate(()=>window.__railProbe.snapshot());expect(built.railway.revision).toBe(before.railway.revision+1);expect(built.railway.edges.length).toBeGreaterThan(4);expect(built.company.ledger.length).toBe(before.company.ledger.length+1);expect(Math.abs(before.company.cash-built.company.cash-cost)).toBeLessThanOrEqual(50);
  await page.locator('#save').click();await expect(page.locator('#toast')).toContainText('saved');await page.reload();await page.waitForFunction(()=>window.__railProbe?.ready);await page.locator('#continue-game').click();await expect(page.locator('#main-menu')).toBeHidden();expect(await page.evaluate(()=>window.__railProbe.snapshot())).toEqual(built);expect(errors).toEqual([]);
});
