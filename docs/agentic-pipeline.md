# Agentic Resume Pipeline

A 4-agent AI system that generates ATS-optimized, tailored resume PDFs from a job description. Supports dual AI providers: **Azure OpenAI via Microsoft AI Foundry** and **Anthropic Claude**.

## Architecture

```text
  JD Text File
      │
      ▼
┌─────────────────┐
│  Agent 1        │  jd-analyzer.js
│  JD Analyzer    │  → Extracts required skills, seniority,
│                 │    keywords, responsibilities
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Agent 2        │  experience-mapper.js
│  Experience     │  → Maps candidate profile bullets to JD,
│  Mapper         │    builds skills grid from profile YAML
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Agent 3        │  resume-writer.js  (ENHANCE mode)
│  Resume Writer  │  → Enhances pre-resolved bullets,
│                 │    preserves all metrics & tech names
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Agent 4        │  ats-scorer.js
│  ATS Scorer     │  → Scores resume vs JD (0-100),
│                 │    iterates until score ≥ threshold
└────────┬────────┘
         │
         ▼
  Resume PDF + ATS Report
  (workflow artifacts)
```

## Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| **ENHANCE mode** | Agent 3 receives pre-resolved bullets from the profile and only enhances them; never invents metrics, dates, or job titles |
| **Profile-locked titles** | Job titles always come from `candidate-profile.yaml`, never AI-generated |
| **Skill category labels** | 9 canonical labels from `skill_categories` YAML block, never AI-chosen |
| **Dual provider support** | `client.js` auto-routes to Azure OpenAI (gpt-*) or Anthropic (claude-*) based on model name prefix |
| **PDF generation** | Puppeteer uses `page.goto('file://')` with a temp HTML file to ensure Google Fonts load correctly in the PDF text layer |
| **ATS feedback loop** | Pipeline iterates (default: 2 loops, threshold: 80/100) until score target is met |

## File Structure

```text
scripts/agent/
├── generate.js           # Single-JD orchestrator — CLI entry point (CI-triggered)
├── bulk-apply.js         # Batch orchestrator — many job URLs in one run
├── pipeline.js           # Shared Agents 1-4 core, reused by both orchestrators
├── pdf-render.js         # Shared puppeteer PDF renderer
├── jd-fetcher.js         # Loads a job posting URL → extracted JD text (bulk-apply only)
├── jd-analyzer.js        # Agent 1: parse JD → requirements
├── experience-mapper.js  # Agent 2: map profile → JD bullets + skills grid
├── resume-writer.js      # Agent 3: enhance bullets (ENHANCE mode)
├── ats-scorer.js         # Agent 4: score resume vs JD (0-100)
├── cover-letter-writer.js # Agent 5: draft cover letter (bulk-apply only)
├── application-kit.js    # Builds the per-job assisted-fill review sheet
├── client.js             # Unified AI client (Azure OpenAI + Anthropic)
├── candidate-profile.yaml # Single source of truth for candidate data
├── estimate-tokens.js    # Token estimation utility
├── jobs.example.txt      # Bulk Apply input format example (URLs)
├── jobs.example.yaml     # Bulk Apply input format example (URLs + metadata)
└── jds/                  # Job description text files (trigger pipeline)
    └── microsoft-csa.txt
```

## Bulk Apply — Batch Mode

`bulk-apply.js` runs the same 4 agents across a list of job posting URLs, plus a 5th agent for a cover letter, and writes review-ready output per job to `applications/<company-role-slug>/` (gitignored — these are personal drafts, not part of the deployed portfolio site under `public/`):

```text
applications/<slug>/
├── jd.txt                 # Extracted job description text
├── resume.pdf              # Tailored resume
├── cover-letter.pdf        # Tailored cover letter
├── ats-report.json         # Score + keyword coverage
└── application-kit.json    # Contact info, doc paths, key skills — fields
                             # needing a human decision (salary, work auth,
                             # start date, relocation) are always left null
applications/manifest.json  # Tracker for every job run (status, score, path)
```

