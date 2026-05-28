const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  const errors = [];
  
  page.on('console', msg => {
    const text = msg.text();
    if (msg.type() === 'error' || /404|not defined|Cannot read|is not a|uncaught/i.test(text)) {
      errors.push(text);
    }
  });
  page.on('pageerror', err => errors.push('PAGEERROR: ' + err.message));
  page.on('requestfailed', req => {
    const f = req.failure();
    if (f) errors.push('NETWORK: ' + req.url());
  });

  await page.goto('https://Hanazar-Games.github.io/Kimi2.6-AIGC-Webgame-Project/', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 3000));

  await page.click('#start-btn');
  await new Promise(r => setTimeout(r, 4000));

  for (let i = 0; i < 5; i++) {
    await page.keyboard.down('w');
    await new Promise(r => setTimeout(r, 100));
    await page.keyboard.up('w');
    await page.keyboard.down(' ');
    await new Promise(r => setTimeout(r, 100));
    await page.keyboard.up(' ');
    await new Promise(r => setTimeout(r, 300));
  }

  await page.keyboard.press('p');
  await new Promise(r => setTimeout(r, 500));
  await page.keyboard.press('p');
  await new Promise(r => setTimeout(r, 500));

  await new Promise(r => setTimeout(r, 5000));

  const unique = [...new Set(errors)];
  console.log('=== GITHUB PAGES E2E ===');
  if (unique.length === 0) {
    console.log('ZERO ERRORS on live GitHub Pages ✓');
  } else {
    unique.forEach(e => console.log('ERROR: ' + e));
  }

  await browser.close();
})();
