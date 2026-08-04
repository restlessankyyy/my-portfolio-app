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
 * ║    --model <model>   Model name (default: claude-sonnet-4-20250514) ║
 * ║                      Claude:   claude-sonnet-4-20250514      ║
 * ║                                claude-haiku-4-20250514       ║
 * ║                      Foundry:  gpt-5.4                       ║
 * ║    --max-loops <n>   Max ATS feedback loops (default: 2)     ║
 * ║    --threshold <n>   ATS score threshold (default: 80)       ║
 * ║    --verbose          Print intermediate agent outputs       ║
 * ╚══════════════════════════════════════════════════════════════╝
 *
 * For tailoring resumes across many job postings at once (with cover
 * letters + an assisted-fill application kit), see bulk-apply.js instead.
 * This script remains the single-JD entry point used by the CI workflows.
 */

require('dotenv').config();

const fs = require('fs');
const path = require('path');

const { generatePDF } = require('./pdf-render');
const {
  log,
  timer,
  fmtTime,
  loadProfile,
  renderResumeHTML,
  assembleTemplateData,
  deriveOutputName,
  runResumeAgents,
} = require('./pipeline');

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

// ── Main Pipeline ──
async function main() {
  const opts = parseArgs();

  const pipelineTimer = timer();

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

  const { jdAnalysis, experienceMapping, resolvedMapping, resumeContent, atsScore, loop, timings } =
    await runResumeAgents(jdText, profile, {
      model: opts.model,
      maxLoops: opts.maxLoops,
      threshold: opts.threshold,
      verbose: opts.verbose,
    });

  // ── Render HTML ──
  log('render', 'Assembling template data and rendering HTML...');
  const templateData = assembleTemplateData(profile, resolvedMapping, resumeContent);
  const html = renderResumeHTML(templateData);

  // Save intermediate HTML for debugging
  const debugHtmlPath = path.resolve(__dirname, '..', '..', 'public', 'assets', 'resume-debug.html');
  fs.writeFileSync(debugHtmlPath, html);

  // ── Generate PDF ──
  const outputFilename = opts.output || deriveOutputName(jdAnalysis);
  const outputPath = path.resolve(__dirname, '..', '..', 'public', 'assets', outputFilename);

  log('pdf', `Generating PDF: ${outputFilename}...`);
  let t = timer();
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
