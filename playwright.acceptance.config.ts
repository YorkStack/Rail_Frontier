import {defineConfig} from '@playwright/test';

// A fresh, isolated build: never attach acceptance tests to the player's dev server.
const journeys=['menu','tutorial','construction','drawn-route','construction-lessons',
  'station-approaches','route-connections','practice-service','follow-train',
  'draft-persistence','planning-responsiveness','localization-exit','passenger','freight','operations'];
export default defineConfig({
  testDir:'tests/browser',
  testMatch:[...journeys.map(name=>`**/${name}.spec.ts`),'**/novice-*.spec.ts','**/ux-*.spec.ts'],
  timeout:60000,workers:1,fullyParallel:false,retries:0,
  use:{baseURL:'http://127.0.0.1:5180',viewport:{width:1440,height:900},channel:'chrome',headless:true,trace:'retain-on-failure',screenshot:'only-on-failure'},
  outputDir:'artifacts/acceptance/results',
  reporter:[['list'],['html',{outputFolder:'artifacts/acceptance/report',open:'never'}],['junit',{outputFile:'artifacts/acceptance/results.xml'}]],
  webServer:{command:'npm run check && npx vite build --mode test --outDir artifacts/acceptance/site && npx vite preview --outDir artifacts/acceptance/site --host 127.0.0.1 --port 5180 --strictPort',url:'http://127.0.0.1:5180',reuseExistingServer:false,timeout:360000}
});
