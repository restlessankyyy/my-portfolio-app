#!/usr/bin/env node

/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  Agentic Resume Pipeline — Orchestrator                     ║
 * ║                                                              ║
 * ║  Usage:                                                      ║
 * ║    node scripts/agent/generate.js --jd path/to/jd.txt       ║
 * ║    node scripts/agent/generate.js --jd jds/microsoft-csa.txt║
 * ║                                                              ║
 * ║  Options:                                                    ║
 * ║    --jd <path>       Path to JD text file (required)         ║
 * ║    --output <name>   Output PDF filename (auto-generated)    ║
 * ║    --model <model>   Model name (default: claude-sonnet-4-20250514)  ║
 * ║    --max-loops <n>   Max ATS feedback loops (default: 2)     ║
 * ║    --threshold <n>   ATS score threshold (default: 80)       ║
 * ║    --verbose          Print intermediate agent outputs       ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

require('dotenv').config();

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const Handlebars = require('handlebars');
const puppeteer = require('puppeteer');

const { analyzeJD } = require('./jd-analyzer');
const { mapExperience } = require('./experience-mapper');
const { writeResume } = require('./resume-writer');
const { scoreResume } = require('./ats-scorer');

// ── CLI Argument Parsing ──
function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {
    jd: null,
    output: null,
    model: 'claude-sonnet-4-20250514',
    maxLoops: 2,
    threshold: 80,
    verbose: false,
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--jd':
        opts.jd = args[++i];
        break;
      case '--output':
        opts.output = args[++i];
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
      case '--verbose':
        opts.verbose = true;
        break;
    }
  }

  if (!opts.jd) {
    console.error('❌ Usage: node scripts/agent/generate.js --jd <path-to-jd.txt>');
    process.exit(1);
  }

  return opts;
}

// ── Logging ──
function log(step, message, data = null) {
  const icons = {
    start: '🚀',
    agent1: '🔍',
    agent2: '🗺️ ',
    agent3: '✍️ ',
    agent4: '📊',
    loop: '🔄',
    render: '🎨',
    pdf: '📄',
    done: '✅',
    warn: '⚠️ ',
    error: '❌',
  };
  console.log(`\n${icons[step] || '→'} ${message}`);
  if (data) {
    console.log(typeof data === 'string' ? data : JSON.stringify(data, null, 2));
  }
}

// ── Timing ──
function timer() {
  const start = process.hrtime.bigint();
  return {
    stop() {
      const elapsed = Number(process.hrtime.bigint() - start) / 1e9;
      return elapsed;
    },
  };
}

function fmtTime(secs) {
  if (secs < 60) return `${secs.toFixed(1)}s`;
  const m = Math.floor(secs / 60);
  const s = (secs % 60).toFixed(1);
  return `${m}m ${s}s`;
}

// ── Load Candidate Profile ──
function loadProfile() {
  const profilePath = path.resolve(__dirname, 'candidate-profile.yaml');
  const raw = fs.readFileSync(profilePath, 'utf-8');
  return yaml.load(raw);
}

// ── Render HTML from template ──
function renderHTML(templateData) {
  const templatePath = path.resolve(__dirname, 'templates', 'resume.hbs');
  const templateSrc = fs.readFileSync(templatePath, 'utf-8');
  const template = Handlebars.compile(templateSrc);
  return template(templateData);
}

// ── Assemble template data from agent outputs ──
function assembleTemplateData(profile, mapping, resumeContent) {
  return {
    name: profile.name,
    headline: mapping.headline,
    location: profile.location,
    email: profile.email,
    website: profile.website,
    websiteDisplay: profile.website.replace('https://', ''),
    linkedin: profile.linkedin,
    linkedinDisplay: profile.linkedin.replace('https://', ''),
    github: profile.github,
    githubDisplay: profile.github.replace('https://', ''),
    summary: resumeContent.summary,
    skills: mapping.skills_grid,
    experience: resumeContent.experience,
    projects: resumeContent.projects || [],
    certifications: mapping.selected_certifications || [],
    education: profile.education,
    publications: resumeContent.publications || [],
  };
}

