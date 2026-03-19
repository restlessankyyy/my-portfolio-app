---
description: "Generate an ATS-optimized resume from a job description using the 4-agent pipeline"
---

# Generate Resume from Job Description

## Task

Run the agentic resume pipeline to produce a tailored, ATS-optimized resume PDF from a job description.

## Steps

1. **Save the JD** — Create a `.txt` file in `scripts/agent/jds/` with the job description text (use a slugified name, e.g. `amazon-sa.txt`).

2. **Run the pipeline** — Execute the orchestrator:
   ```bash
   node scripts/agent/generate.js --jd scripts/agent/jds/<filename>.txt --model gpt-5.4 --max-loops 2 --threshold 80
   ```

3. **Review outputs** — Check the generated files:
   - Resume PDF in `public/assets/`
   - ATS score report JSON in `public/assets/`
   - Debug HTML in `public/assets/`

4. **Validate** — Confirm:
   - ATS score meets threshold (≥ 80)
   - Job titles match `candidate-profile.yaml` exactly (never AI-tailored)
   - Skill category labels are from the 9 canonical categories
   - PDF text is selectable (not garbled) — copy-paste a sentence to verify

## Key Rules

- **NEVER** invent metrics, dates, or job titles — only enhance what's in the profile
- **NEVER** use `page.setContent()` for PDF generation — always `page.goto('file://')`
- Job titles come from `candidate-profile.yaml` `original_title` field only
- Skill labels come from `skill_categories` YAML block only
