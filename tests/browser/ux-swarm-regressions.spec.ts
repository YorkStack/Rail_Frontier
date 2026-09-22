import {test,expect} from '@playwright/test';
import {mkdirSync} from 'node:fs';

async function startCompany(page:import('@playwright/test').Page,scale='1'){
 await page.goto('/?lang=de');await page.waitForFunction(()=>window.__railProbe?.ready);
 if(scale!=='1'){await page.locator('[data-menu-view=settings]').click();await page.locator('#ui-scale-setting').selectOption(scale);await page.locator('[data-menu-view=campaign]').click();}
 await page.locator('#choose-new-game').click();await page.locator('#new-game').click();await expect(page.locator('#main-menu')).toBeHidden();
}

test('physical station expansion is explained before an unavailable upgrade can be purchased',async({page})=>{
 await startCompany(page);await page.locator('#place-station').click();await page.locator('#commit-station').click();
 const before=await page.evaluate(()=>window.__railProbe.snapshot());await page.locator('#company-office').click();
 await page.locator('#upgrade-station-valid').scrollIntoViewIfNeeded();await expect(page.locator('#upgrade-station-valid')).toContainText('Umbau');await expect(page.locator('#upgrade-station-action')).toBeDisabled();
 await page.locator('#upgrade-class-id').selectOption('major-terminal');await expect(page.locator('#upgrade-station-action')).toBeDisabled();
 const after=await page.evaluate(()=>window.__railProbe.snapshot());expect(after.stations).toEqual(before.stations);expect(after.company).toEqual(before.company);
});

test('large German interface keeps objectives clear of the clock and station controls scrollable',async({page})=>{
 await page.setViewportSize({width:1280,height:720});await startCompany(page,'1.5');
 const positions=await page.evaluate(()=>{const rect=(selector:string)=>{const r=document.querySelector(selector)!.getBoundingClientRect();return{top:r.top,bottom:r.bottom,right:r.right};};return{objectives:rect('.objective-card'),clock:rect('.clock-deck'),cash:rect('.company-strip')};});
 expect(positions.objectives.top).toBeGreaterThanOrEqual(positions.cash.bottom+8);expect(positions.objectives.bottom).toBeLessThanOrEqual(positions.clock.top-8);
 for(const row of await page.locator('.objective-row').all())await expect(row).toBeInViewport();
 await page.locator('#place-station').click();await expect(page.locator('#station-planner .tool-balance')).toContainText('5.000.000');const body=await page.locator('.station-planner-body').boundingBox();expect(body!.height).toBeGreaterThanOrEqual(180);
 await page.locator('#station-turn-right').scrollIntoViewIfNeeded();await expect(page.locator('#station-turn-right')).toBeInViewport();await page.locator('#station-turn-right').click();await expect(page.locator('#station-orientation')).toHaveValue('15');await expect(page.locator('#commit-station')).toBeInViewport();
 await expect(page.locator('#toast')).not.toHaveClass(/visible/);mkdirSync('artifacts/evidence/swarm',{recursive:true});await page.screenshot({path:'artifacts/evidence/swarm/large-station-controls.png'});
});

