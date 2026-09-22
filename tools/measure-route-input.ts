/** Fixed test build required. Measures real held-key input and long drawing;
 * run with RAIL_FRONTIER_URL=http://127.0.0.1:5174 npx tsx tools/measure-route-input.ts [output.json]. */
import {chromium,expect} from '@playwright/test';
import {mkdirSync,writeFileSync} from 'node:fs';
import {dirname} from 'node:path';
const browser=await chromium.launch({channel:'chrome',headless:true}),page=await browser.newPage({viewport:{width:1440,height:900}});
try{
  await page.addInitScript(()=>{
    (window as any).__name=(value:unknown)=>value;
    const samples:number[]=[];(window as any).inputPaintSamples=samples;
    window.addEventListener('pointermove',e=>{if(e.buttons!==1)return;const start=performance.now();requestAnimationFrame(()=>requestAnimationFrame(()=>samples.push(performance.now()-start)));},true);
  });
  await page.goto(`${process.env.RAIL_FRONTIER_URL??'http://127.0.0.1:5174'}/?draw-practice=1&lang=en`);await expect(page.locator('#planner')).toBeVisible();
  await page.locator('#route-ports button').first().click();await page.locator('#route-ports button').first().click();await expect(page.locator('#commit-track')).toBeEnabled();
  const before=await page.evaluate(()=>window.__railProbe.planning()),original=await page.locator('#route-draft-overlay svg > path').getAttribute('d');
  await page.locator('.route-handle').first().focus();
  for(let i=0;i<20;i++)await page.keyboard.down('ArrowRight');
  const held=await page.evaluate(()=>window.__railProbe.planning());await page.keyboard.up('ArrowRight');await expect(page.locator('#commit-track')).toBeEnabled();
  const released=await page.evaluate(()=>window.__railProbe.planning());await page.locator('#undo-waypoint').click();
  await page.evaluate(()=>new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve()))));
  const oneUndoRestores=await page.locator('#route-draft-overlay svg > path').getAttribute('d')===original;
  await page.locator('#clear-alignment').click();
  const positions=await page.evaluate(()=>{const state=window.__railProbe.snapshot();return state.stations.map((station,i)=>{if(station.layout.kind!=='single-platform')throw Error('No platform');const nodeId=station.layout.ports[i===0?1:0]!.nodeId;return window.__railProbe.project(state.railway.nodes.find(n=>n.id===nodeId)!.position);});});
  const [a,b]=positions;await page.mouse.move(a!.x,a!.y);await page.mouse.down();
  for(let i=1;i<=160;i++){const t=i/160;await page.mouse.move(a!.x+(b!.x-a!.x)*t+12*Math.sin(Math.PI*t),a!.y+(b!.y-a!.y)*t);}
  await page.mouse.up();await expect(page.locator('#commit-track')).toBeEnabled();
  const samples=await page.evaluate(()=>(window as any).inputPaintSamples as number[]);samples.sort((a,b)=>a-b);
  const report={browser:browser.version(),viewport:[1440,900],repeatCount:20,requestsWhileHeld:held.requests-before.requests,requestsAfterRelease:released.requests-before.requests,oneUndoRestores,strokeEvents:samples.length,inputToFollowingFrameP95Ms:samples[Math.floor(samples.length*.95)],maxMs:samples.at(-1)};
  const output=process.argv[2]??'artifacts/route-input.json';mkdirSync(dirname(output),{recursive:true});writeFileSync(output,JSON.stringify(report,null,2));console.log(report);
}finally{await browser.close();}