```bash
# jobs.txt: one job posting URL per line ('#' comments OK)
node scripts/agent/bulk-apply.js --input scripts/agent/jobs.txt

# Full options
node scripts/agent/bulk-apply.js \
  --input <path>       # jobs.txt (one URL/line) or jobs.yaml ({ jobs: [{url, company?, role?}] })
  --model <model>       # AI model (default: claude-sonnet-4-20250514)
  --max-loops <n>       # Max ATS feedback iterations per job (default: 2)
  --threshold <n>       # ATS score target (default: 80)
  --delay <ms>          # Delay between jobs, be polite to target sites (default: 3000)
  --out-dir <path>      # Output root (default: ./applications)
  --verbose             # Print intermediate agent outputs
```

**This tool never logs into a job board and never submits an application.** It loads the public posting page (via puppeteer, same as a browser would), tailors documents from `candidate-profile.yaml`, and stops at a reviewable draft. You check each `application-kit.json` + PDF pair and apply yourself on the employer's site. A failed job (bad URL, login-gated posting, JD too short to parse) is recorded in `manifest.json` with `status: "failed"` and the run continues with the next job.

## AI Providers

### Azure OpenAI (Microsoft AI Foundry)

Used for `gpt-*` models.

```bash
export AZURE_OPENAI_ENDPOINT=https://<resource>.cognitiveservices.azure.com/
export AZURE_OPENAI_API_KEY=<key>
export AZURE_OPENAI_API_VERSION=2024-12-01-preview
```

### Anthropic Claude

Used for `claude-*` models.

```bash
export ANTHROPIC_API_KEY=<key>
```

## Local Usage

```bash
# Azure OpenAI — gpt-5.4
node scripts/agent/generate.js \
  --jd scripts/agent/jds/microsoft-csa.txt \
  --model gpt-5.4

# Anthropic Claude
node scripts/agent/generate.js \
  --jd scripts/agent/jds/microsoft-csa.txt \
  --model claude-sonnet-4-20250514

# Full options
node scripts/agent/generate.js \
  --jd <path>          # Path to JD text file (required)
  --output <name>      # Output PDF filename (auto-generated if omitted)
  --model <model>      # AI model (default: claude-sonnet-4-20250514)
  --max-loops <n>      # Max ATS feedback iterations (default: 2)
  --threshold <n>      # ATS score target (default: 80)
  --verbose            # Print intermediate agent outputs
```

## Supported Models

| Model | Provider | Notes |
|-------|----------|-------|
| `gpt-5.4` | Azure OpenAI | Recommended for quality |
| `claude-sonnet-4-20250514` | Anthropic | Default |
| `claude-haiku-4-20250514` | Anthropic | Faster/cheaper |

## GitHub Actions Workflows

### `agentic-resume-foundry.yml` — Azure OpenAI

- **Trigger**: Push `scripts/agent/jds/*.txt` to `main` or manual dispatch
- **Model**: `gpt-5.4` (default, selectable via input)
- **Secrets required**: `AZURE_OPENAI_ENDPOINT`, `AZURE_OPENAI_API_KEY`, `AZURE_OPENAI_API_VERSION`
- **Artifacts**: Resume PDF, ATS score report (JSON), debug HTML

### `agentic-resume.yml` — Anthropic Claude

- **Trigger**: Push `scripts/agent/jds/*.txt` to `main` or manual dispatch
- **Model**: `claude-sonnet-4-20250514` (default, selectable via input)
- **Secrets required**: `ANTHROPIC_API_KEY`
- **Artifacts**: Resume PDF, ATS score report (JSON), debug HTML

## Adding a New Job Description

1. Drop a `.txt` file into `scripts/agent/jds/`
2. Push to `main` — both agentic workflows trigger automatically
3. Download the resume PDF + ATS report from workflow artifacts

## GitHub Secrets

| Secret | Description |
|--------|-------------|
| `AZURE_OPENAI_ENDPOINT` | Azure AI Foundry endpoint URL |
| `AZURE_OPENAI_API_KEY` | Azure OpenAI API key |
| `AZURE_OPENAI_API_VERSION` | API version (default: `2024-12-01-preview`) |
| `AZURE_OPENAI_DEPLOYMENT` | Deployment name (default: `gpt-5.4`) |
| `ANTHROPIC_API_KEY` | Anthropic API key for Claude models |

## candidate-profile.yaml

Single source of truth for all candidate data. Key sections:

- `personal` — name, contact, headline
- `summary` — professional summary
- `skill_categories` — 9 canonical skill labels (locked, never AI-modified)
- `experience[]` — roles with `original_title`, `resolved_bullets`
- `projects[]`, `publications[]`, `certifications[]` — passed through as-is
