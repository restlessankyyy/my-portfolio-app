# Copilot Instructions — my-portfolio-app

## Project Overview

Personal portfolio website for **Ankit Raj** — Lead Solution Architect & Multi-Cloud Engineer.  
Live at [https://www.ankitraj.cloud](https://www.ankitraj.cloud).

- **Stack**: Node.js 24, Express, Vanilla JS (ES6+ classes), CSS3 custom properties, Puppeteer PDF generation
- **Deployment**: AWS Lambda + API Gateway via Terraform, Cloudflare DNS/SSL
- **CI/CD**: GitHub Actions (lint → security scan → test → build → deploy → smoke test)

## Repository Structure

```text
public/                  → Static frontend (served by Express)
  index.html             → Main portfolio page (cinematic dark theme)
  assets/Profile.pdf     → Primary resume PDF (AWS SA variant)
  assets/Profile-Nordic.pdf → Nordic photo resume variant
  css/modern-style.css   → All styles (dark/light themes, animations, responsive)
  js/modern-portfolio.js → Core JS: cursor, typing, filters, theme, nav
  js/enhanced-portfolio.js → Perf: lazy load, a11y, parallax
  js/emailjs-config.js   → EmailJS contact form integration
scripts/
  resume-aws-sa.html     → Primary resume HTML template (AWS Solutions Architect)
  resume-photo.html      → Nordic resume with photo
  generate-pdf-aws-sa.js → Puppeteer: resume-aws-sa.html → public/assets/Profile.pdf
  generate-pdf-photo.js  → Puppeteer: resume-photo.html → public/assets/Profile-Nordic.pdf
  generate-pdf.js        → Alias script (also generates Profile.pdf from resume-aws-sa.html)
  agent/                 → 🤖 Agentic Resume Pipeline
    generate.js          → Orchestrator — CLI entry point (runs all 4 agents)
    jd-analyzer.js       → Agent 1: parse JD → requirements, keywords, seniority
    experience-mapper.js → Agent 2: map profile bullets to JD, build skills grid
    resume-writer.js     → Agent 3: enhance bullets (ENHANCE mode, never invents data)
    ats-scorer.js        → Agent 4: score resume vs JD (0-100), feedback loop
    client.js            → Unified AI client (Azure OpenAI + Anthropic auto-routing)
    candidate-profile.yaml → Single source of truth for candidate data
    jds/                 → Job description text files (adding a .txt triggers pipeline)
terraform/               → AWS infra (Lambda, API GW, S3, SES, IAM)
  cloudflare/            → Cloudflare DNS records
  backend/               → S3 remote state config
docs/                    → Documentation (architecture, pipeline, CI/CD, deployment)
tests/server.test.js     → 8 unit tests (health, static, contact, SPA)
server.js                → Express server (port 3000)
lambda.js                → AWS Lambda handler (@vendia/serverless-express)
```

## Key Conventions

### Resume / PDF Generation

- The **primary resume** is `scripts/resume-aws-sa.html` → generates `public/assets/Profile.pdf`
- The **Nordic resume** is `scripts/resume-photo.html` → generates `public/assets/Profile-Nordic.pdf`
- The website download button links to `./assets/Profile.pdf`
- Resume HTML uses inline CSS with `break-inside: avoid` on `.job` elements to prevent page splits
- Publication titles must include hyperlinks to their Medium/FAUN articles
- After editing any resume HTML, regenerate with `node scripts/generate-pdf-aws-sa.js` or `node scripts/generate-pdf-photo.js`
- PDF margins: AWS resume `8mm top/bottom`, Nordic `10mm top/bottom`, both `0mm left/right`

### Frontend

- Vanilla JS only — no frameworks. Two main classes: `ModernPortfolio` and `EnhancedPortfolio`
- CSS uses custom properties for theming (`--bg`, `--text`, `--accent`, etc.)
- Dark/light mode is persistent via `localStorage`
- Responsive breakpoints: 1024px / 768px / 480px
- Font stack: Space Grotesk (headings), JetBrains Mono (code), Inter (resume)

### Backend

- Express.js serves static files from `public/` and a health endpoint at `/health`
- Contact form POST at `/api/contact` (AWS SES)
- Lambda deployment wraps Express via `@vendia/serverless-express`

### Infrastructure

- All AWS resources in `eu-north-1`
- Terraform state in S3 (`portfolio-ankit-terraform-state`) with DynamoDB locking
- Cloudflare handles DNS and SSL (full strict mode)

### Code Quality

- Run `npm run validate` before committing (lint + format check + tests)
- ESLint for JS, Prettier for formatting
- Security: CodeQL, Dependabot, npm audit, Gitleaks, Trivy all run in CI

### Git

- Branch from `main`, use conventional commit prefixes: `feat:`, `fix:`, `docs:`, `ci:`, `chore:`
- Push triggers full CI/CD pipeline to Lambda
- Resume HTML changes trigger `resume-pdf.yml` workflow
- Changes to `scripts/agent/**` do NOT trigger the main CI/CD pipeline
- Adding `.txt` to `scripts/agent/jds/` triggers both agentic resume workflows

### Agentic Resume Pipeline

- 4-agent architecture: JD Analyzer → Experience Mapper → Resume Writer → ATS Scorer
- **ENHANCE mode**: Agent 3 enhances pre-resolved bullets only — never invents metrics, dates, or titles
- **Profile-locked titles**: Job titles always come from `candidate-profile.yaml`, never AI-generated
- **Skill category labels**: 9 canonical labels from `skill_categories` YAML block, never AI-chosen
- **Dual provider**: `client.js` auto-routes to Azure OpenAI (`gpt-*`) or Anthropic (`claude-*`) by model prefix
- **PDF generation**: Uses `page.goto('file://')` with a temp HTML file (not `page.setContent()`) to fix Google Fonts in PDF text layer
- **ATS loop**: Iterates up to `--max-loops` times until `--threshold` is met (default: 2 loops, 80/100)
- Run locally: `node scripts/agent/generate.js --jd scripts/agent/jds/microsoft-csa.txt --model gpt-5.4`

## Common Tasks

| Task | Command |
|------|---------|
| Run locally | `npm start` → `http://localhost:3000` |
| Dev with hot reload | `npm run dev` |
| Run tests | `npm test` |
| Lint + format + test | `npm run validate` |
| Generate primary resume PDF | `node scripts/generate-pdf-aws-sa.js` |
| Generate Nordic resume PDF | `node scripts/generate-pdf-photo.js` |
| Generate Microsoft CSA resume PDF | `node scripts/generate-pdf-microsoft-csa.js` |
| Run agentic pipeline (Azure) | `node scripts/agent/generate.js --jd scripts/agent/jds/microsoft-csa.txt --model gpt-5.4` |
| Run agentic pipeline (Claude) | `node scripts/agent/generate.js --jd scripts/agent/jds/microsoft-csa.txt` |
| Deploy to AWS | `npm run deploy` |
| Destroy infrastructure | `npm run deploy:destroy` |
