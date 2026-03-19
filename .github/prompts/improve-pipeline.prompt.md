---
description: "Improve the agentic pipeline — modify agents, prompts, or scoring logic"
---

# Improve Agentic Pipeline

## Task

Make changes to the 4-agent resume pipeline in `scripts/agent/`.

## Architecture

```text
JD Analyzer → Experience Mapper → Resume Writer → ATS Scorer
(jd-analyzer.js)  (experience-mapper.js)  (resume-writer.js)  (ats-scorer.js)
```

Orchestrator: `generate.js` — runs all agents, renders HTML via Handlebars, generates PDF via Puppeteer.

## Rules

- **candidate-profile.yaml** is the single source of truth for all candidate data
- Agent 3 (Resume Writer) operates in **ENHANCE mode** — it receives pre-resolved bullets and only enhances them
- Job titles: always `original_title` from profile, never `tailored_title`
- Skill categories: 9 canonical labels from `skill_categories` YAML block
- PDF: always use `page.goto('file://')` with a temp HTML file, never `page.setContent()`
- `client.js` auto-routes: `gpt-*` → Azure OpenAI, `claude-*` → Anthropic

## Testing Changes

```bash
# Quick test run (1 loop, skip feedback iteration)
node scripts/agent/generate.js \
  --jd scripts/agent/jds/microsoft-csa.txt \
  --model gpt-5.4 \
  --max-loops 1

# Full test (2 loops, threshold 80)
node scripts/agent/generate.js \
  --jd scripts/agent/jds/microsoft-csa.txt \
  --model gpt-5.4
```

## After Changes

1. Run the pipeline end-to-end and verify ATS score
2. Check PDF text is selectable (not garbled)
3. Confirm job titles and skill labels match profile
4. Commit with `feat:` prefix for new features, `fix:` for bug fixes
5. Changes to `scripts/agent/**` do NOT trigger the main CI/CD pipeline