test('archive actions honor large interface text and stay usable',async({page})=>{
 await page.setViewportSize({width:1280,height:720});await page.goto('/?lang=de');await page.waitForFunction(()=>window.__railProbe?.ready);
 await page.locator('[data-menu-view=settings]').click();await page.locator('#ui-scale-setting').selectOption('1.5');await page.locator('[data-menu-view=saves]').click();
 const controls=page.locator('#new-save-slot button');await controls.scrollIntoViewIfNeeded();
 expect(await controls.evaluate(el=>parseFloat(getComputedStyle(el).fontSize))).toBeGreaterThanOrEqual(20);await expect(controls).toBeInViewport();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test('existing assigned trains remain selectable without buying another train',async({page})=>{
 await page.goto('/?skip-menu=1&lang=en');await page.waitForFunction(()=>window.__railProbe?.ready);
 await page.getByRole('button',{name:'Pause',exact:true}).click();await page.locator('#operations').click();
 await expect(page.locator('#assign-route')).toBeHidden();await page.locator('#manage-service').click();await expect(page.locator('#assign-train')).toBeVisible();await expect(page.locator('#assign-train')).toBeFocused();
 await expect(page.locator('#assignment-guidance')).toContainText('Pausing time alone');await expect(page.locator('#assign-route button')).toBeDisabled();
 expect(await page.locator('#assign-train option').count()).toBe(await page.evaluate(()=>window.__railProbe.snapshot().trains.length));
});

test('saved railway survives leaving, a practice company and its quick save',async({page})=>{
 test.setTimeout(120000);await startCompany(page);await page.locator('#place-station').click();await page.locator('#commit-station').click();
 const original=await page.evaluate(()=>window.__railProbe.snapshot());
 await page.locator('#game-menu-button').click();await page.locator('#leave-game').click();await page.locator('#save-and-leave').click();await expect(page.locator('#main-menu')).toBeVisible();
 // Reload reproduces the inactive-company path, not just an in-game practice switch.
 await page.reload();await page.waitForFunction(()=>window.__railProbe?.ready);await page.locator('#choose-practice').click();await page.locator('#try-drawing').click();await expect(page.locator('#planner')).toBeVisible();
 await page.locator('#close-planner').click();await page.locator('#game-menu-button').click();await page.locator('#leave-game').click();await page.locator('#save-and-leave').click();await expect(page.locator('#main-menu')).toBeVisible();
 await page.locator('[data-menu-view=saves]').click();const originalSlot=page.locator('.save-slot').filter({hasText:'Norwegian Fjords company'});await expect(originalSlot).toHaveCount(1);await originalSlot.getByRole('button',{name:'Fortsetzen',exact:true}).click();await expect(page.locator('#main-menu')).toBeHidden();
 const restored=await page.evaluate(()=>window.__railProbe.snapshot());expect(restored.company).toEqual(original.company);expect(restored.stations).toEqual(JSON.parse(JSON.stringify(original.stations)));expect(restored.railway).toEqual(JSON.parse(JSON.stringify(original.railway)));
});

test('rapid station and track confirmations spend once and cancelled planning stays cancelled',async({page})=>{
 test.setTimeout(120000);await startCompany(page);await page.locator('#place-station').click();
 const beforeStation=await page.evaluate(()=>window.__railProbe.snapshot());await page.locator('#commit-station').click({clickCount:3,delay:20});
 const station=await page.evaluate(()=>window.__railProbe.snapshot());expect(station.stations.length-beforeStation.stations.length).toBe(1);expect(station.company.ledger.length-beforeStation.company.ledger.length).toBe(1);
 await page.goto('/?draw-practice=1&lang=en');await expect(page.locator('#planner')).toBeVisible();const before=await page.evaluate(()=>window.__railProbe.snapshot());
 for(let attempt=0;attempt<2;attempt++){
  await page.locator('#route-ports button').first().click();await page.locator('#route-ports button').first().click();await page.locator('#clear-alignment').click();
  await expect(page.locator('#planner')).toHaveAttribute('data-phase','start');await expect(page.locator('#commit-track')).toBeDisabled();
 }
 await page.locator('#route-ports button').first().click();await page.locator('#route-ports button').first().click();await expect(page.locator('#commit-track')).toBeEnabled({timeout:30000});
 const cost=Number(await page.locator('#quote-cost').getAttribute('data-cost'));await page.locator('#commit-track').click({clickCount:4,delay:10});
 const after=await page.evaluate(()=>window.__railProbe.snapshot());expect(after.railway.revision).toBe(before.railway.revision+1);expect(after.company.ledger.length).toBe(before.company.ledger.length+1);expect(Math.abs(before.company.cash-after.company.cash-cost)).toBeLessThanOrEqual(50);
});

test('the first guided track plan frames both built stations inside the map beside the panel',async({page})=>{
 await startCompany(page);await page.locator('#tutorial-action').click();await page.locator('#commit-station').click();await expect(page.locator('#tutorial-step')).toContainText('2');await page.locator('#tutorial-action').click();await page.locator('#commit-station').click();await expect(page.locator('#tutorial-step')).toContainText('3');await page.locator('#tutorial-action').click();
 const locations=await page.evaluate(()=>{const s=window.__railProbe.snapshot();return s.stations.map(station=>window.__railProbe.project(s.railway.nodes.find(n=>n.id===station.nodeId)!.position));});const panel=await page.locator('#planner').boundingBox();
 for(const location of locations){expect(location.visible).toBe(true);expect(location.x).toBeGreaterThan(50);expect(location.x).toBeLessThan(panel!.x-50);expect(location.y).toBeGreaterThan(100);expect(location.y).toBeLessThan(700);}
});

test('a disconnected route keeps its stops and explains rejection at the attempted action',async({page})=>{
 await startCompany(page);await page.locator('#tutorial-action').click();await page.locator('#commit-station').click();await page.locator('#tutorial-action').click();await page.locator('#commit-station').click();await page.locator('#operations').click();
 const stations=await page.evaluate(()=>window.__railProbe.snapshot().stations.map(s=>s.id));for(const station of stations){await page.locator('#route-next-stop').selectOption(station);await page.locator('#route-add-stop').click();}
 const before=await page.evaluate(()=>window.__railProbe.snapshot());await page.locator('#create-route-action').click();await expect(page.locator('#create-route #operations-valid')).toBeFocused();await expect(page.locator('#operations-valid')).toBeInViewport();await expect(page.locator('#operations-valid')).toContainText('verbunden');await expect(page.locator('#route-draft li')).toHaveCount(2);
 expect(await page.evaluate(()=>window.__railProbe.snapshot())).toEqual(before);
});

test('company and train tools switch directly instead of requiring a second click',async({page})=>{
 await page.goto('/?skip-menu=1&lang=en');await page.waitForFunction(()=>window.__railProbe?.ready);await page.locator('[data-speed="0"]').click();
 for(let i=0;i<2;i++){
  await page.locator('#company-office').click();await expect(page.locator('#operations-panel')).toHaveAttribute('data-mode','office');await expect(page.locator('#company-report')).toBeVisible();
  await page.locator('#operations').click();await expect(page.locator('#operations-panel')).toBeVisible();await expect(page.locator('#operations-panel h2')).toHaveText('Run the service.');await expect(page.locator('#service-running')).toBeVisible();await expect(page.locator('#operations')).toHaveAttribute('aria-expanded','true');await expect(page.locator('#company-office')).toHaveAttribute('aria-expanded','false');
 }
 await page.locator('#operations').click();await expect(page.locator('#operations-panel')).toBeHidden();
});

test('narrow 150% station planning retains usable space for placement controls',async({page})=>{
 await page.setViewportSize({width:390,height:844});await startCompany(page,'1.5');await page.locator('#place-station').click();
 const body=await page.locator('.station-planner-body').boundingBox();expect(body!.height).toBeGreaterThanOrEqual(180);await page.locator('#station-turn-right').scrollIntoViewIfNeeded();await expect(page.locator('#station-turn-right')).toBeInViewport();await page.locator('#station-turn-right').click();await expect(page.locator('#station-orientation')).toHaveValue('15');await expect(page.locator('#commit-station')).toBeInViewport();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test('an input-starved sawmill explains the required freight in the office and world detail',async({page})=>{
 await startCompany(page);await page.locator('#company-office').click();const mill=page.locator('#industry-list button').filter({hasText:'Sundvik Sawmill'});await expect(mill).toContainText('Wartet auf 10 t Holz');await expect(mill).toContainText('10 t Holz → 7 t Bretter');await mill.click();await expect(page.locator('#context-panel')).toContainText('Wartet auf 10 t Holz');await expect(page.locator('#context-panel')).toContainText('10 t Holz → 7 t Bretter');
});
