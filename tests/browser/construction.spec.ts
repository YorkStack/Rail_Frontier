import { test,expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';

test('station-first placement builds an oriented platform on open ground',async({page})=>{
  const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));page.on('console',event=>{if(event.type()==='error'||event.type()==='warning')errors.push(event.text());});
  await page.goto('/');await page.waitForFunction(()=>window.__railProbe?.ready);await page.getByRole('button',{name:'Start new company'}).click();await expect(page.locator('#main-menu')).toBeHidden();await page.evaluate(()=>window.__railProbe.regional());
  const before=await page.evaluate(()=>({revision:window.__railProbe.snapshot().railway.revision,stations:window.__railProbe.snapshot().stations.length}));
  await page.locator('#place-station').click();await page.getByLabel('Platform direction').fill('35');await expect(page.locator('#station-valid')).toContainText('Ready');mkdirSync('artifacts/evidence',{recursive:true});await page.screenshot({path:'artifacts/evidence/station-first-preview.png'});await page.locator('#commit-station').click();await page.waitForFunction(count=>window.__railProbe?.snapshot().stations.length===count+1,before.stations);
  const after=await page.evaluate(()=>{const state=window.__railProbe.snapshot(),layout=state.stations[0]?.layout;return {revision:state.railway.revision,nodes:state.railway.nodes.length,edges:state.railway.edges.length,kind:layout?.kind,orientationRad:layout?.kind==='single-platform'?layout.orientationRad:null};});expect(after.revision).toBe(before.revision+1);expect(after.nodes).toBe(3);expect(after.edges).toBe(2);expect(after.kind).toBe('single-platform');expect(after.orientationRad).toBeCloseTo(35*Math.PI/180);
  expect(errors).toEqual([]);
});
