import {expect,test} from '@playwright/test';

test('V1 load replaces the scene on one WebGL context and preserves a live session on rejection',async({page})=>{
  const errors:string[]=[];
  page.on('pageerror',error=>errors.push(error.message));
  page.on('console',message=>{if(message.type()==='error'||message.type()==='warning')errors.push(message.text());});
  await page.addInitScript(()=>{
    const original=HTMLCanvasElement.prototype.getContext,seen=new WeakSet<object>();
    Object.defineProperty(window,'__webglContextCount',{value:()=>contextCount,configurable:true});let contextCount=0;
    HTMLCanvasElement.prototype.getContext=function(...args:Parameters<HTMLCanvasElement['getContext']>){const result=original.apply(this,args) as RenderingContext|null;if(result&&String(args[0]).startsWith('webgl')&&!seen.has(result)){seen.add(result);contextCount++;}return result as never;};
  });
  await page.goto('/?skip-menu=1&world=v1');await page.waitForFunction(()=>window.__railProbe?.ready===true);
  await page.getByRole('button',{name:'Pause',exact:true}).click();
  await page.getByRole('button',{name:'Save study',exact:true}).click();await expect(page.getByRole('status')).toContainText('Study saved');
  const saved=await page.evaluate(()=>window.__railProbe.snapshot());
  expect(saved.campaignVersion).toBe(1);expect(saved.world.generatorVersion).toBe(1);
  const contextCount=await page.evaluate(()=>(window as unknown as {__webglContextCount():number}).__webglContextCount());expect(contextCount).toBe(1);
  await page.getByRole('button',{name:'Open main menu'}).click();await page.getByRole('button',{name:/Start new company/}).click();
  await page.waitForFunction(()=>window.__railProbe.snapshot().world.generatorVersion===2);expect((await page.evaluate(()=>window.__railProbe.snapshot())).campaignVersion).toBe(2);
  expect(await page.evaluate(()=>(window as unknown as {__webglContextCount():number}).__webglContextCount())).toBe(1);
  await page.getByRole('button',{name:'Load study',exact:true}).click();await expect(page.getByRole('status')).toContainText('Study resumed');
  expect(await page.evaluate(()=>window.__railProbe.snapshot())).toEqual(saved);
  expect(await page.evaluate(()=>(window as unknown as {__webglContextCount():number}).__webglContextCount())).toBe(1);
  expect(await page.evaluate(()=>window.__railProbe.stats().contextLost)).toBe(false);

  await page.evaluate(async()=>{
    const db=await new Promise<IDBDatabase>((resolve,reject)=>{const request=indexedDB.open('rail-frontier',1);request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});
    const tx=db.transaction('slots','readwrite'),store=tx.objectStore('slots'),slot=await new Promise<Record<string,unknown>>((resolve,reject)=>{const request=store.get('study');request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});
    const envelope=JSON.parse(slot.json as string);envelope.state.campaignVersion=99;slot.json=JSON.stringify(envelope);store.put(slot);
    await new Promise<void>((resolve,reject)=>{tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);});db.close();
  });
  const beforeRejectedLoad=await page.evaluate(()=>window.__railProbe.snapshot());
  await page.getByRole('button',{name:'Load study',exact:true}).click();await expect(page.getByRole('status')).toContainText('Unsupported campaign content');
  expect(await page.evaluate(()=>window.__railProbe.snapshot())).toEqual(beforeRejectedLoad);
  expect(await page.evaluate(()=>(window as unknown as {__webglContextCount():number}).__webglContextCount())).toBe(1);
  expect(errors).toEqual([]);
});
