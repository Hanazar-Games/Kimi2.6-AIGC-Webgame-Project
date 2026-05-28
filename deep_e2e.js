const puppeteer = require('puppeteer');
const http = require('http');
const fs = require('fs');
const path = require('path');

const server = http.createServer((req, res) => {
  let filePath = path.join(__dirname, req.url === '/' ? 'index.html' : req.url);
  const ext = path.extname(filePath);
  const types = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css' };
  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'Content-Type': types[ext] || 'application/octet-stream' });
    res.end(data);
  });
});

server.listen(9877, async () => {
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

  await page.goto('http://localhost:9877/', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 3000));

  // Click START MISSION
  await page.click('#start-btn');
  console.log('1. Clicked START MISSION');
  await new Promise(r => setTimeout(r, 4000)); // countdown + gameplay start

  // Simulate gameplay inputs
  for (let i = 0; i < 5; i++) {
    await page.keyboard.down('w');
    await new Promise(r => setTimeout(r, 100));
    await page.keyboard.up('w');
    await page.keyboard.down('a');
    await new Promise(r => setTimeout(r, 100));
    await page.keyboard.up('a');
    await page.keyboard.down(' ');
    await new Promise(r => setTimeout(r, 100));
    await page.keyboard.up(' ');
    await new Promise(r => setTimeout(r, 300));
  }
  console.log('2. Simulated gameplay (WASD + Space)');

  // Press P to pause
  await page.keyboard.press('p');
  await new Promise(r => setTimeout(r, 500));
  console.log('3. Pressed P (pause)');

  // Resume
  await page.keyboard.press('p');
  await new Promise(r => setTimeout(r, 500));
  console.log('4. Pressed P (resume)');

  // Press B for bomb
  await page.keyboard.press('b');
  await new Promise(r => setTimeout(r, 500));
  console.log('5. Pressed B (bomb)');

  // Press K for dash
  await page.keyboard.press('k');
  await new Promise(r => setTimeout(r, 500));
  console.log('6. Pressed K (dash)');

  // Press Tab for stats
  await page.keyboard.press('Tab');
  await new Promise(r => setTimeout(r, 500));
  console.log('7. Pressed Tab (stats)');
  await page.keyboard.press('Tab');
  await new Promise(r => setTimeout(r, 500));

  // Let enemies spawn
  await new Promise(r => setTimeout(r, 5000));
  console.log('8. Let enemies spawn');

  // Press Escape
  await page.keyboard.press('Escape');
  await new Promise(r => setTimeout(r, 500));
  console.log('9. Pressed Escape');

  await new Promise(r => setTimeout(r, 2000));

  const unique = [...new Set(errors)];
  console.log('\n=== DEEP E2E RESULTS ===');
  if (unique.length === 0) {
    console.log('ZERO ERRORS across full gameplay simulation ✓');
  } else {
    unique.forEach(e => console.log('ERROR: ' + e));
  }

  await browser.close();
  server.close();
});