// ── Generate PDF ──
async function generatePDF(html, outputPath) {
  const isCI = process.env.CI === 'true';
  const browser = await puppeteer.launch({
    headless: 'new',
    args: isCI ? ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'] : [],
  });
  const page = await browser.newPage();

  await page.setContent(html, { waitUntil: 'networkidle0' });

  await page.pdf({
    path: outputPath,
    format: 'A4',
    margin: { top: '8mm', bottom: '8mm', left: '0mm', right: '0mm' },
    printBackground: true,
  });

  await browser.close();
}

// ── Derive output filename from JD ──
function deriveOutputName(jdAnalysis) {
  const company = (jdAnalysis.company || 'Unknown')
    .replace(/[^a-zA-Z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  const role = (jdAnalysis.role || 'Resume')
    .replace(/[^a-zA-Z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return `Profile-${company}-${role}.pdf`;
}

// ── Main Pipeline ──
async function main() {
  const opts = parseArgs();
  const agentOpts = { model: opts.model };

  const pipelineTimer = timer();
  const timings = {};

  log('start', `Agentic Resume Pipeline — Model: ${opts.model}`);

  // Load inputs
  const jdPath = path.resolve(opts.jd);
  if (!fs.existsSync(jdPath)) {
    log('error', `JD file not found: ${jdPath}`);
    process.exit(1);
  }
  const jdText = fs.readFileSync(jdPath, 'utf-8');
  const profile = loadProfile();
  log('start', `Loaded profile: ${profile.name} | JD: ${path.basename(jdPath)}`);

  // ── Agent 1: Analyze JD ──
  log('agent1', 'Agent 1: Analyzing job description...');
  let t = timer();
  const jdAnalysis = await analyzeJD(jdText, agentOpts);
  timings.agent1 = t.stop();
  if (opts.verbose) log('agent1', 'JD Analysis:', jdAnalysis);
  log('agent1', `Extracted: ${jdAnalysis.keywords.hard_skills.length} hard skills, ${jdAnalysis.ats_signals.length} ATS signals [${fmtTime(timings.agent1)}]`);

  // ── Agent 2: Map Experience ──
  log('agent2', 'Agent 2: Mapping experience to JD...');
  t = timer();
  const experienceMapping = await mapExperience(jdAnalysis, profile, agentOpts);
  timings.agent2 = t.stop();
  if (opts.verbose) log('agent2', 'Experience Mapping:', experienceMapping);
  log('agent2', `Strategy: ${experienceMapping.strategy_notes} [${fmtTime(timings.agent2)}]`);
  if (experienceMapping.gaps && experienceMapping.gaps.length > 0) {
    log('warn', `Gaps identified: ${experienceMapping.gaps.join(', ')}`);
  }

  // ── Agent 3 + 4: Write & Score Loop ──
  let resumeContent;
  let atsScore;
  let loop = 0;

  while (loop < opts.maxLoops) {
    loop++;
    log('agent3', `Agent 3: Writing resume (iteration ${loop})...`);
    t = timer();

    if (loop === 1) {
      resumeContent = await writeResume(jdAnalysis, experienceMapping, profile, agentOpts);
    } else {
      // Feed previous feedback back into the writer
      resumeContent = await writeResume(
        jdAnalysis,
        { ...experienceMapping, previous_feedback: atsScore.feedback },
        profile,
        agentOpts,
      );
    }
    const writerTime = t.stop();
    timings[`agent3_iter${loop}`] = writerTime;

    if (opts.verbose) log('agent3', 'Resume Content:', resumeContent);

    log('agent4', `Agent 4: Scoring ATS match (iteration ${loop})... [Writer: ${fmtTime(writerTime)}]`);
    t = timer();
    atsScore = await scoreResume(resumeContent, jdAnalysis, agentOpts);
    const scorerTime = t.stop();
    timings[`agent4_iter${loop}`] = scorerTime;

    log(
      'agent4',
      `Score: ${atsScore.overall_score}/100 | Keywords: ${atsScore.matched_keywords.length} matched, ${atsScore.missing_keywords.length} missing [${fmtTime(scorerTime)}]`,
    );

    if (opts.verbose) {
      log('agent4', 'Score Breakdown:', atsScore.breakdown);
      if (atsScore.feedback.length > 0) {
        log('agent4', 'Feedback:', atsScore.feedback);
      }
    }

    if (atsScore.pass && atsScore.overall_score >= opts.threshold) {
      log('done', `ATS threshold met (${atsScore.overall_score} >= ${opts.threshold}). Proceeding to render.`);
      break;
    }

    if (loop < opts.maxLoops) {
      log('loop', `Score ${atsScore.overall_score} < ${opts.threshold}. Feeding back to Agent 3...`);
      log('loop', `Missing: ${atsScore.missing_keywords.slice(0, 10).join(', ')}`);
    } else {
      log('warn', `Max loops reached. Proceeding with score ${atsScore.overall_score}/100.`);
    }
  }

  // ── Render HTML ──
  log('render', 'Assembling template data and rendering HTML...');
  const templateData = assembleTemplateData(profile, experienceMapping, resumeContent);
  const html = renderHTML(templateData);

  // Save intermediate HTML for debugging
  const debugHtmlPath = path.resolve(__dirname, '..', '..', 'public', 'assets', 'resume-debug.html');
  fs.writeFileSync(debugHtmlPath, html);

  // ── Generate PDF ──
  const outputFilename = opts.output || deriveOutputName(jdAnalysis);
  const outputPath = path.resolve(__dirname, '..', '..', 'public', 'assets', outputFilename);

  log('pdf', `Generating PDF: ${outputFilename}...`);
  t = timer();
  await generatePDF(html, outputPath);
  timings.pdf = t.stop();

  // ── Summary ──
  timings.total = pipelineTimer.stop();

  log('done', '═══ Pipeline Complete ═══');
  console.log(`   📄 PDF:   ${outputPath}`);
  console.log(`   📊 Score: ${atsScore.overall_score}/100`);
  console.log(`   🔑 Keywords matched: ${atsScore.matched_keywords.length}`);
  console.log(`   ⚠️  Keywords missing: ${atsScore.missing_keywords.length}`);
  if (atsScore.missing_keywords.length > 0) {
    console.log(`   → Missing: ${atsScore.missing_keywords.join(', ')}`);
  }
  console.log(`   🔄 Iterations: ${loop}`);
  console.log(`\n   ⏱️  Performance Metrics:`);
  console.log(`   ├─ Agent 1 (JD Analyzer):      ${fmtTime(timings.agent1)}`);
  console.log(`   ├─ Agent 2 (Experience Mapper): ${fmtTime(timings.agent2)}`);
  for (let i = 1; i <= loop; i++) {
    console.log(`   ├─ Agent 3 (Writer iter ${i}):    ${fmtTime(timings[`agent3_iter${i}`])}`);
    console.log(`   ├─ Agent 4 (Scorer iter ${i}):    ${fmtTime(timings[`agent4_iter${i}`])}`);
  }
  console.log(`   ├─ PDF Generation:              ${fmtTime(timings.pdf)}`);
  console.log(`   └─ Total Pipeline:              ${fmtTime(timings.total)}`);

  // Write ATS report alongside PDF
  const reportPath = outputPath.replace('.pdf', '-ats-report.json');
  fs.writeFileSync(
    reportPath,
    JSON.stringify(
      {
        generated_at: new Date().toISOString(),
        jd_file: path.basename(jdPath),
        model: opts.model,
        iterations: loop,
        timings,
        score: atsScore,
        jd_analysis: jdAnalysis,
        experience_mapping: experienceMapping,
      },
      null,
      2,
    ),
  );
  console.log(`   📋 Report: ${reportPath}`);
}

main().catch((err) => {
  log('error', `Pipeline failed: ${err.message}`);
  console.error(err);
  process.exit(1);
});
