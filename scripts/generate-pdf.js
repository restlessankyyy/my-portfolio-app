const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const isCI = process.env.CI === 'true';
  const browser = await puppeteer.launch({
    headless: 'new',
    args: isCI ? ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'] : [],
  });
  const page = await browser.newPage();
  
  const htmlPath = path.resolve(__dirname, 'resume.html');
  await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle0' });
  
  await page.pdf({
    path: path.resolve(__dirname, '..', 'public', 'Profile.pdf'),
    format: 'A4',
    margin: { top: '12mm', bottom: '12mm', left: '0mm', right: '0mm' },
    printBackground: true,
  });

  console.log('✅ Profile.pdf generated in public/');
  await browser.close();
})();
