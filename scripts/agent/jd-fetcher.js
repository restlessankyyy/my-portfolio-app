/**
 * JD Fetcher — loads a job posting URL and extracts its visible text so the
 * agentic pipeline can analyze it. Used by bulk-apply.js.
 *
 * Uses puppeteer (already a pipeline dependency, reused here) rather than a
 * plain HTTP fetch so JS-rendered job boards (Greenhouse, Lever, Workday,
 * etc.) resolve correctly. Read-only: it loads the public page a human would
 * see, does not log in anywhere, and never submits any form.
 */

const puppeteer = require('puppeteer');

const USER_AGENT =
  'Mozilla/5.0 (compatible; personal-job-application-assistant/1.0; +https://ankitraj.cloud)';

async function fetchJD(url, options = {}) {
  const isCI = process.env.CI === 'true';
  const browser = await puppeteer.launch({
    headless: 'new',
    args: isCI ? ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'] : [],
  });

  try {
    const page = await browser.newPage();
    await page.setUserAgent(USER_AGENT);
    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: options.timeout || 30000,
    });

    const title = await page.title();
    const text = await page.evaluate(() => document.body.innerText || '');
    const trimmed = text.replace(/\n{3,}/g, '\n\n').trim();

    if (trimmed.length < 200) {
      throw new Error(
        `Extracted JD text looks too short (${trimmed.length} chars) — page may require login or block automated access`,
      );
    }

    return { url, finalUrl: page.url(), title, text: trimmed };
  } finally {
    await browser.close();
  }
}

module.exports = { fetchJD };
