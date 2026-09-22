import { expect,test } from '@playwright/test';

test('commissioned Norway line carries timber through the sawmill to town',async({page})=>{
  test.setTimeout(160000);const errors:string[]=[];page.on('console',message=>{if(message.type()==='error')errors.push(message.text());});page.on('pageerror',error=>errors.push(error.message));await page.goto('/?skip-menu');await page.waitForFunction(()=>window.__railProbe?.ready===true);
  await page.getByRole('button',{name:'Trains & lines'}).click();
  const setup=await page.evaluate(()=>{const state=window.__railProbe.snapshot(),byTown=(townId:string)=>state.stations.find(station=>station.townId===townId)!.id;return {granli:byTown('town:3'),sundvik:byTown('town:2')};});
  await page.locator('#purchase-station').selectOption(setup.granli);await page.locator('#consist-kind').selectOption('freight');await page.locator('#coach-count').selectOption('1');await page.getByRole('button',{name:'Buy consist'}).click();
  const trainId=await page.evaluate(()=>window.__railProbe.snapshot().trains.find(train=>train.vehicleIds.includes('fjord-freight-wagon'))!.id);
  for(const station of [setup.granli,setup.sundvik]){await page.getByLabel('Next ordered stop').selectOption(station);await page.getByRole('button',{name:'Add stop'}).click();}await page.getByRole('button',{name:'Create route'}).click();
  const routeId=await page.evaluate(()=>window.__railProbe.snapshot().routes.at(-1)!.id);await page.locator('#assign-train').selectOption(trainId);await page.locator('#assign-route-select').selectOption(routeId);await page.getByRole('button',{name:'Assign service'}).click();
  await expect(page.locator('#train-roster')).toContainText('40 t timber');await page.getByRole('button',{name:'Close railway operations'}).click();await page.getByRole('button',{name:'8×',exact:true}).click();
  await page.waitForFunction(()=>{const probe=window.__railProbe;if(!probe)return false;const state=probe.snapshot();return state.operations.delivered.timber>=40&&state.operations.delivered.lumber>=14;},null,{timeout:140000});await page.getByRole('button',{name:'Pause',exact:true}).click();
  await page.getByRole('button',{name:'Trains & lines'}).click();await expect(page.locator('#industry-list')).toContainText('Granli Forest');await expect(page.locator('#industry-list')).toContainText('Sundvik Sawmill');
  const state=await page.evaluate(()=>window.__railProbe.snapshot());expect(state.company.ledger.filter(entry=>entry.category==='freight')).toHaveLength(2);expect(state.company.cash).toBe(state.company.openingCash+state.company.ledger.reduce((sum,entry)=>sum+entry.amount,0));expect(errors).toEqual([]);
});
