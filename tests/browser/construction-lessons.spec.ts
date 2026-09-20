import {test,expect} from '@playwright/test';
import {mkdirSync} from 'node:fs';

test('inlet choices compare actual water and land routes, build and advance without losing the company',async({page})=>{
  test.setTimeout(180000);page.setDefaultTimeout(20000);const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/?draw-practice=1&lesson=inlet&lang=de');await expect(page.locator('#planner')).toBeVisible({timeout:30000});
  const before=await page.evaluate(()=>window.__railProbe.snapshot());expect(before.company.openingCash).toBe(1_000_000_000);
  await page.locator('#route-ports button').filter({hasText:'Südufer'}).click();await page.locator('#route-ports button').filter({hasText:'Nordufer'}).click();await expect(page.locator('#commit-track')).toBeEnabled({timeout:20000});
  await page.locator('.route-choice').filter({hasText:'Mit Brücke'}).first().click();
  // Ask the actual obstacle for solutions; quote and cash stay separate.
  await page.locator('#route-obstacles button').first().click();await expect(page.locator('#commit-track')).toBeEnabled({timeout:20000});await expect(page.locator('.route-choice').first()).toContainText('Aktuellen Entwurf behalten');
  expect(await page.evaluate(()=>window.__railProbe.snapshot().company.cash)).toBe(before.company.cash);
  await page.locator('#retry-corridor').click();await expect(page.locator('#commit-track')).toBeEnabled({timeout:20000});
  const ground=page.locator('.route-choice').filter({hasText:'Über Land'}),bridge=page.locator('.route-choice').filter({hasText:'Mit Brücke'});expect(await ground.count()).toBeGreaterThan(0);await expect(bridge.first()).toBeVisible();
  await bridge.first().click();await expect(page.locator('#quote-kind')).toContainText('Brücke');mkdirSync('artifacts/evidence/construction-lessons',{recursive:true});await page.screenshot({path:'artifacts/evidence/construction-lessons/inlet-bridge.png'});
  await ground.first().click();await expect(page.locator('#quote-kind')).not.toContainText('Brücke');await page.screenshot({path:'artifacts/evidence/construction-lessons/inlet-land.png'});
  const quote=await page.locator('#quote-cost').innerText();await page.locator('#commit-track').click();await expect(page.locator('#planner')).toBeHidden();await expect(page.locator('#practice-progress')).toContainText('Verbunden!');
  const built=await page.evaluate(()=>window.__railProbe.snapshot());expect(built.company.ledger.length).toBe(before.company.ledger.length+1);const cost=Number(quote.replace(/[^\d.]/g,''))*100;expect(Math.abs(before.company.cash-built.company.cash-cost)).toBeLessThanOrEqual(50);
  await page.locator('#next-practice').click();await expect(page.locator('#planner')).toBeVisible({timeout:30000});await expect(page.locator('#planner-copy')).toContainText('Bergrücken');
  const ridge=await page.evaluate(()=>window.__railProbe.snapshot());expect(ridge.stations).toHaveLength(2);expect(ridge.railway.edges).toHaveLength(4);
  await page.locator('#route-ports button').first().click();await page.locator('#route-ports button').first().click();await expect(page.locator('#commit-track')).toBeEnabled({timeout:20000});await expect(page.locator('#quote-kind')).toContainText('Tunnel');await page.screenshot({path:'artifacts/evidence/construction-lessons/ridge.png'});
  await page.locator('#open-menu').click();await page.locator('[data-menu-view="saves"]').click();await expect(page.locator('#main-menu')).toContainText('Gesellschaft vor Gleisbauübung');expect(errors).toEqual([]);
});
