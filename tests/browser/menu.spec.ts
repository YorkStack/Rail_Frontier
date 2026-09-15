import { test,expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';

test('main menu starts, resumes and manages a named save slot',async({page})=>{
  const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));page.on('console',event=>{if(event.type()==='error'||event.type()==='warning')errors.push(event.text());});
  await page.goto('/');await page.waitForFunction(()=>window.__railProbe?.ready);
  await expect(page.getByRole('region',{name:'Main menu'})).toBeVisible();
  await expect(page.getByRole('heading',{name:'The Northern Line'})).toBeVisible();
  await expect(page.getByRole('button',{name:'Continue latest'})).toBeDisabled();
  await expect(page.locator('#run-state')).toHaveText('PAUSED');
  mkdirSync('artifacts/evidence',{recursive:true});await page.screenshot({path:'artifacts/evidence/main-menu.png'});
  await page.getByRole('button',{name:'Settings'}).click();await expect(page.getByText('Landscape & motion')).toBeVisible();
  await page.getByRole('button',{name:'Campaign'}).click();await page.getByRole('button',{name:/Start new company/}).click();
  await expect(page.getByRole('region',{name:'Main menu'})).toBeHidden();await expect(page.locator('#run-state')).toHaveText('RUNNING');
  await page.getByRole('button',{name:'Save study'}).click();await expect(page.getByRole('status')).toContainText('Study saved');
  await page.getByRole('button',{name:'Open main menu'}).click();await page.locator('[data-menu-view="saves"]').click();
  await expect(page.getByText('Norwegian Fjords company')).toBeVisible();await page.getByLabel('New manual save').fill('Before the mountain crossing');await page.getByRole('button',{name:'Save current company'}).click();await expect(page.getByText('Before the mountain crossing')).toBeVisible();
  const original=page.locator('.save-slot').filter({hasText:'Norwegian Fjords company'});await original.getByRole('button',{name:'Rename'}).click();
  const input=page.getByLabel('New name for Norwegian Fjords company');await input.fill('Sundvik & Fjellhavn');await page.getByRole('button',{name:'Save name'}).click();
  await expect(page.getByText('Sundvik & Fjellhavn')).toBeVisible();await expect(page.locator('#storage-usage')).not.toHaveText('Checking browser storage…');
  const downloadPromise=page.waitForEvent('download');await page.locator('.save-slot').filter({hasText:'Sundvik & Fjellhavn'}).getByRole('button',{name:'Export'}).click();const download=await downloadPromise,path=await download.path();expect(download.suggestedFilename()).toBe('Sundvik-Fjellhavn.railfrontier.json');expect(path).not.toBeNull();
  const beforeRejectedImport=await page.evaluate(()=>window.__railProbe.snapshot()),slotCount=await page.locator('.save-slot').count();await page.getByLabel('Import save').setInputFiles({name:'broken.json',mimeType:'application/json',buffer:Buffer.from('{')});await expect(page.locator('#save-error')).toContainText('Archive is not valid JSON');expect(await page.locator('.save-slot').count()).toBe(slotCount);expect(await page.evaluate(()=>window.__railProbe.snapshot())).toEqual(beforeRejectedImport);
  await page.getByLabel('Import save').setInputFiles(path!);await expect(page.getByText('Sundvik & Fjellhavn')).toHaveCount(2);
  await page.locator('.save-slot').filter({hasText:'Sundvik & Fjellhavn'}).first().getByRole('button',{name:'Resume'}).click();
  await expect(page.getByRole('region',{name:'Main menu'})).toBeHidden();await expect(page.getByRole('complementary',{name:'Campaign objectives'})).toBeVisible();
  expect(errors).toEqual([]);
});
