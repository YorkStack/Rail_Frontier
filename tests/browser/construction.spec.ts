import { test,expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';

test('map picks build a free alignment and a station through the UI',async({page})=>{
  const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));page.on('console',event=>{if(event.type()==='error'||event.type()==='warning')errors.push(event.text());});
  await page.goto('/?skip-menu=1');await page.waitForFunction(()=>window.__railProbe?.ready);
  const before=await page.evaluate(()=>({revision:window.__railProbe.snapshot().railway.revision,stations:window.__railProbe.snapshot().stations.length}));
  await page.getByRole('button',{name:'Survey track'}).click();await page.getByLabel('Corridor').selectOption('free');
  const points=await page.evaluate(()=>[
    window.__railProbe.project({x:3000,y:51.17727902987974,z:3600}),
    window.__railProbe.project({x:3300,y:48.83904632407689,z:3900})
  ]);
  expect(points.every(point=>point.visible)).toBe(true);for(const point of points)await page.mouse.click(point.x,point.y);
  await expect(page.locator('#quote-valid')).toContainText('Feasible');mkdirSync('artifacts/evidence',{recursive:true});await page.screenshot({path:'artifacts/evidence/free-alignment.png'});await page.getByRole('button',{name:'Build this alignment'}).click();
  await page.waitForFunction(revision=>window.__railProbe.snapshot().railway.revision===revision+1,before.revision);
  await page.getByRole('button',{name:'Place station'}).click();const projected=await page.evaluate(()=>window.__railProbe.project(window.__railProbe.snapshot().railway.nodes.at(-1)!.position));expect(Number.isFinite(projected.x)&&Number.isFinite(projected.y)).toBe(true);await page.mouse.click(projected.x,projected.y);
  await expect(page.locator('#station-valid')).toContainText('Ready');await page.getByRole('button',{name:'Build station'}).click();await page.waitForFunction(count=>window.__railProbe.snapshot().stations.length===count+1,before.stations);
  expect(errors).toEqual([]);
});
