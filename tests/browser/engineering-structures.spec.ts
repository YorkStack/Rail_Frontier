import {test,expect,type Page} from '@playwright/test';
import {mkdirSync} from 'node:fs';

async function openPlanner(page:Page):Promise<void> {
  await page.goto('/?skip-menu=1');
  await page.waitForFunction(()=>window.__railProbe?.ready);
  await page.getByRole('button',{name:'Pause',exact:true}).click();
  await page.getByRole('button',{name:'Build tracks'}).click();
  await expect(page.getByRole('region',{name:'Alignment study'})).toBeVisible();
}

test('fixed fjord survey commits its bridge spans to operations and rendering',async({page})=>{
  test.setTimeout(180000);const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));page.on('console',event=>{if(event.type()==='error'||event.type()==='warning')errors.push(event.text());});
  await openPlanner(page);const before=await page.evaluate(()=>({revision:window.__railProbe.snapshot().railway.revision,ledger:window.__railProbe.snapshot().company.ledger.length,stats:window.__railProbe.stats()}));
  await expect(page.getByLabel('Corridor')).toHaveValue('bridge');await expect(page.getByLabel('Track elevation')).toHaveValue('30');await expect(page.locator('#quote-valid')).toContainText('Feasible');await expect(page.locator('#quote-kind')).toContainText('bridge');await expect(page.locator('#engineering-costs')).toContainText('Bridge');
  await page.getByRole('button',{name:'Build this alignment'}).click();await page.waitForFunction(revision=>window.__railProbe.snapshot().railway.revision===revision+1,before.revision);await page.waitForFunction(count=>window.__railProbe.stats().bridgeModules>count,before.stats.bridgeModules);
  const result=await page.evaluate(()=>{const state=window.__railProbe.snapshot(),edge=state.railway.edges.at(-1)!,record=state.operations.infrastructure[edge.id];if(!record)throw new Error('Committed bridge is missing its infrastructure record');return {record,ledger:state.company.ledger.length,stats:window.__railProbe.stats(),edge};});
  expect(result.record.spans.some(span=>span.kind==='bridge'&&span.endM-span.startM>300)).toBe(true);expect(result.record.spans.some(span=>span.kind==='ground')).toBe(true);expect(result.ledger).toBe(before.ledger+1);expect(result.stats.bridgeModules).toBeGreaterThan(before.stats.bridgeModules);expect(result.stats.bridgeAbutments).toBe(before.stats.bridgeAbutments+2);expect(result.stats.tunnelPortals).toBe(before.stats.tunnelPortals);
  await page.evaluate(()=>window.__railProbe.focus({x:2000,y:30,z:3200}));await page.waitForTimeout(800);mkdirSync('artifacts/evidence/con05',{recursive:true});await page.screenshot({path:'artifacts/evidence/con05/committed-bridge.png'});expect(errors).toEqual([]);
});

test('fixed mountain survey commits a bounded tunnel with two visible portals',async({page})=>{
  test.setTimeout(180000);const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));page.on('console',event=>{if(event.type()==='error'||event.type()==='warning')errors.push(event.text());});
  await openPlanner(page);const before=await page.evaluate(()=>({revision:window.__railProbe.snapshot().railway.revision,ledger:window.__railProbe.snapshot().company.ledger.length,stats:window.__railProbe.stats()}));await page.getByLabel('Corridor').selectOption('tunnel');
  await expect(page.getByLabel('Track elevation')).toHaveValue('620');await expect(page.locator('#quote-valid')).toContainText('Feasible');await expect(page.locator('#quote-kind')).toContainText('tunnel');await expect(page.locator('#engineering-costs')).toContainText('Tunnel');
  await page.getByRole('button',{name:'Build this alignment'}).click();await page.waitForFunction(revision=>window.__railProbe.snapshot().railway.revision===revision+1,before.revision);await page.waitForFunction(count=>window.__railProbe.stats().tunnelPortals>count,before.stats.tunnelPortals);
  const result=await page.evaluate(()=>{const state=window.__railProbe.snapshot(),edge=state.railway.edges.at(-1)!,record=state.operations.infrastructure[edge.id];if(!record)throw new Error('Committed tunnel is missing its infrastructure record');return {record,ledger:state.company.ledger.length,stats:window.__railProbe.stats(),edge};});
  expect(result.record.spans[0]?.kind).toBe('ground');expect(result.record.spans.at(-1)?.kind).toBe('ground');expect(result.record.spans.some(span=>span.kind==='tunnel'&&span.endM-span.startM>800)).toBe(true);expect(result.ledger).toBe(before.ledger+1);expect(result.stats.tunnelPortals).toBe(before.stats.tunnelPortals+2);expect(result.stats.bridgeModules).toBe(before.stats.bridgeModules);
  await page.evaluate(()=>window.__railProbe.focus({x:3560,y:620,z:6000}));await page.locator('#world').hover({position:{x:720,y:450}});for(let index=0;index<5;index++)await page.mouse.wheel(0,-500);await page.waitForTimeout(800);mkdirSync('artifacts/evidence/con05',{recursive:true});await page.screenshot({path:'artifacts/evidence/con05/committed-tunnel.png'});expect(errors).toEqual([]);
});
