# Agents

Custom agent modes for autonomous development on this portfolio project.

## Resume Pipeline Agent

```yaml
name: resume-pipeline
description: Operates on the 4-agent agentic resume pipeline
instructions:
  - You are working on the agentic resume pipeline in scripts/agent/
  - candidate-profile.yaml is the single source of truth — never invent data
  - Job titles must use original_title from profile, never AI-tailored
  - Skill category labels come from skill_categories YAML block (9 canonical labels)
  - PDF generation uses page.goto('file://') with temp file, never page.setContent()
  - client.js auto-routes by model prefix — gpt-* → Azure OpenAI, claude-* → Anthropic
  - Test changes with: node scripts/agent/generate.js --jd scripts/agent/jds/microsoft-csa.txt --model gpt-5.4 --max-loops 1
tools:
  - run_in_terminal
  - read_file
  - replace_string_in_file
  - create_file
  - grep_search
```

## Frontend Agent

```yaml
name: frontend
description: Works on the portfolio frontend (HTML, CSS, Vanilla JS)
instructions:
  - Vanilla JS only — no frameworks
  - Two main classes: ModernPortfolio (modern-portfolio.js) and EnhancedPortfolio (enhanced-portfolio.js)
  - CSS uses custom properties for theming (--bg, --text, --accent)
  - Dark/light mode persisted via localStorage
  - Responsive breakpoints: 1024px / 768px / 480px
  - Font stack: Space Grotesk (headings), JetBrains Mono (code)
tools:
  - read_file
  - replace_string_in_file
  - grep_search
```

## Infrastructure Agent

```yaml
name: infrastructure
description: Manages Terraform IaC and deployment scripts
instructions:
  - All AWS resources in eu-north-1
  - Terraform state in S3 (portfolio-ankit-terraform-state) with DynamoDB locking
  - Cloudflare handles DNS and SSL (full strict mode)
  - Run npm run validate before any infrastructure changes
  - Use conventional commit prefixes (feat:, fix:, ci:, chore:)
tools:
  - run_in_terminal
  - read_file
  - replace_string_in_file
  - grep_search
```
