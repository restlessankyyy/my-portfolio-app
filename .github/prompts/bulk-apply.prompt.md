---
description: "Batch-generate tailored resumes, cover letters, and application kits for a list of job posting URLs"
---

# Bulk Apply — Batch Job Application Drafts

## Task

Run the bulk-apply orchestrator to produce tailored, ATS-optimized application drafts (resume, cover letter, ATS report, assisted-fill kit) for a batch of job posting URLs.

## Steps

1. **Build the job list** — Copy `scripts/agent/jobs.example.txt` (or `.yaml` for company/role overrides) to `scripts/agent/jobs.txt` (gitignored) and add real posting URLs, one per line.

2. **Run the pipeline**:

   ```bash
   node scripts/agent/bulk-apply.js --input scripts/agent/jobs.txt --model gpt-5.4 --max-loops 2 --threshold 80
   ```

3. **Review outputs** — For each job, check `applications/<slug>/`:
   - `resume.pdf`, `cover-letter.pdf` — tailored documents
   - `ats-report.json` — score + missing keywords
   - `application-kit.json` — contact info + doc paths + fields that need YOUR input (salary, work authorization, start date, relocation — always left blank, never guessed)
   - `applications/manifest.json` — run-level tracker (status per job: `ready_for_review` or `failed`)

4. **Apply manually** — This tool does not log into any job board or submit anything. Open each employer's application page yourself, use the reviewed documents and kit, and submit.

## Key Rules

- Same no-fabrication rules as single-JD generation: never invent metrics, dates, employers, titles, salary, or work-authorization claims
- A failed job (login-gated posting, JD too short to parse, bad URL) does not stop the batch — it's recorded in `manifest.json` and the run continues
- Output lives in `applications/` (gitignored), not `public/assets/` — these are personal drafts, not portfolio-site content
