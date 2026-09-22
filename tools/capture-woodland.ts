/** Capture the actual fixed-build scenery and its geometry budgets. */
import {chromium,expect} from '@playwright/test';
import {mkdirSync,writeFileSync} from 'node:fs';
const browser=await chromium.launch({channel:'chrome',headless:true}),page=await browser.newPage({viewport:{width:1440,height:900}}),errors:string[]=[];
page.on('pageerror',error=>errors.push(error.message));page.on('console',message=>{if(message.type()==='error')errors.push(message.text());});
try{
 await page.goto(`${process.env.RAIL_FRONTIER_URL??'http://127.0.0.1:5174'}/?skip-menu=1&lang=de`);await page.waitForFunction(()=>window.__railProbe?.ready);await page.evaluate(()=>window.__railProbe.setSpeed(0));await page.waitForTimeout(3500);
 mkdirSync('artifacts/evidence/woodland',{recursive:true});const views:Record<string,unknown>={};
 for(const id of ['regional','shore','forest-edge','train']){
  await page.evaluate(id=>{if(id==='train')window.__railProbe.focusTrain();else window.__railProbe.cameraPreset(id);},id);await page.waitForTimeout(600);
  const stats=await page.evaluate(()=>window.__railProbe.stats());views[id]=stats;await page.screenshot({path:`artifacts/evidence/woodland/${id}.png`});
 }
 writeFileSync('artifacts/evidence/woodland/runtime.json',JSON.stringify({views,errors},null,2));console.log(JSON.stringify(views,null,2));expect(errors).toEqual([]);
 for(const stats of Object.values(views) as {triangles:number;calls:number}[]){expect(stats.triangles).toBeLessThanOrEqual(2_000_000);expect(stats.calls).toBeLessThanOrEqual(300);}
}finally{await browser.close();}
