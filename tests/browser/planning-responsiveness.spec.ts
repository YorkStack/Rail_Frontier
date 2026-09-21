import {test,expect} from '@playwright/test';

test('editing during live cost validation discards stale results and leaves the next plan usable',async({page,context})=>{
  const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto('/?draw-practice=1&lang=en');await page.waitForFunction(()=>window.__railProbe?.ready);await expect(page.locator('#planner')).toBeVisible();await expect(page.locator('#route-ports button')).toHaveCount(2);
  const before=await page.evaluate(()=>window.__railProbe.snapshot()),session=await context.newCDPSession(page);
  await session.send('Emulation.setCPUThrottlingRate',{rate:4});
  await page.locator('#route-ports button').first().click();
  await page.evaluate(()=>{
    const status=document.querySelector('#quote-valid')!,observer=new MutationObserver(()=>{
      if(status.textContent!=='Checking construction costs…')return;
      observer.disconnect();
      // Queue a real Restart action after the first validation slice yields.
      setTimeout(()=>document.querySelector<HTMLButtonElement>('#clear-alignment')!.click(),0);
    });observer.observe(status,{childList:true,subtree:true,characterData:true});
  });
  await page.locator('#route-ports button').first().click();
  await page.waitForFunction(()=>window.__railProbe.planning().discarded>0);
  await expect(page.locator('#planner')).toHaveAttribute('data-phase','start');
  await expect(page.locator('#route-choices')).toHaveAttribute('aria-busy','false');
  await expect(page.locator('#commit-track')).toBeDisabled();await expect(page.locator('.route-choice')).toHaveCount(0);
  expect((await page.evaluate(()=>window.__railProbe.planning())).accepted).toBe(0);
  expect(await page.evaluate(()=>window.__railProbe.snapshot())).toEqual(before);
  await session.send('Emulation.setCPUThrottlingRate',{rate:1});
  await page.locator('#route-ports button').first().click();await page.locator('#route-ports button').first().click();
  await expect(page.locator('#commit-track')).toBeEnabled();await expect(page.locator('#route-choices')).toHaveAttribute('aria-busy','false');
  expect((await page.evaluate(()=>window.__railProbe.planning())).accepted).toBe(1);expect(errors).toEqual([]);
});
