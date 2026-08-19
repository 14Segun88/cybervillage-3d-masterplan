import puppeteer from 'puppeteer';

(async () => {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.type().toUpperCase(), msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));
  page.on('requestfailed', req => console.log('BROWSER REQUEST FAILED:', req.url(), req.failure().errorText));

  console.log('Navigating to http://localhost:5173 ...');
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
  
  console.log('Clicking on Serpukhov marker (or waiting for city card)...');
  // Usually we click the city marker or wait for the UI to be ready
  // Actually, we can just call app.selectCity({ ... }) if we can access window.app, but App is not exported to window.
  // We can try clicking the "ЗАГРУЗИТЬ 3D МИР" button if it's there.
  // Wait for the map to load
  await page.waitForTimeout(2000);
  
  // Click at the center to select Serpukhov (or whatever is there)
  await page.mouse.click(page.viewport().width / 2, page.viewport().height / 2);
  await page.waitForTimeout(1000);
  
  // Try to click the enter world button
  const btnSelector = '.btn-primary-glow';
  const btn = await page.$(btnSelector);
  if (btn) {
    console.log('Found "Загрузить 3D мир" button. Clicking...');
    await btn.click();
    console.log('Clicked. Waiting for 3 seconds to see if errors appear...');
    await page.waitForTimeout(3000);
  } else {
    console.log('Could not find the enter world button. Taking screenshot...');
    await page.screenshot({ path: 'test_no_btn.png' });
  }

  await browser.close();
  console.log('Done.');
})();
