import { expect,test } from '@playwright/test';
import { mkdirSync } from 'node:fs';

test('map objects expose live context and overlays',async({page})=>{
  const errors:string[]=[];page.on('console',message=>{if(message.type()==='error')errors.push(message.text());});page.on('pageerror',error=>errors.push(error.message));
  await page.goto('/?skip-menu');await page.waitForFunction(()=>window.__railProbe?.ready===true);await page.evaluate(()=>window.__railProbe.regional());

  await page.getByRole('button',{name:'Granli Forest',exact:true}).click();
  const context=page.getByRole('region',{name:'Selected map object'});await expect(context).toBeVisible();await expect(context.getByText('INDUSTRY',{exact:true})).toBeVisible();await expect(context.getByRole('heading',{name:'Granli Forest'})).toBeVisible();await expect(context.getByText('Production',{exact:true})).toBeVisible();

  await context.getByRole('button',{name:'Close selection'}).click();await page.getByRole('button',{name:/Overlays/}).click();
  const overlays=page.getByRole('region',{name:'Map overlays'});await expect(overlays).toBeVisible();await overlays.getByRole('button',{name:/Station catchments/}).click();await expect(overlays.getByRole('button',{name:/Station catchments/})).toHaveAttribute('aria-pressed','true');await expect(overlays.getByText(/Gold rings/)).toBeVisible();
  await overlays.getByRole('button',{name:/Rail traffic/}).click();await expect(overlays.getByText(/Coral track/)).toBeVisible();

  await page.getByRole('navigation',{name:'Focus a settlement'}).getByRole('button',{name:/Sundvik/}).click();await expect(context).toBeVisible();await expect(context.getByText('SETTLEMENT',{exact:true})).toBeVisible();await expect(context.getByText('Rail access',{exact:true})).toBeVisible();await expect(context.getByText('Economic activity',{exact:true})).toBeVisible();await expect(context.getByText('Lumber demand',{exact:true})).toBeVisible();await expect(context.getByText('Mail waiting',{exact:true})).toBeVisible();

  await context.getByRole('button',{name:'Close selection'}).click();await page.getByRole('button',{name:/Operations/}).click();const office=page.getByRole('region',{name:'Railway operations'});await expect(office.getByText('STATIONS',{exact:true})).toBeVisible();
  await office.locator('#train-roster .office-row').first().click();await expect(context).toBeVisible();await expect(context.getByText('TRAIN',{exact:true})).toBeVisible();await expect(context.getByText('Revenue',{exact:true})).toBeVisible();
  await context.getByRole('button',{name:'Close selection'}).click();await page.mouse.click(720,450);await expect(context).toBeVisible();await expect(context.getByText('TRAIN',{exact:true})).toBeVisible();

  mkdirSync('artifacts/evidence',{recursive:true});await page.screenshot({path:'artifacts/evidence/context-overlays.png'});expect(errors).toEqual([]);
});
