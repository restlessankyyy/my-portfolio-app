const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const isCI = process.env.CI === 'true';
  const browser = await puppeteer.launch({
    headless: 'new',
    args: isCI ? ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'] : [],
  });
  const page = await browser.newPage();

  const htmlPath = path.resolve(__dirname, 'cover-letter-databricks.html');
  await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle0' });

  await page.pdf({
    path: path.resolve(__dirname, '..', 'public', 'assets', 'Cover-Letter-Databricks.pdf'),
    format: 'A4',
    margin: { top: '12mm', bottom: '12mm', left: '0mm', right: '0mm' },
    printBackground: true,
  });

  console.log('✅ Cover-Letter-Databricks.pdf generated in public/assets/');
  await browser.close();
})();
