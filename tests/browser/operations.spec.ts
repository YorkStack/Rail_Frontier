import { test,expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';

test('office UI purchases a consist, creates a route and assigns service',async({page})=>{
  const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));page.on('console',event=>{if(event.type()==='error'||event.type()==='warning')errors.push(event.text());});
  await page.goto('/?skip-menu=1');await page.waitForFunction(()=>window.__railProbe?.ready);await page.getByRole('button',{name:'Operations'}).click();await expect(page.getByRole('region',{name:'Railway operations'})).toBeVisible();
  await page.getByLabel('Purchase at').selectOption('station:12');await page.getByLabel('Passenger coaches').selectOption('2');await page.getByRole('button',{name:'Buy steam consist'}).click();await expect(page.locator('#operations-valid')).toContainText('purchased');
  const trainId=await page.evaluate(()=>window.__railProbe.snapshot().trains.at(-1)!.id);expect(await page.evaluate(()=>window.__railProbe.snapshot().trains.length)).toBe(2);await expect(page.getByText('Train purchase')).toBeVisible();
  await page.locator('#route-from').selectOption('station:12');await page.locator('#route-to').selectOption('station:13');await page.getByRole('button',{name:'Create shuttle route'}).click();await expect(page.locator('#operations-valid')).toContainText('created');
  const routeId=await page.evaluate(()=>window.__railProbe.snapshot().routes.at(-1)!.id);await page.locator('#assign-train').selectOption(trainId);await page.locator('#assign-route-select').selectOption(routeId);await page.getByRole('button',{name:'Assign service'}).click();await expect(page.locator('#operations-valid')).toContainText('assigned');
  expect(await page.evaluate(id=>window.__railProbe.snapshot().trains.find(train=>train.id===id)?.phase,trainId)).toBe('running');mkdirSync('artifacts/evidence',{recursive:true});await page.screenshot({path:'artifacts/evidence/operations-office.png'});expect(errors).toEqual([]);
});
