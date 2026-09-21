/** Fixed-build browser measurement: RAIL_FRONTIER_URL=http://127.0.0.1:5174
 * npx tsx tools/measure-planning-browser.ts [output.json]. No timing assertions:
 * native clicks, workers, terrain revalidation and frame gaps are all included. */
import {chromium} from '@playwright/test';
import {writeFileSync,mkdirSync} from 'node:fs';
import {dirname} from 'node:path';
const cpuRate=Number(process.env.CPU_RATE??1);
const browser=await chromium.launch({channel:'chrome',headless:true}),results=[];
try{
  for(const lesson of ['valley','highland'])for(let run=0;run<3;run++){
    const context=await browser.newContext({viewport:{width:1440,height:900}}),page=await context.newPage();
    // tsx preserves callback names with this helper when serializing evaluate().
    await page.addInitScript('window.__name = (value) => value');
    await page.goto(`${process.env.RAIL_FRONTIER_URL??'http://127.0.0.1:5174'}/?draw-practice=1&lesson=${lesson}&lang=de`);
    await page.waitForFunction(()=>window.__railProbe?.ready);
    await page.locator('#route-ports button').first().click();
    const session=await context.newCDPSession(page);await session.send('Emulation.setCPUThrottlingRate',{rate:cpuRate});
    await page.evaluate(()=>{
      const m={start:0,end:0,paint:0,settled:false,frames:[] as number[],tasks:[] as {start:number;duration:number}[]},w=window as any;w.routeMeasurement=m;
      const observer=new PerformanceObserver(list=>{for(const entry of list.getEntries())m.tasks.push({start:entry.startTime,duration:entry.duration});});observer.observe({type:'longtask',buffered:false});
      let previous=0;const frame=(now:number)=>{if(m.start&&!m.paint){if(previous)m.frames.push(now-previous);previous=now;if(m.end&&now>=m.end)m.paint=now;}if(!m.paint)requestAnimationFrame(frame);else requestAnimationFrame(()=>{m.settled=true;observer.disconnect();});};requestAnimationFrame(frame);
      document.querySelector('#route-ports button')!.addEventListener('click',()=>{m.start=performance.now();},{capture:true,once:true});
      const commit=document.querySelector<HTMLButtonElement>('#commit-track')!,mutation=new MutationObserver(()=>{if(m.start&&!commit.disabled){m.end=performance.now();mutation.disconnect();}});mutation.observe(commit,{attributes:true,attributeFilter:['disabled']});
    });
    await page.locator('#route-ports button').first().click();await page.waitForFunction(()=>(window as any).routeMeasurement.settled,{},{timeout:20000});
    const result=await page.evaluate(()=>{const m=(window as any).routeMeasurement,frames=[...m.frames].sort((a:number,b:number)=>a-b),tasks=m.tasks.filter((t:any)=>t.start>=m.start&&t.start<m.end);return {durationMs:m.end-m.start,paintMs:m.paint-m.start,frameP95Ms:frames[Math.floor(frames.length*.95)]??null,maxFrameMs:frames.at(-1)??null,longTasks:tasks,choices:document.querySelectorAll('.route-choice').length,planning:window.__railProbe.planning()};});
    results.push({lesson,run,...result,planning:{...result.planning,draft:undefined}});await context.close();
  }
}finally{await browser.close();}
const report={runtime:process.version,browser:browser.version(),platform:process.platform,architecture:process.arch,cpuRate,viewport:[1440,900],results},output=process.argv[2]??'artifacts/planning-browser.json';mkdirSync(dirname(output),{recursive:true});writeFileSync(output,JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
