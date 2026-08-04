/**
 * Shared PDF renderer — used by the single-JD pipeline and the bulk-apply
 * orchestrator so both produce identical, ATS-safe PDF output.
 *
 * Writes HTML to a temp file and uses page.goto('file://...') instead of
 * page.setContent() — setContent loads in about:blank which breaks Google
 * Fonts @import, causing the PDF text layer to garble on copy-paste / ATS
 * parsing.
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const puppeteer = require('puppeteer');

async function generatePDF(html, outputPath) {
  const tmpHtml = path.join(os.tmpdir(), `pdf-render-${Date.now()}-${Math.random().toString(36).slice(2)}.html`);
  fs.writeFileSync(tmpHtml, html, 'utf-8');

  const isCI = process.env.CI === 'true';
  const browser = await puppeteer.launch({
    headless: 'new',
    args: isCI ? ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'] : [],
  });

  try {
    const page = await browser.newPage();
    await page.goto(`file://${tmpHtml}`, { waitUntil: 'networkidle0' });
    await page.pdf({
      path: outputPath,
      format: 'A4',
      margin: { top: '8mm', bottom: '8mm', left: '0mm', right: '0mm' },
      printBackground: true,
    });
  } finally {
    await browser.close();
    fs.unlinkSync(tmpHtml);
  }
}

module.exports = { generatePDF };
