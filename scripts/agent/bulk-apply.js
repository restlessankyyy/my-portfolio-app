#!/usr/bin/env node

/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  Bulk Apply — Batch Resume/Cover-Letter Tailoring            ║
 * ║                                                                ║
 * ║  For a list of job posting URLs, generates a tailored resume, ║
 * ║  tailored cover letter, ATS score report, and an "assisted    ║
 * ║  fill" application kit for each — as review-ready drafts.     ║
 * ║                                                                ║
 * ║  This tool does NOT log into any job board and does NOT       ║
 * ║  submit applications. You review each output and apply        ║
 * ║  yourself on the employer's site.                             ║
 * ║                                                                ║
 * ║  Usage:                                                        ║
 * ║    node scripts/agent/bulk-apply.js --input scripts/agent/jobs.example.txt ║
 * ║    node scripts/agent/bulk-apply.js --input jobs.yaml         ║
 * ║                                                                ║
 * ║  Input formats:                                                ║
 * ║    .txt   — one job URL per line ('#' comments / blanks OK)   ║
 * ║    .yaml  — { jobs: [{ url, company?, role? }, ...] }         ║
 * ║                                                                ║
 * ║  Options:                                                      ║
 * ║    --input <path>    Job list file (required)                 ║
 * ║    --model <model>   Model name (default: claude-sonnet-4-20250514) ║
 * ║    --max-loops <n>   Max ATS feedback loops per job (default: 2) ║
 * ║    --threshold <n>   ATS score threshold (default: 80)        ║
 * ║    --delay <ms>      Delay between jobs (default: 3000)       ║
 * ║    --out-dir <path>  Output root (default: applications/)     ║
 * ║    --verbose         Print intermediate agent outputs         ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

require('dotenv').config();

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const Handlebars = require('handlebars');

const { generatePDF } = require('./pdf-render');
const { fetchJD } = require('./jd-fetcher');
const { writeCoverLetter } = require('./cover-letter-writer');
const { buildApplicationKit } = require('./application-kit');
const {
  log,
  timer,
  fmtTime,
  slugify,
  loadProfile,
  renderResumeHTML,
  assembleTemplateData,
  runResumeAgents,
} = require('./pipeline');

// ── CLI Argument Parsing ──
function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {
    input: null,
    model: 'claude-sonnet-4-20250514',
    maxLoops: 2,
    threshold: 80,
    delay: 3000,
    outDir: path.resolve(__dirname, '..', '..', 'applications'),
    verbose: false,
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--input':
        opts.input = args[++i];
        break;
      case '--model':
        opts.model = args[++i];
        break;
      case '--max-loops':
        opts.maxLoops = parseInt(args[++i], 10);
        break;
      case '--threshold':
        opts.threshold = parseInt(args[++i], 10);
        break;
      case '--delay':
        opts.delay = parseInt(args[++i], 10);
        break;
      case '--out-dir':
        opts.outDir = path.resolve(args[++i]);
        break;
      case '--verbose':
        opts.verbose = true;
        break;
    }
  }

  if (!opts.input) {
    console.error('❌ Usage: node scripts/agent/bulk-apply.js --input <jobs.txt|jobs.yaml>');
    process.exit(1);
  }

  return opts;
}

