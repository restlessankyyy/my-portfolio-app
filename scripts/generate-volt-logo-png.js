const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

// Renders the Volt SVG logos to PNG at multiple sizes using Puppeteer.
// Usage: node scripts/generate-volt-logo-png.js
const targets = [
  { svg: 'volt-logo.svg', out: 'volt-logo-512.png', width: 512, height: 512 },
  { svg: 'volt-logo.svg', out: 'volt-logo-256.png', width: 256, height: 256 },
  { svg: 'volt-wordmark.svg', out: 'volt-wordmark.png', width: 900, height: 280 },
];

(async () => {
  const isCI = process.env.CI === 'true';
  const imgDir = path.resolve(__dirname, '..', 'public', 'img', 'volt');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: isCI ? ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'] : [],
  });

  try {
    for (const t of targets) {
      const svg = fs.readFileSync(path.join(imgDir, t.svg), 'utf8');
      const page = await browser.newPage();
      await page.setViewport({ width: t.width, height: t.height, deviceScaleFactor: 2 });
      const html = `<!doctype html><html><head><meta charset="utf-8">
        <style>html,body{margin:0;padding:0;background:transparent}</style></head>
        <body>${svg}</body></html>`;
      await page.setContent(html, { waitUntil: 'networkidle0' });
      const el = await page.$('svg');
      await el.screenshot({ path: path.join(imgDir, t.out), omitBackground: true });
      await page.close();
      console.log(`✅ ${t.out} (${t.width}x${t.height} @2x)`);
    }
  } finally {
    await browser.close();
  }
})();
