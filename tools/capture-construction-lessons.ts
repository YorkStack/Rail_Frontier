import {chromium,expect} from '@playwright/test';
import {mkdir,copyFile} from 'node:fs/promises';
const base=process.env.RAIL_FRONTIER_URL??'http://127.0.0.1:5173';
const output='artifacts/evidence/construction-readme',names:string[]=[];
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
  const page=await browser.newPage({viewport:{width:1440,height:900}});page.setDefaultTimeout(20000);const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await mkdir(output,{recursive:true});
  const capture=async(name:string)=>{await page.mouse.move(50,110);await page.waitForTimeout(4500);await page.screenshot({path:`${output}/${name}.png`});names.push(name);};
  for(const lesson of ['inlet','ridge']){
    await page.goto(`${base}/?draw-practice=1&lesson=${lesson}&lang=de`);await expect(page.locator('#planner')).toBeVisible({timeout:30000});await page.locator('#route-ports button').first().click();await page.locator('#route-ports button').first().click();await expect(page.locator('#commit-track')).toBeEnabled();
    if(lesson==='inlet'){
      await capture('construction-inlet-bridge');await page.locator('.route-choice').filter({hasText:'Über Land'}).first().click();await capture('construction-inlet-land');
    }else{
      await page.locator('.engineering-marker').first().click();await expect(page.locator('.route-choice').first()).toContainText('Aktuellen Entwurf behalten');await expect(page.locator('#commit-track')).toBeEnabled();await capture('construction-ridge-options');
    }
  }
  if(errors.length)throw new Error(errors.join('\n'));
}finally{await browser.close();}

await mkdir('docs/screenshots',{recursive:true});
for(const name of names)await copyFile(`${output}/${name}.png`,`docs/screenshots/${name}.png`);
