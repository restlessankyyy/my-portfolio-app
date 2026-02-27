const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const isCI = process.env.CI === 'true';
  const browser = await puppeteer.launch({
    headless: 'new',
    args: isCI ? ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'] : [],
  });
  const page = await browser.newPage();
  
  const htmlPath = path.resolve(__dirname, 'resume-photo.html');
  await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle0' });
  
  await page.pdf({
    path: path.resolve(__dirname, '..', 'public', 'Profile-Nordic.pdf'),
    format: 'A4',
    margin: { top: '10mm', bottom: '10mm', left: '0mm', right: '0mm' },
    printBackground: true,
  });

  console.log('✅ Profile-Nordic.pdf generated in public/');
  await browser.close();
})();
