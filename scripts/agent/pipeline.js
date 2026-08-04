/**
 * Shared resume pipeline core — Agents 1-4 (analyze → map → write → score,
 * looped until threshold) plus HTML assembly.
 *
 * Extracted from generate.js so the single-JD CLI and the bulk-apply
 * orchestrator run the exact same tailoring logic instead of duplicating it.
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const Handlebars = require('handlebars');

const { analyzeJD } = require('./jd-analyzer');
const { mapExperience } = require('./experience-mapper');
const { writeResume } = require('./resume-writer');
const { scoreResume } = require('./ats-scorer');

// ── Logging (default; callers may pass their own logFn) ──
const ICONS = {
  start: '🚀', agent1: '🔍', agent2: '🗺️ ', agent3: '✍️ ', agent4: '📊',
  loop: '🔄', render: '🎨', pdf: '📄', done: '✅', warn: '⚠️ ', error: '❌',
};

function log(step, message, data = null) {
  console.log(`\n${ICONS[step] || '→'} ${message}`);
  if (data) {
    console.log(typeof data === 'string' ? data : JSON.stringify(data, null, 2));
  }
}

function timer() {
  const start = process.hrtime.bigint();
  return {
    stop() {
      return Number(process.hrtime.bigint() - start) / 1e9;
    },
  };
}

function fmtTime(secs) {
  if (secs < 60) return `${secs.toFixed(1)}s`;
  const m = Math.floor(secs / 60);
  const s = (secs % 60).toFixed(1);
  return `${m}m ${s}s`;
}

function slugify(str) {
  return (str || '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

// ── Candidate profile ──
function loadProfile() {
  const profilePath = path.resolve(__dirname, 'candidate-profile.yaml');
  const raw = fs.readFileSync(profilePath, 'utf-8');
  return yaml.load(raw);
}

// ── Render resume HTML from template ──
function renderResumeHTML(templateData) {
  const templatePath = path.resolve(__dirname, 'templates', 'resume.hbs');
  const templateSrc = fs.readFileSync(templatePath, 'utf-8');
  const template = Handlebars.compile(templateSrc);
  return template(templateData);
}

// ── Resolve mapping: inject actual bullet text + pass-through static content from profile ──
// This ensures the AI writer works from exact source material, not from memory.
function resolveMapping(profile, mapping) {
  const resolvedExperience = mapping.experience.map((mappedRole) => {
    const origRole =
      profile.experience.find((e) => e.dates === mappedRole.dates) ||
      profile.experience.find((e) => {
        const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
        return norm(e.title).slice(0, 12) === norm(mappedRole.original_title || '').slice(0, 12);
      }) ||
      profile.experience[mapping.experience.indexOf(mappedRole)];

    const resolved_bullets = (mappedRole.selected_bullet_indices || [])
      .map((i) => origRole?.bullets?.[i]?.text)
      .filter(Boolean);

    const company_with_location = origRole
      ? [origRole.company, origRole.location].filter(Boolean).join(', ')
      : mappedRole.company;

    return { ...mappedRole, company_with_location, resolved_bullets };
  });

  const resolved_projects = (mapping.selected_projects || [])
    .map((title) =>
      profile.projects?.find(
        (p) => p.title === title || p.title.split(' —')[0] === title.split(' —')[0],
      ),
    )
    .filter(Boolean)
    .map((p) => ({ title: p.title, description: p.description }));

  const resolved_publications = (mapping.selected_publications || [])
    .map((title) => profile.publications?.find((p) => p.title === title))
    .filter(Boolean)
    .map((p) => ({ title: p.title, url: p.url, description: p.description }));

  const resolved_certifications = (mapping.selected_certifications || []).map((certName) => {
    const orig = profile.certifications?.find(
      (c) => c.name === certName || certName.startsWith(c.name.slice(0, 20)),
    );
    return orig?.tier === 'professional' || orig?.tier === 'associate'
      ? `<strong>${certName}</strong>`
      : certName;
  });

  return {
    ...mapping,
    experience: resolvedExperience,
    resolved_projects,
    resolved_publications,
    resolved_certifications,
  };
}

// ── Assemble template data from agent outputs ──
function assembleTemplateData(profile, resolvedMapping, resumeContent) {
  const mergedExperience = resolvedMapping.experience.map((mappedRole, i) => {
    const writerBullets = resumeContent.experience?.[i]?.bullets;
    return {
      title: mappedRole.original_title,
      company: mappedRole.company_with_location,
      dates: mappedRole.dates,
      bullets: writerBullets?.length ? writerBullets : mappedRole.resolved_bullets,
    };
  });

  return {
    name: profile.name,
    headline: resolvedMapping.headline,
    location: profile.location,
    email: profile.email,
    website: profile.website,
    websiteDisplay: profile.website.replace('https://', ''),
    linkedin: profile.linkedin,
    linkedinDisplay: profile.linkedin.replace('https://', ''),
    github: profile.github,
    githubDisplay: profile.github.replace('https://', ''),
    summary: resumeContent.summary,
    skills: resolvedMapping.skills_grid,
    experience: mergedExperience,
    projects: resolvedMapping.resolved_projects,
    certifications: resolvedMapping.resolved_certifications,
    education: profile.education,
    publications: resolvedMapping.resolved_publications,
  };
}

function deriveOutputName(jdAnalysis, prefix = 'Profile') {
  const company = slugify(jdAnalysis.company || 'Unknown').replace(/-/g, '-') || 'Unknown';
  const role = slugify(jdAnalysis.role || 'Resume') || 'Resume';
  return `${prefix}-${company}-${role}.pdf`
    .replace(/-{2,}/g, '-');
}

/**
 * Runs Agents 1-4: analyze JD → map experience → write+score loop.
 * Pure orchestration — no filesystem/PDF side effects, so it's reusable by
 * both the single-JD CLI and the bulk-apply orchestrator.
 *
 * @param {string} jdText
 * @param {object} profile          - loadProfile() result
 * @param {object} opts
 * @param {string} [opts.model]
 * @param {number} [opts.maxLoops]
 * @param {number} [opts.threshold]
 * @param {boolean} [opts.verbose]
 * @param {function} [opts.logFn]   - (step, message, data) => void, defaults to console log()
 */
