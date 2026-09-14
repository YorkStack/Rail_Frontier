import { expect,test } from '@playwright/test';
import { mkdirSync } from 'node:fs';

test('connected town economy advances at the daily boundary',async({page})=>{
  const errors:string[]=[];page.on('console',message=>{if(message.type()==='error')errors.push(message.text());});page.on('pageerror',error=>errors.push(error.message));
  await page.goto('/?skip-menu');await page.waitForFunction(()=>window.__railProbe?.ready===true);await page.getByRole('navigation',{name:'Focus a settlement'}).getByRole('button',{name:/Sundvik/}).click();
  const context=page.getByRole('region',{name:'Selected map object'});await expect(context).toContainText('35 / 100');const start=await page.evaluate(()=>window.__railProbe.snapshot().tick);await page.getByRole('button',{name:'8×',exact:true}).click();await page.waitForFunction(tick=>window.__railProbe.snapshot().tick>=Math.floor(tick/1200+1)*1200,start,{timeout:20000});await page.getByRole('button',{name:'Pause',exact:true}).click();
  await expect(context).toContainText('60 / 100');await expect(context).toContainText('Connected days');await expect(context).toContainText('32');mkdirSync('artifacts/evidence',{recursive:true});await page.screenshot({path:'artifacts/evidence/town-economy.png'});expect(errors).toEqual([]);
});
