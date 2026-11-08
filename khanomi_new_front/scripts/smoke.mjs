import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', headless: true, args: ['--no-sandbox'] });
try {
 const page = await browser.newPage({ viewport: { width: 1672, height: 941 } });
 const errors=[]; page.on('pageerror', e=>errors.push(e.message));
 await page.goto(process.env.APP_URL || 'http://127.0.0.1:5173');
 await page.evaluate(()=>document.fonts.ready);
 assert.equal(await page.locator('.metric').count(),4);
 await page.locator('.periods button').first().click();
 assert.match(await page.locator('.performance .change').textContent(),/۱۸٫۶/);
 await page.locator('[data-dialog="تحلیل مالی"]').click();
 assert.equal(await page.locator('dialog').evaluate(e=>e.open),true);
 await page.locator('.close').click();
 await page.locator('.search input').fill('فروش');
 await page.locator('.search input').press('Enter');
 assert.match(await page.locator('#dialog-title').textContent(),/فروش/);
 await page.keyboard.press('Escape');
 await mkdir('artifacts',{recursive:true});
 await page.screenshot({path:'artifacts/desktop.png',fullPage:true});
 for(const width of [390,768,1280]) {
  await page.setViewportSize({width,height:844});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`Overflow at ${width}`);
  if(width===390) await page.screenshot({path:'artifacts/mobile.png',fullPage:true});
 }
 assert.deepEqual(errors,[]);
 console.log('PASS: dashboard, period selection, dialogs, search, responsive widths, no browser errors');
} finally {await browser.close();}
