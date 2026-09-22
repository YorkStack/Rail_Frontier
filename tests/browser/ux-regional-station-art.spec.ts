import {test,expect} from '@playwright/test';
import {mkdirSync} from 'node:fs';
import {serialize} from '../../src/persistence/save.js';

for(const region of ['norway','arizona'])test(`regional station materials survive purchase and display later eras (${region})`,async({page})=>{
 test.setTimeout(180000);const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.goto(region==='norway'?'/?lang=en':'/?skip-menu=1&world=arizona&lang=en');await page.waitForFunction(()=>window.__railProbe?.ready);
 // Arizona remains a scenery study: expose the existing tools only in this art fixture.
 if(region==='arizona')await page.evaluate(()=>document.body.classList.remove('terrain-study-mode'));
 if(region==='norway'){await page.locator('#choose-new-game').click();await page.locator('#new-game').click();await expect(page.locator('#main-menu')).toBeHidden();}
 await page.locator('#place-station').click();await page.locator('#station-orientation').fill('55');await page.locator('#commit-station').click();await expect.poll(()=>page.evaluate(()=>window.__railProbe.snapshot().stations.length)).toBeGreaterThan(0);
 const state=await page.evaluate(()=>window.__railProbe.snapshot()),station=state.stations.at(-1)!,center=state.railway.nodes.find(n=>n.id===station.nodeId)!.position;
 const view=async(year:number,target=center,label='')=>{await page.evaluate(p=>window.__railProbe.focus(p),target);await page.mouse.move(810,360);await page.mouse.down();await page.mouse.move(590,360,{steps:20});await page.mouse.up();await page.mouse.wheel(0,-1800);await page.waitForTimeout(900);await expect(page.locator('#toast')).not.toHaveClass(/visible/);await page.waitForTimeout(400);mkdirSync('artifacts/evidence/regional-stations',{recursive:true});await page.screenshot({path:`artifacts/evidence/regional-stations/${region}-${year}${label}.png`});};
 let actual=await page.evaluate(()=>window.__railProbe.settlementPresentation());expect(actual.stationAsset).toBe(region+'-station');expect(actual.platforms).toContain(region==='norway'?'surface:gravel':'surface:timber');await view(1900);
 // Import valid dated fixtures through the public save UI; no forced renderer-only state.
 for(const year of [1930,1959,2000]){
  const dated=structuredClone(state);dated.tick=year===1959?(1960-dated.startingYear)*360*1200-1:(year-dated.startingYear)*360*1200;
  await page.locator('#game-menu-button').click();await page.locator('#menu-settings-button').click();await page.locator('[data-menu-view=saves]').click();
  await page.getByLabel('Import save').setInputFiles({name:`era-${year}.json`,mimeType:'application/json',buffer:Buffer.from(serialize(dated))});
  await page.locator('.save-slot').filter({hasText:`era-${year}`}).getByRole('button',{name:'Resume'}).click();await expect(page.locator('#main-menu')).toBeHidden();await expect(page.locator('#date')).toContainText(String(year));
  actual=await page.evaluate(()=>window.__railProbe.settlementPresentation());expect(actual.platforms).toContain(year<1960?'surface:pavers':'surface:asphalt');expect(actual.stationAsset).toBe(region+'-station');if(year===1959){await page.evaluate(()=>window.__railProbe.setSpeed(1));await expect(page.locator('#date')).toContainText('1960');await page.evaluate(()=>window.__railProbe.setSpeed(0));await expect.poll(()=>page.evaluate(()=>window.__railProbe.settlementPresentation().platforms)).toContain('surface:asphalt');expect((await page.evaluate(()=>window.__railProbe.snapshot())).railway).toEqual(state.railway);}else{if(year===2000)expect(actual.streets).toContain('village-road-asphalt');await view(year);expect(actual.stationAssets).toContain(region+'-station');await page.locator('#place-station').click();await page.locator('#commit-station').click();await expect.poll(()=>page.evaluate(()=>window.__railProbe.snapshot().stations.length)).toBe(state.stations.length+1);const changed=await page.evaluate(()=>window.__railProbe.snapshot()),fresh=changed.stations.at(-1)!,at=changed.railway.nodes.find(n=>n.id===fresh.nodeId)!.position;expect((await page.evaluate(()=>window.__railProbe.settlementPresentation())).stationAssets).toContain(region+'-station'+(year===1930?'-interwar':'-modern'));await view(year,at,'-new-build');}
 }
 await page.locator('#save').click();await expect(page.locator('#toast')).toContainText('saved');if(region==='arizona')await page.goto('/?world=arizona&lang=en');else await page.reload();await page.waitForFunction(()=>window.__railProbe?.ready);if(region==='arizona')await page.evaluate(()=>document.body.classList.remove('terrain-study-mode'));await page.locator('#continue-game').click();await expect(page.locator('#main-menu')).toBeHidden();await expect.poll(()=>page.evaluate(()=>window.__railProbe.settlementPresentation().stationAssets)).toContain(region+'-station-modern');
 expect(errors).toEqual([]);
});
