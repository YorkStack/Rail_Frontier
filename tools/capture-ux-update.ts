import {chromium,expect} from '@playwright/test';
import {mkdir,copyFile} from 'node:fs/promises';
const base=process.env.RAIL_FRONTIER_URL??'http://127.0.0.1:5173',output='artifacts/evidence/ux-update',names:string[]=[];
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1440,height:900}});page.setDefaultTimeout(25000);const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',e=>{if(e.type()==='error')errors.push(e.text());});await mkdir(output,{recursive:true});
 const capture=async(name:string)=>{await page.mouse.move(10,10);await page.waitForTimeout(4500);await page.screenshot({path:`${output}/${name}.png`});names.push(name);};
 await page.goto(`${base}/?lang=de`);await page.waitForFunction(()=>window.__railProbe?.ready);await capture('main-menu-de');
 await page.locator('[data-menu-view=settings]').click();await capture('settings-menu');await page.locator('[data-menu-view=campaign]').click();await page.locator('#choose-new-game').click();await page.locator('#new-game').click();await page.locator('#place-station').click();await capture('station-interface-de');await page.locator('#close-station').click();await page.evaluate(()=>{const p=window.__railProbe.snapshot().towns[0]!.position;window.__railProbe.focus({...p,z:p.z+95});});await capture('village-roads');
 await page.locator('#game-menu-button').click();await page.locator('#leave-game').click();await capture('game-exit-de');
 await page.goto(`${base}/?draw-practice=1&lesson=highland&lang=de`);await expect(page.locator('#planner')).toBeVisible();await page.locator('#route-ports button').first().click();await page.locator('#route-ports button').first().click();await expect(page.locator('#commit-track')).toBeEnabled();await capture('highland-planning-de');
 await page.goto(`${base}/?skip-menu=1&study-corridors=1&lang=de`);await page.waitForFunction(()=>window.__railProbe?.ready);await page.locator('[data-speed="0"]').click();await page.locator('#plan').click();await page.locator('#alignment').selectOption('tunnel');await expect(page.locator('#commit-track')).toBeEnabled();await page.locator('#commit-track').click();await page.evaluate(()=>window.__railProbe.focus({x:3565,y:620,z:6000}));await page.mouse.move(650,350);await page.mouse.down();await page.mouse.move(1050,370,{steps:15});await page.mouse.up();await page.mouse.move(750,470);await page.mouse.wheel(0,-1600);await capture('tunnel-entrance');
 if(errors.length)throw new Error(errors.join('\n'));
}finally{await browser.close();}
// Copy only after every browser session has closed: no HMR during captures.
await mkdir('docs/screenshots',{recursive:true});for(const name of names)await copyFile(`${output}/${name}.png`,`docs/screenshots/${name}.png`);
