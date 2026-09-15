import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir:'tests/browser',timeout:60000,workers:1,fullyParallel:false,
  use:{baseURL:'http://127.0.0.1:5173',viewport:{width:1440,height:900},channel:'chrome',headless:true,trace:'retain-on-failure'},
  outputDir:'artifacts/browser',reporter:'list',
  webServer:{command:'npm run build:test && npm run preview -- --port 5173',url:'http://127.0.0.1:5173',reuseExistingServer:true,timeout:30000}
});
