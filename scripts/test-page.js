import { chromium } from 'playwright';

async function check() {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage();
  await page.goto('http://localhost:8000', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  const texts = await page.locator('div.cursor-pointer').allInnerTexts();
  console.log('Cursor-pointer divs count:', texts.length);
  texts.slice(0, 5).forEach((t, i) => console.log(`Card ${i}:`, t.replace(/\s+/g, ' ').slice(0, 120)));

  await browser.close();
}

check().catch(console.error);
