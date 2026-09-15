import { test,expect } from '@playwright/test';
import { mkdirSync,writeFileSync } from 'node:fs';
import type { GameState,Speed,Vec3 } from '../../src/domain/model.js';
import type { AssetReport,RenderStats } from '../../src/rendering/fjord-renderer.js';
declare global {interface Window {__railProbe:{ready:boolean;assets:AssetReport[];snapshot():GameState;save():Promise<number>;load():Promise<number>;setSpeed(speed:Speed):void;stats():RenderStats;setStress(enabled:boolean):void;focusTrain():void;vehicleInspection(view:'front'|'left'|'right'|'roof',assetId?:string):void;regional():void;cameraPreset(id:string):void;cameraSweep(progress:number):void;setTerrainBlockout(enabled:boolean):void;project(position:Vec3):{x:number;y:number;visible:boolean};resetMetrics():void;metrics():RenderStats&{frames:number[];renderMs:number[];tickMs:number[];userAgent:string;viewport:number[];dpr:number};pick(x:number,y:number):Vec3|null;dispose():void}}}

test('runtime asset, camera, alignment, pause and durable save validation',async({page})=>{
  const errors:string[]=[],models:string[]=[];page.on('pageerror',error=>errors.push(error.message));page.on('console',event=>{if(event.type()==='error'||event.type()==='warning')errors.push(event.text());});page.on('request',request=>{if(request.url().includes('/models/'))models.push(request.url());});
  await page.goto('/?skip-menu=1');await page.waitForFunction(()=>window.__railProbe?.ready);
  const assets=await page.evaluate(()=>window.__railProbe.assets);expect(assets).toHaveLength(72);expect(assets.find(asset=>asset.name==='nord-2-6-0'&&asset.lod===0)?.triangles).toBe(1204);expect(assets.find(asset=>asset.name==='nord-2-6-0'&&asset.lod===1)?.triangles).toBe(236);expect(new Set(assets.map(asset=>asset.name)).size).toBe(36);expect(assets.every(asset=>asset.normalsFinite)).toBe(true);expect(models).toHaveLength(72);expect(models.every(url=>url.includes('/models/norway/'))).toBe(true);
  const production=await page.evaluate(()=>({world:window.__railProbe.snapshot().world,trains:window.__railProbe.snapshot().trains,stats:window.__railProbe.stats()}));expect(production.world.widthM).toBe(16000);expect(production.world.depthM).toBe(16000);expect(production.trains[0]!.vehicleIds).toHaveLength(2);expect(production.stats.trees).toBe(28000);
  expect(await page.evaluate(()=>window.__railProbe.stats().terrainErrorM)).toBeLessThan(.001);
  await page.waitForFunction(()=>window.__railProbe.snapshot().tick>10);
  await page.getByRole('button',{name:'Pause',exact:true}).click();
  const saved=await page.evaluate(()=>window.__railProbe.snapshot());
  await page.getByRole('button',{name:'Save study',exact:true}).click();await expect(page.getByRole('status')).toContainText('Study saved');
  await page.getByRole('button',{name:'8×',exact:true}).click();await page.waitForFunction(tick=>window.__railProbe.snapshot().tick>tick+50,saved.tick);
  await page.reload();await page.waitForFunction(()=>window.__railProbe?.ready);await page.getByRole('button',{name:'Pause',exact:true}).click();await page.getByRole('button',{name:'Load study',exact:true}).click();await expect(page.getByRole('status')).toContainText('Study resumed');
  expect(await page.evaluate(()=>window.__railProbe.snapshot())).toEqual(saved);
  await page.getByRole('button',{name:'Survey track'}).click();await expect(page.getByRole('region',{name:'Alignment study'})).toBeVisible();
  await page.getByLabel('Track elevation').fill('1');await expect(page.locator('#quote-valid')).toContainText('clearance');
  await page.getByLabel('Track elevation').fill('15');await expect(page.locator('#quote-valid')).toContainText('Feasible');
  await page.getByLabel('Corridor').selectOption('tunnel');await expect(page.locator('#quote-kind')).toContainText('tunnel');
  mkdirSync('artifacts/evidence',{recursive:true});await page.screenshot({path:'artifacts/evidence/tunnel-waterfall.png'});
  await page.getByRole('button',{name:'Close alignment study'}).click();
  await page.getByRole('button',{name:'Follow train'}).click();await page.waitForFunction(()=>window.__railProbe.stats().lod===0);
  mkdirSync('artifacts/evidence',{recursive:true});await page.screenshot({path:'artifacts/evidence/train-close.png'});
  await page.getByRole('button',{name:'Regional view'}).click();await page.waitForFunction(()=>window.__railProbe.stats().lod===1);
  await page.screenshot({path:'artifacts/evidence/norway-desktop.png'});
  await page.getByRole('button',{name:/Sundvik Harbour/}).click();await page.screenshot({path:'artifacts/evidence/station-close.png'});
  await page.setViewportSize({width:390,height:844});await page.screenshot({path:'artifacts/evidence/norway-mobile.png'});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.getByRole('button',{name:'1×',exact:true}).click();await page.waitForFunction(tick=>window.__railProbe.snapshot().tick>tick+10,saved.tick);
  expect(errors).toEqual([]);
});

