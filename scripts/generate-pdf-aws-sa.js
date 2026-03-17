const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const isCI = process.env.CI === 'true';
  const browser = await puppeteer.launch({
    headless: 'new',
    args: isCI ? ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'] : [],
  });
  const page = await browser.newPage();
  
  const htmlPath = path.resolve(__dirname, 'resume-aws-sa.html');
  await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle0' });
  
  await page.pdf({
    path: path.resolve(__dirname, '..', 'public', 'assets', 'Profile.pdf'),
    format: 'A4',
    margin: { top: '8mm', bottom: '8mm', left: '0mm', right: '0mm' },
    printBackground: true,
  });

  console.log('✅ Profile.pdf generated in public/assets/');
  await browser.close();
})();
