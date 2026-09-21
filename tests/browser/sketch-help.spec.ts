import {test,expect} from '@playwright/test';
import {mkdirSync} from 'node:fs';

test('crossed sketch explains the problem, focuses an editable point and recovers through keyboard and undo',async({page})=>{
  test.setTimeout(120000);const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setViewportSize({width:1280,height:720});
  await page.goto('/?draw-practice=1&lang=de');await expect(page.locator('#planner')).toBeVisible({timeout:30000});
  const before=await page.evaluate(()=>window.__railProbe.snapshot());
  const ports=await page.evaluate(()=>{const s=window.__railProbe.snapshot();return s.stations.map((station,i)=>{if(station.layout.kind!=='single-platform')throw new Error('Missing ports');const nodeId=station.layout.ports[i===0?1:0]!.nodeId;return s.railway.nodes.find(n=>n.id===nodeId)!.position;});});
  const a=ports[0]!,b=ports[1]!,dx=b.x-a.x,dz=b.z-a.z,length=Math.hypot(dx,dz),points=[.72,.28].map(f=>({x:a.x+dx*f-dz/length*180,y:a.y+(b.y-a.y)*f,z:a.z+dz*f+dx/length*180}));
  await page.getByRole('button',{name:'Start hier · Sundvik',exact:true}).click();
  for(const point of points){const screen=await page.evaluate(p=>window.__railProbe.project(p),point);await page.mouse.click(screen.x,screen.y);}
  await page.getByRole('button',{name:'Ziel hier · Granli',exact:true}).click();
  await expect(page.locator('#route-help')).toHaveAttribute('data-kind','crossing');
  await expect(page.locator('#route-help strong')).toHaveText('Deine Zeichnung kreuzt sich selbst');
  await expect(page.locator('#commit-track')).toBeDisabled();await expect(page.locator('#retry-corridor')).toBeHidden();
  await expect(page.locator('.sketch-issue-marker')).toBeVisible();
  await expect(page.locator('#route-help button')).toBeInViewport();
  expect((await page.evaluate(()=>window.__railProbe.planning())).requests).toBe(0);
  await expect(page.locator('#alignment-steps [aria-current]')).toContainText('Weg zeichnen');
  await expect(page.locator('#toast')).not.toHaveClass(/visible/,{timeout:10000});
  mkdirSync('artifacts/evidence/sketch-help',{recursive:true});await page.screenshot({path:'artifacts/evidence/sketch-help/crossing-de.png'});
  await page.locator('#game-menu-button').click();await page.locator('#menu-settings-button').click();await page.locator('#language-setting').selectOption('en');await page.locator('#close-menu').click();
  if(!await page.locator('#planner').isVisible())await page.locator('#plan').click();
  await expect(page.locator('#route-help strong')).toHaveText('Your sketch crosses itself');await expect(page.locator('.sketch-issue-marker')).toContainText('Crossing');
  await page.locator('#route-help button').click();await expect(page.locator('.route-handle:focus')).toHaveCount(1);await expect(page.locator('.route-handle:focus')).toBeInViewport();
  await page.keyboard.press('Delete');await expect(page.locator('#route-help')).toBeHidden();await expect(page.locator('.sketch-issue-marker')).toHaveCount(0);
  await page.locator('#undo-waypoint').click();await expect(page.locator('#route-help')).toHaveAttribute('data-kind','crossing');
  await page.locator('#redo-waypoint').click();await expect(page.locator('#commit-track')).toBeEnabled({timeout:20000});
  const after=await page.evaluate(()=>window.__railProbe.snapshot());expect(after.company.cash).toBe(before.company.cash);expect(after.railway).toEqual(before.railway);expect(errors).toEqual([]);
});