test('scaled scene records honest frame metrics and releases replaced resources',async({page})=>{
  const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto('/?skip-menu=1');await page.waitForFunction(()=>window.__railProbe?.ready);await page.waitForFunction(()=>window.__railProbe.metrics().frames.length>120);
  const initial=await page.evaluate(()=>window.__railProbe.metrics());
  await page.evaluate(()=>{window.__railProbe.setSpeed(8);window.__railProbe.setStress(true);});
  await page.waitForFunction(()=>window.__railProbe.metrics().frames.length>=300,{},{timeout:45000});
  const stress=await page.evaluate(()=>window.__railProbe.metrics());expect(stress.trees).toBe(20000);expect(stress.buildings).toBe(2000);expect(stress.trains).toBe(100);
  await page.screenshot({path:'artifacts/evidence/norway-stress.png'});
  await page.evaluate(()=>window.__railProbe.setStress(false));await page.waitForFunction(()=>window.__railProbe.metrics().frames.length>=20);
  const restored=await page.evaluate(()=>window.__railProbe.stats());expect(restored.geometries).toBeLessThanOrEqual(initial.geometries+25);expect(restored.textures).toBe(initial.textures);
  await page.evaluate(()=>window.__railProbe.setStress(true));await page.waitForFunction(()=>window.__railProbe.metrics().frames.length>=20);await page.evaluate(()=>window.__railProbe.setStress(false));await page.waitForFunction(()=>window.__railProbe.metrics().frames.length>=20);const restoredAgain=await page.evaluate(()=>window.__railProbe.stats());expect(restoredAgain.geometries).toBe(restored.geometries);expect(restoredAgain.textures).toBe(restored.textures);
  await page.evaluate(()=>window.__railProbe.dispose());const disposed=await page.evaluate(()=>window.__railProbe.stats());expect(disposed.geometries).toBe(0);expect(disposed.contextLost).toBe(true);
  const summarize=(values:number[])=>{const sorted=[...values].sort((a,b)=>a-b);return {p50:sorted[Math.floor(sorted.length*.5)],p95:sorted[Math.floor(sorted.length*.95)],samples:sorted.length};};
  mkdirSync('artifacts/evidence',{recursive:true});writeFileSync('artifacts/evidence/browser-benchmark.json',JSON.stringify({date:new Date().toISOString(),environment:{userAgent:stress.userAgent,viewport:stress.viewport,dpr:stress.dpr},normal:{frameMs:summarize(initial.frames),renderSubmitMs:summarize(initial.renderMs),tickBatchMs:summarize(initial.tickMs),calls:initial.calls,triangles:initial.triangles},stress:{frameMs:summarize(stress.frames),renderSubmitMs:summarize(stress.renderMs),tickBatchMs:summarize(stress.tickMs),calls:stress.calls,triangles:stress.triangles,trees:stress.trees,buildings:stress.buildings,trains:stress.trains},restored,errors},null,2));expect(errors).toEqual([]);
});
