import {test,expect} from '@playwright/test';
import {mkdirSync} from 'node:fs';

test('German menu, tutorial and dynamic controls switch to English without changing the company',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/?lang=de');await page.waitForFunction(()=>window.__railProbe?.ready);
 await expect(page.getByRole('heading',{name:'Die Nordbahn'})).toBeVisible();await expect(page.locator('#continue-game')).toBeHidden();
 mkdirSync('artifacts/evidence/ux-language',{recursive:true});await page.screenshot({path:'artifacts/evidence/ux-language/menu-de.png'});
 await page.locator('#choose-new-game').click();await page.locator('#new-game').click();await expect(page.locator('#tutorial-title')).toHaveText('Baue den ersten Bahnhof in Sundvik');
 await expect(page.locator('#tutorial-instruction')).toContainText('Öffne „Bahnhöfe“');await expect(page.locator('#tutorial-instruction')).toContainText('Das Spiel pausiert während des Baus.');
 await page.locator('#place-station').click();await expect(page.locator('#station-planner h2')).toHaveText('Beginne mit einem Bahnhof.');await expect(page.locator('#commit-station')).toBeInViewport();await expect(page.locator('#station-valid')).toBeInViewport();await expect(page.locator('#station-valid')).toContainText('Baubereit');
 await page.screenshot({path:'artifacts/evidence/ux-language/station-de.png'});
 await page.locator('#station-class').selectOption('small-station');const before=await page.evaluate(()=>window.__railProbe.snapshot());
 await page.locator('#game-menu-button').click();await page.locator('#menu-settings-button').click();await page.locator('#language-setting').selectOption('en');
 await expect(page.locator('html')).toHaveAttribute('lang','en');await expect(page.locator('#menu-settings h2')).toHaveText('Landscape & motion');await page.locator('#close-menu').click();
 await expect(page.locator('#tutorial-title')).toHaveText('Build the first station in Sundvik');await expect(page.locator('#tutorial-instruction')).toContainText('Open Build station');await page.locator('#place-station').click();await expect(page.locator('#station-planner h2')).toHaveText('Begin with a station.');await expect(page.locator('#station-class')).toHaveValue('small-station');
 const after=await page.evaluate(()=>window.__railProbe.snapshot());expect(after.company).toEqual(before.company);expect(after.railway).toEqual(before.railway);expect(after.learning).toEqual(before.learning);expect(errors).toEqual([]);
});

test('exit pauses, cancels, handles save failures and resumes the saved company',async({page})=>{
 await page.goto('/?lang=de');await page.waitForFunction(()=>window.__railProbe?.ready);await page.locator('#choose-new-game').click();await page.locator('#free-game').click();await page.locator('[data-speed="0"]').click();
 const before=await page.evaluate(()=>window.__railProbe.snapshot());
 await page.locator('#game-menu-button').click();await page.locator('#game-dialog button[value=resume]').last().click();await expect(page.locator('#game-dialog')).not.toBeVisible();
 await page.locator('#game-menu-button').click();await page.locator('#leave-game').click();await expect(page.locator('#exit-dialog')).toBeVisible();await page.screenshot({path:'artifacts/evidence/ux-language/exit-de.png'});
 await page.keyboard.press('Escape');await expect(page.locator('#exit-dialog')).not.toBeVisible();expect(await page.evaluate(()=>window.__railProbe.snapshot().company.cash)).toBe(before.company.cash);
 await page.locator('#game-menu-button').click();await page.locator('#leave-game').click();
 await page.evaluate(()=>{const original=IDBDatabase.prototype.transaction;IDBDatabase.prototype.transaction=function(...args:Parameters<typeof original>){if(args[1]==='readwrite')throw new Error('simulated full disk');return original.apply(this,args);};(window as unknown as {restoreStorage:()=>void}).restoreStorage=()=>{IDBDatabase.prototype.transaction=original;};});
 await page.locator('#save-and-leave').click();await expect(page.locator('#exit-error')).toContainText('Speichern fehlgeschlagen');await expect(page.locator('#main-menu')).toBeHidden();expect(await page.evaluate(()=>window.__railProbe.snapshot().company.cash)).toBe(before.company.cash);
 await page.evaluate(()=>(window as unknown as {restoreStorage:()=>void}).restoreStorage());await page.locator('#save-and-leave').click();await expect(page.locator('#main-menu')).toBeVisible();await expect(page.locator('#continue-game')).toBeVisible();await page.locator('#continue-game').click();await expect(page.locator('#main-menu')).toBeHidden();expect(await page.evaluate(()=>window.__railProbe.snapshot().company.cash)).toBe(before.company.cash);
 await page.locator('#game-menu-button').click();await expect(page.locator('#last-save-time')).toContainText('Zuletzt gespeichert:');await page.locator('#leave-game').click();await page.locator('#leave-without-save').click();await expect(page.locator('#main-menu')).toBeVisible();
});
