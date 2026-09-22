import {SettlementNavigator} from '../../src/world/settlement-navigation.js';
import {test,expect} from '@playwright/test';
import {mkdirSync} from 'node:fs';

test('town paths reach authored house doors and rotated station access survives saving',async({page})=>{
 test.setTimeout(120000);const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));page.on('console',message=>{if(message.type()==='error')errors.push(message.text());});
 await page.goto('/?lang=de');await page.waitForFunction(()=>window.__railProbe?.ready);
 await page.locator('#choose-new-game').click();await page.locator('#new-game').click();await expect(page.locator('#main-menu')).toBeHidden();
 const before=await page.evaluate(()=>window.__railProbe.settlementAccess());expect(Object.entries(before.access).filter(([id])=>id.startsWith('building:'))).toHaveLength(45);expect(Object.values(before.access).every(s=>s==='connected')).toBe(true);
 await page.locator('#place-station').click();await page.locator('#station-orientation').fill('55');await page.locator('#commit-station').click();
 await expect.poll(()=>page.evaluate(()=>window.__railProbe.snapshot().stations.length)).toBe(1);
 const state=await page.evaluate(()=>window.__railProbe.snapshot()),access=await page.evaluate(()=>window.__railProbe.settlementAccess());expect(access.access[state.stations[0]!.id]).toBe('connected');
 await page.locator('#save').click();await expect(page.locator('#toast')).toContainText('gespeichert');await page.reload();await page.waitForFunction(()=>window.__railProbe?.ready);await page.locator('#continue-game').click();await expect(page.locator('#main-menu')).toBeHidden();
 expect(await page.evaluate(()=>window.__railProbe.settlementAccess())).toEqual(access);
 const navigation=new SettlementNavigator(access.navigation);for(const [id,status] of Object.entries(access.access))if(status==='connected')expect(navigation.routeToTown(id),id).not.toBeNull();const house=Object.entries(access.navigation.entrances).find(([id,e])=>e.kind==='house'&&e.townId===state.stations[0]!.townId&&access.access[id]==='connected')!;expect(navigation.route(house[0],state.stations[0]!.id)).not.toBeNull();
 const center=state.railway.nodes.find(n=>n.id===state.stations[0]!.nodeId)!.position;await page.evaluate(p=>window.__railProbe.focus(p),{x:center.x+25,y:center.y,z:center.z+85});await expect(page.locator('#toast')).not.toHaveClass(/visible/);await page.waitForTimeout(800);
 mkdirSync('artifacts/evidence',{recursive:true});await page.screenshot({path:'artifacts/evidence/connected-town-paths.png'});
 const angle=55*Math.PI/180,building={x:center.x+Math.cos(angle)*10.4-Math.sin(angle)*1.5,y:center.y+3,z:center.z-Math.sin(angle)*10.4-Math.cos(angle)*1.5};const screen=await page.evaluate(p=>window.__railProbe.project(p),building);await page.mouse.click(screen.x,screen.y);await expect(page.locator('#context-panel')).toBeVisible();await expect(page.locator('#context-panel')).toContainText('Mit dem Ortswegenetz verbunden');await expect(page.locator('#context-panel')).toContainText('weiterhin über den Einzugsbereich');
 await page.locator('#close-context').click();
 for(const [index,name] of [[1,'granli'],[2,'fjellhavn']] as const){await page.evaluate(p=>window.__railProbe.focus(p),state.towns[index]!.position);await page.waitForTimeout(600);await page.screenshot({path:`artifacts/evidence/${name}-connected-paths.png`});}
 await page.goto('/?lang=en');await page.waitForFunction(()=>window.__railProbe?.ready);await page.locator('#continue-game').click();await expect(page.locator('#main-menu')).toBeHidden();await page.evaluate(p=>window.__railProbe.focus(p),center);await page.waitForTimeout(500);const englishScreen=await page.evaluate(p=>window.__railProbe.project(p),building);await page.mouse.click(englishScreen.x,englishScreen.y);await expect(page.locator('#context-panel')).toContainText('Connected to the town paths');await expect(page.locator('#context-panel')).toContainText('Passenger demand still uses the station catchment.');
 expect(errors).toEqual([]);
});

test('Arizona streets connect residential and commercial doors without roads through buildings',async({page})=>{
 test.setTimeout(120000);await page.goto('/?skip-menu=1&world=arizona');await page.waitForFunction(()=>window.__railProbe?.ready);
 const paths=await page.evaluate(()=>window.__railProbe.settlementAccess());expect(Object.keys(paths.access).length).toBeGreaterThan(120);expect(Object.values(paths.access).every(v=>v==='connected')).toBe(true);const navigation=new SettlementNavigator(paths.navigation);for(const id of Object.keys(paths.access))expect(navigation.routeToTown(id),id).not.toBeNull();
 await page.evaluate(()=>window.__railProbe.cameraPreset('street'));await page.waitForTimeout(600);mkdirSync('artifacts/evidence',{recursive:true});await page.screenshot({path:'artifacts/evidence/arizona-connected-paths.png'});
});