async function runResumeAgents(jdText, profile, opts = {}) {
  const model = opts.model || 'claude-sonnet-4-20250514';
  const maxLoops = opts.maxLoops ?? 2;
  const threshold = opts.threshold ?? 80;
  const verbose = !!opts.verbose;
  const logFn = opts.logFn || log;
  const agentOpts = { model };
  const timings = {};

  logFn('agent1', 'Agent 1: Analyzing job description...');
  let t = timer();
  const jdAnalysis = await analyzeJD(jdText, agentOpts);
  timings.agent1 = t.stop();
  if (verbose) logFn('agent1', 'JD Analysis:', jdAnalysis);
  logFn('agent1', `Extracted: ${jdAnalysis.keywords.hard_skills.length} hard skills, ${jdAnalysis.ats_signals.length} ATS signals [${fmtTime(timings.agent1)}]`);

  logFn('agent2', 'Agent 2: Mapping experience to JD...');
  t = timer();
  const experienceMapping = await mapExperience(jdAnalysis, profile, agentOpts);
  timings.agent2 = t.stop();
  if (verbose) logFn('agent2', 'Experience Mapping:', experienceMapping);
  logFn('agent2', `Strategy: ${experienceMapping.strategy_notes} [${fmtTime(timings.agent2)}]`);
  if (experienceMapping.gaps && experienceMapping.gaps.length > 0) {
    logFn('warn', `Gaps identified: ${experienceMapping.gaps.join(', ')}`);
  }

  const resolvedMapping = resolveMapping(profile, experienceMapping);
  const totalResolved = resolvedMapping.experience.reduce((n, r) => n + r.resolved_bullets.length, 0);
  logFn('agent2', `Pre-resolved ${totalResolved} bullets + ${resolvedMapping.resolved_projects.length} projects + ${resolvedMapping.resolved_publications.length} publications from profile`);

  let resumeContent;
  let atsScore;
  let loop = 0;

  while (loop < maxLoops) {
    loop++;
    logFn('agent3', `Agent 3: Writing resume (iteration ${loop})...`);
    t = timer();

    resumeContent =
      loop === 1
        ? await writeResume(jdAnalysis, resolvedMapping, profile, agentOpts)
        : await writeResume(jdAnalysis, { ...resolvedMapping, previous_feedback: atsScore.feedback }, profile, agentOpts);

    const writerTime = t.stop();
    timings[`agent3_iter${loop}`] = writerTime;
    if (verbose) logFn('agent3', 'Resume Content:', resumeContent);

    const contentForScoring = {
      ...resumeContent,
      skills: resolvedMapping.skills_grid,
      projects: resolvedMapping.resolved_projects,
      publications: resolvedMapping.resolved_publications,
    };

    logFn('agent4', `Agent 4: Scoring ATS match (iteration ${loop})... [Writer: ${fmtTime(writerTime)}]`);
    t = timer();
    atsScore = await scoreResume(contentForScoring, jdAnalysis, agentOpts);
    const scorerTime = t.stop();
    timings[`agent4_iter${loop}`] = scorerTime;

    logFn('agent4', `Score: ${atsScore.overall_score}/100 | Keywords: ${atsScore.matched_keywords.length} matched, ${atsScore.missing_keywords.length} missing [${fmtTime(scorerTime)}]`);
    if (verbose) {
      logFn('agent4', 'Score Breakdown:', atsScore.breakdown);
      if (atsScore.feedback.length > 0) logFn('agent4', 'Feedback:', atsScore.feedback);
    }

    if (atsScore.pass && atsScore.overall_score >= threshold) {
      logFn('done', `ATS threshold met (${atsScore.overall_score} >= ${threshold}). Proceeding to render.`);
      break;
    }

    if (loop < maxLoops) {
      logFn('loop', `Score ${atsScore.overall_score} < ${threshold}. Feeding back to Agent 3...`);
      logFn('loop', `Missing: ${atsScore.missing_keywords.slice(0, 10).join(', ')}`);
    } else {
      logFn('warn', `Max loops reached. Proceeding with score ${atsScore.overall_score}/100.`);
    }
  }

  return { jdAnalysis, experienceMapping, resolvedMapping, resumeContent, atsScore, loop, timings };
}

module.exports = {
  log,
  timer,
  fmtTime,
  slugify,
  loadProfile,
  renderResumeHTML,
  resolveMapping,
  assembleTemplateData,
  deriveOutputName,
  runResumeAgents,
};
