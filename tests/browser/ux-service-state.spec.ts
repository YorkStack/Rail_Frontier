import {test,expect} from '@playwright/test';
import {mkdirSync} from 'node:fs';

for(const lang of ['en','de'])test(`assigned service explains pause and resumes after save/load (${lang})`,async({page})=>{
 test.setTimeout(120000);page.setDefaultTimeout(20000);const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`/?draw-practice=1&lang=${lang}`);await expect(page.locator('#planner')).toBeVisible({timeout:30000});
 if(lang==='de')await expect(page.locator('#route-ports button').first()).toHaveText('Von: Sundvik');
 await page.locator('#route-ports button').first().click();if(lang==='de')await expect(page.locator('#route-ports button').first()).toHaveText('Nach: Granli');
 await page.locator('#route-ports button').first().click();await expect(page.locator('#commit-track')).toBeEnabled();await page.locator('#commit-track').click();
 await page.locator('#operations').click();await expect(page.locator('#consist-preview')).toContainText(lang==='de'?'Reisewagen 1':'Coach 1');await page.locator('#purchase-train .office-action').click();await expect(page.locator('#operations-valid')).toContainText(lang==='de'?'gekauft':'purchased');await expect(page.locator('#train-roster')).toContainText(lang==='de'?'2 Reisewagen':'2 coaches');await page.locator('#create-route-action').click();await expect(page.locator('#operations-valid')).toContainText(lang==='de'?'Pendellinie erstellt':'Shuttle route created');await page.locator('#assign-route .office-action').click();
 await expect(page.locator('#service-running strong')).toHaveText(lang==='de'?'Linie zugewiesen · pausiert':'Service assigned · paused');
 await expect(page.locator('#service-guidance')).toContainText(lang==='de'?'Zeit ist angehalten':'Time is paused');
 await expect(page.locator('#service-running-detail')).toContainText(lang==='de'?'Zeit angehalten':'Time is paused');
 await expect(page.locator('#follow-service')).toHaveText(lang==='de'?'Zeit fortsetzen und Zug folgen':'Resume and follow train');
 expect(await page.locator('.service-stage.current>.office-heading').evaluate(el=>getComputedStyle(el,'::after').content)).toContain(lang==='de'?'Aktuell':'Current');
 expect(await page.locator('#route-draft').evaluate(el=>getComputedStyle(el,'::after').content)).toContain(lang==='de'?'Füge mindestens zwei Halte':'Add at least two ordered stops');
 const assigned=await page.evaluate(()=>window.__railProbe.snapshot());expect(assigned.trains).toHaveLength(1);expect(assigned.routes).toHaveLength(1);
 await page.locator('#save').click();await expect(page.locator('#toast')).toContainText(lang==='de'?'gespeichert':'saved');
 await page.goto(`/?lang=${lang}`);await page.waitForFunction(()=>window.__railProbe?.ready);await page.locator('#continue-game').click();await expect(page.locator('#main-menu')).toBeHidden();
 await page.setViewportSize({width:1280,height:720});await page.locator('#operations').click();await expect(page.locator('#service-running')).toBeVisible();await expect(page.locator('#follow-service')).toBeFocused();await expect(page.locator('#follow-service')).toBeInViewport();await expect(page.locator('[data-stage=start]')).toHaveClass(/current/);await expect(page.locator('[data-stage=consist]')).not.toHaveClass(/current/);
 const restored=await page.evaluate(()=>window.__railProbe.snapshot());expect(restored.trains).toEqual(assigned.trains);expect(restored.routes).toEqual(assigned.routes);expect(restored.company).toEqual(assigned.company);
 if(lang==='de'){mkdirSync('artifacts/evidence',{recursive:true});await page.locator('#follow-service').scrollIntoViewIfNeeded();await page.screenshot({path:'artifacts/evidence/ux-service-paused-de.png'});}
 await page.locator('#follow-service').click();await expect(page.locator('#operations-panel')).toBeHidden();await expect(page.locator('#run-state')).toHaveText(lang==='de'?'LÄUFT':'RUNNING');
 await page.waitForFunction(id=>(window.__railProbe.snapshot().operations.trainServices[id]?.distanceM??0)>0,assigned.trains[0]!.id);
 expect(await page.evaluate(()=>window.__railProbe.snapshot().trains.length)).toBe(1);expect(errors).toEqual([]);
});
