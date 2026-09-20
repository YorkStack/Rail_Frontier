import {chromium,type Page} from '@playwright/test';
import {mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';

const baseUrl=process.env.RAIL_FRONTIER_URL??'http://127.0.0.1:5173';
const outputDirectory=resolve('docs/screenshots');
const errors:string[]=[];

const settle=async(page:Page)=>{
  await page.waitForTimeout(500);
  await page.evaluate(()=>new Promise<void>(done=>requestAnimationFrame(()=>requestAnimationFrame(()=>done()))));
};

const browser=await chromium.launch({channel:'chrome',headless:true});
try{
  const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
  page.on('pageerror',error=>errors.push(error.message));
  page.on('console',message=>{
    if(message.type()==='error'||message.type()==='warning')errors.push(message.text());
  });
  await page.goto(`${baseUrl}/?skip-menu=1&study-corridors=1`,{waitUntil:'networkidle'});
  await page.waitForFunction(()=>window.__railProbe?.ready===true);
  await page.evaluate(()=>window.__railProbe.setSpeed(0));
  await page.waitForTimeout(4400);
  await mkdir(outputDirectory,{recursive:true});

  const capture=async(name:string,preset:'regional'|'train'|'station')=>{
    await page.evaluate(value=>window.__railProbe.cameraPreset(value),preset);
    await settle(page);
    await page.screenshot({path:resolve(outputDirectory,name),fullPage:true});
  };

  await capture('norway-landscape-hud.png','regional');
  await capture('train-service.png','train');
  await capture('sundvik-station.png','station');

  await page.locator('#operations').click();
  await expectVisible(page,'#consist-preview');
  await page.locator('#operations-panel').evaluate(element=>{element.scrollTop=0;});
  await settle(page);
  await page.screenshot({path:resolve(outputDirectory,'first-service-builder.png'),fullPage:true});
  await page.getByRole('button',{name:'Close railway operations'}).click();

  await page.evaluate(()=>window.__railProbe.cameraPreset('regional'));
  await page.locator('#plan').click();
  await page.locator('#alignment').selectOption('bridge',{force:true});
  await expectVisible(page,'#engineering-review');await page.locator('#engineering-review').evaluate((node:HTMLDetailsElement)=>node.open=true);
  await page.locator('#engineering-profile').scrollIntoViewIfNeeded();
  await settle(page);
  await page.screenshot({path:resolve(outputDirectory,'alignment-engineering.png'),fullPage:true});
  await page.getByRole('button',{name:'Close alignment study'}).click();

  await page.locator('#open-menu').click();
  await page.locator('[data-menu-view="settings"]').click();
  await settle(page);
  await page.screenshot({path:resolve(outputDirectory,'settings-menu.png'),fullPage:true});

  await page.goto(`${baseUrl}/`,{waitUntil:'networkidle'});
  await page.waitForFunction(()=>window.__railProbe?.ready===true);
  await page.getByRole('button',{name:/Start new company/}).click();
  await expectVisible(page,'#tutorial-card');
  await page.evaluate(()=>window.__railProbe.cameraPreset('regional'));
  await settle(page);
  await page.screenshot({path:resolve(outputDirectory,'guided-introduction.png'),fullPage:true});

  await page.goto(`${baseUrl}/?skip-menu=1&world=arizona`,{waitUntil:'networkidle'});
  await page.waitForFunction(()=>window.__railProbe?.ready===true);
  await page.evaluate(()=>{window.__railProbe.setSpeed(0);window.__railProbe.cameraPreset('street');});
  await settle(page);
  await page.screenshot({path:resolve(outputDirectory,'arizona-street.png'),fullPage:true});
  await page.evaluate(()=>window.__railProbe.cameraPreset('canyon'));
  await settle(page);
  await page.screenshot({path:resolve(outputDirectory,'arizona-canyon.png'),fullPage:true});

  if(errors.length>0)throw new Error(`Browser reported errors:\n${errors.join('\n')}`);
  console.log(`Captured nine README screenshots in ${outputDirectory}`);
}finally{
  await browser.close();
}

async function expectVisible(page:Page,selector:string):Promise<void>{await page.locator(selector).waitFor({state:'visible'});}
