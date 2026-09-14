import {expect,test} from '@playwright/test';
import {mkdirSync,writeFileSync} from 'node:fs';

test('renders three composed settlements and all timber finish families',async({page})=>{
  const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));page.on('console',message=>{if(message.type()==='error'||message.type()==='warning')errors.push(message.text());});await page.goto('/?skip-menu=1');await page.waitForFunction(()=>window.__railProbe?.ready===true);await page.evaluate(()=>window.__railProbe.setSpeed(0));
  const assets=await page.evaluate(()=>window.__railProbe.assets),names=new Set(assets.map(asset=>asset.name));for(const family of ['red-white','ochre-white','charcoal-white','white-red'])expect(names.has(`norway-house-${family}`)).toBe(true);expect(names.has('norway-sawmill')).toBe(true);expect(names.has('norway-barn')).toBe(true);
  mkdirSync('artifacts/evidence/gfx-006',{recursive:true});const navigation=page.getByRole('navigation',{name:'Focus a settlement'});for(const [name,file] of [['Sundvik','sundvik-harbour'],['Granli','granli-farms'],['Fjellhavn','fjellhavn-terraces']] as const){await navigation.getByRole('button',{name:new RegExp(name)}).click();await page.getByRole('button',{name:'Close selection'}).click();await page.waitForTimeout(300);await page.screenshot({path:`artifacts/evidence/gfx-006/${file}.png`});}
  const stats=await page.evaluate(()=>window.__railProbe.stats());expect(stats.buildings).toBe(51);expect(stats.textures).toBeGreaterThanOrEqual(12);expect(errors).toEqual([]);writeFileSync('artifacts/evidence/gfx-006/runtime.json',JSON.stringify({assets:assets.length,uniqueAssets:names.size,stats},null,2));
});