// ── Load job list ──
function loadJobs(inputPath) {
  const resolved = path.resolve(inputPath);
  if (!fs.existsSync(resolved)) {
    throw new Error(`Input file not found: ${resolved}`);
  }
  const raw = fs.readFileSync(resolved, 'utf-8');
  const ext = path.extname(resolved).toLowerCase();

  if (ext === '.yaml' || ext === '.yml') {
    const doc = yaml.load(raw) || {};
    const list = Array.isArray(doc) ? doc : doc.jobs || [];
    return list
      .map((j) => (typeof j === 'string' ? { url: j } : j))
      .filter((j) => j && j.url);
  }

  // Plain text: one URL per line, '#' comments and blank lines ignored
  return raw
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
    .map((url) => ({ url }));
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function renderCoverLetterHTML(templateData) {
  const templatePath = path.resolve(__dirname, 'templates', 'cover-letter.hbs');
  const templateSrc = fs.readFileSync(templatePath, 'utf-8');
  const template = Handlebars.compile(templateSrc);
  return template(templateData);
}

function fallbackSlug(job, index) {
  try {
    const u = new URL(job.url);
    return slugify(`${u.hostname}-${u.pathname}`) || `job-${index + 1}`;
  } catch {
    return `job-${index + 1}`;
  }
}

// ── Process a single job ──
async function processJob(job, index, total, profile, opts) {
  const prefix = `[${index + 1}/${total}]`;
  const jobLog = (step, message, data) => log(step, `${prefix} ${message}`, data);

  jobLog('start', `Fetching JD: ${job.url}`);
  const fetched = await fetchJD(job.url);

  const { jdAnalysis, resolvedMapping, resumeContent, atsScore } = await runResumeAgents(
    fetched.text,
    profile,
    {
      model: opts.model,
      maxLoops: opts.maxLoops,
      threshold: opts.threshold,
      verbose: opts.verbose,
      logFn: jobLog,
    },
  );

  const slug =
    slugify(`${jdAnalysis.company || job.company || ''}-${jdAnalysis.role || job.role || ''}`) ||
    fallbackSlug(job, index);
  const jobDir = path.join(opts.outDir, slug);
  fs.mkdirSync(jobDir, { recursive: true });

  const jdSourcePath = path.join(jobDir, 'jd.txt');
  fs.writeFileSync(jdSourcePath, fetched.text);

  // Resume
  const templateData = assembleTemplateData(profile, resolvedMapping, resumeContent);
  const resumeHtml = renderResumeHTML(templateData);
  const resumePath = path.join(jobDir, 'resume.pdf');
  await generatePDF(resumeHtml, resumePath);

  // Cover letter
  jobLog('agent3', 'Agent 5: Drafting cover letter...');
  const coverLetter = await writeCoverLetter(jdAnalysis, resolvedMapping, profile, { model: opts.model });
  const coverLetterHtml = renderCoverLetterHTML({
    name: profile.name,
    headline: resolvedMapping.headline,
    location: profile.location,
    email: profile.email,
    website: profile.website,
    websiteDisplay: profile.website.replace('https://', ''),
    linkedin: profile.linkedin,
    linkedinDisplay: profile.linkedin.replace('https://', ''),
    role: jdAnalysis.role || job.role || 'the role',
    company: jdAnalysis.company || job.company || '',
    location_meta: jdAnalysis.location || '',
    salutation: coverLetter.salutation,
    paragraphs: coverLetter.paragraphs,
  });
  const coverLetterPath = path.join(jobDir, 'cover-letter.pdf');
  await generatePDF(coverLetterHtml, coverLetterPath);

  // ATS report
  fs.writeFileSync(
    path.join(jobDir, 'ats-report.json'),
    JSON.stringify({ generated_at: new Date().toISOString(), model: opts.model, score: atsScore, jd_analysis: jdAnalysis }, null, 2),
  );

  // Application kit
  const kit = buildApplicationKit({
    job,
    profile,
    jdAnalysis,
    resolvedMapping,
    atsScore,
    coverLetter,
    resumePath,
    coverLetterPath,
    jdSourcePath,
  });
  fs.writeFileSync(path.join(jobDir, 'application-kit.json'), JSON.stringify(kit, null, 2));

  jobLog('done', `Ready for review — score ${atsScore.overall_score}/100 → ${jobDir}`);

  return {
    status: 'ready_for_review',
    url: job.url,
    company: kit.job.company,
    role: kit.job.role,
    ats_score: atsScore.overall_score,
    dir: jobDir,
    updated_at: new Date().toISOString(),
  };
}

// ── Manifest: upsert by job URL so re-runs update status instead of duplicating ──
function loadManifest(outDir) {
  const manifestPath = path.join(outDir, 'manifest.json');
  if (!fs.existsSync(manifestPath)) return [];
  try {
    return JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
  } catch {
    return [];
  }
}

function saveManifest(outDir, entries) {
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify(entries, null, 2));
}

function upsertManifest(manifest, entry) {
  const i = manifest.findIndex((e) => e.url === entry.url);
  if (i >= 0) manifest[i] = entry;
  else manifest.push(entry);
}

// ── Main ──
async function main() {
  const opts = parseArgs();
  const jobs = loadJobs(opts.input);

  if (jobs.length === 0) {
    log('error', `No job URLs found in ${opts.input}`);
    process.exit(1);
  }

  const profile = loadProfile();
  log('start', `Bulk Apply — ${jobs.length} job(s) | Model: ${opts.model} | Loaded profile: ${profile.name}`);

  const manifest = loadManifest(opts.outDir);
  const runTimer = timer();
  let readyCount = 0;
  let failedCount = 0;

  for (let i = 0; i < jobs.length; i++) {
    const job = jobs[i];
    try {
      const result = await processJob(job, i, jobs.length, profile, opts);
      upsertManifest(manifest, result);
      readyCount++;
    } catch (err) {
      log('error', `[${i + 1}/${jobs.length}] Failed: ${job.url} — ${err.message}`);
      upsertManifest(manifest, {
        status: 'failed',
        url: job.url,
        error: err.message,
        updated_at: new Date().toISOString(),
      });
      failedCount++;
    }

    saveManifest(opts.outDir, manifest);

    if (i < jobs.length - 1 && opts.delay > 0) {
      await sleep(opts.delay);
    }
  }

  const total = runTimer.stop();
  log('done', '═══ Bulk Apply Complete ═══');
  console.log(`   ✅ Ready for review: ${readyCount}`);
  console.log(`   ❌ Failed:           ${failedCount}`);
  console.log(`   ⏱️  Total time:       ${fmtTime(total)}`);
  console.log(`   📂 Output:           ${opts.outDir}`);
  console.log(`   📋 Manifest:         ${path.join(opts.outDir, 'manifest.json')}`);
  console.log(`\n   Review each application-kit.json + resume.pdf + cover-letter.pdf, then apply yourself on the employer's site.`);
}

main().catch((err) => {
  log('error', `Bulk apply failed: ${err.message}`);
  console.error(err);
  process.exit(1);
});
