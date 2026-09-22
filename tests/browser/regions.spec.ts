import {test,expect} from '@playwright/test';
import {mkdirSync} from 'node:fs';

test('region selector starts a playable Rhine company with an aligned station and regional stock',async({page})=>{
  const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto('/?lang=de');await page.waitForFunction(()=>window.__railProbe?.ready);
  await page.locator('input[name="region"][value="rhine"]').check();
  await expect(page.locator('#region-description')).toContainText('Boppard');
  await expect(page.locator('#new-game')).toBeHidden();
  await page.locator('#choose-new-game').click();await page.locator('#free-game').click();
  await expect(page.locator('#main-menu')).toBeHidden();
  expect(await page.evaluate(()=>window.__railProbe.snapshot().campaignId)).toBe('middle-rhine');
  await page.locator('#place-station').click();
  await expect(page.locator('#station-orientation')).not.toHaveValue('0');
  await expect(page.locator('#commit-station')).toBeEnabled({timeout:20000});
  await page.locator('#close-station').click();await page.locator('#operations').click();
  await expect(page.locator('#locomotive-id option')).toHaveCount(1);
  await expect(page.locator('#locomotive-id option').first()).toContainText('Prussian G 3');
  await page.locator('#consist-kind').selectOption('freight');
  await expect(page.locator('#wagon-id option')).toHaveCount(4);
  await expect(page.locator('#wagon-id')).toContainText(/Mineralwagen|Schüttgutwagen/);
  expect(errors).toEqual([]);
});

for(const region of ['rhine','tyne'] as const)test(`${region} catalogue renders its real-height landscape`,async({page})=>{
  const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto(`/?skip-menu=1&world=${region}&lang=de`);await page.waitForFunction(()=>window.__railProbe?.ready,{timeout:90000});
  await page.evaluate(()=>window.__railProbe.setSpeed(0));
  await expect(page.locator('#cash')).toContainText(region==='rhine'?'Mark':'£');
  const probe=await page.evaluate(()=>({state:window.__railProbe.snapshot(),stats:window.__railProbe.stats(),assets:window.__railProbe.assets}));
  expect(probe.state.world.widthM).toBe(32000);expect(probe.state.industries).toHaveLength(5);expect(probe.stats.buildings).toBeGreaterThan(160);expect(probe.stats.trees).toBeGreaterThan(3000);
  expect(probe.assets.filter((asset:{name:string})=>asset.name.startsWith(region+'-'))).toHaveLength(92);
  mkdirSync('artifacts/evidence/regions',{recursive:true});await page.screenshot({path:`artifacts/evidence/regions/${region}-settlement.png`});
  await page.evaluate(()=>window.__railProbe.cameraPreset('regional'));await page.waitForTimeout(400);await page.screenshot({path:`artifacts/evidence/regions/${region}-regional.png`});
  expect(errors).toEqual([]);
});

test('Arizona exposes windpump and expanded desert vegetation in the scenery study',async({page})=>{
  const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto('/?skip-menu=1&world=arizona&lang=de');await page.waitForFunction(()=>window.__railProbe?.ready,{timeout:90000});
  const assets=await page.evaluate(()=>window.__railProbe.assets.map((asset:{name:string})=>asset.name));
  for(const id of ['arizona-windpump','arizona-mesquite','arizona-juniper','arizona-saguaro','arizona-prickly-pear'])expect(assets).toContain(id);
  await page.getByRole('button',{name:'Windpumpe'}).click();await page.waitForTimeout(400);
  mkdirSync('artifacts/evidence/regions',{recursive:true});await page.screenshot({path:'artifacts/evidence/regions/arizona-windpump.png'});
  expect(errors).toEqual([]);
});
