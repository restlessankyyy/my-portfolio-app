# CI/CD Pipeline

## Workflows

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `ci-cd.yml` | Push to `main`, PRs to `main` | Full pipeline: detect changes → quality → scan → test → terraform → build → deploy → smoke |
| `codeql.yml` | Push/PR to `main` + weekly | CodeQL static analysis for JavaScript |
| `resume-pdf.yml` | Push (`resume-aws-sa.html`) + manual | Auto-regenerate Profile.pdf |
| `resume-nordic-pdf.yml` | Push (`resume-photo.html`) + manual | Auto-regenerate Profile-Nordic.pdf |
| `agentic-resume.yml` | Push (`jds/*.txt`) + manual | 4-agent resume pipeline via Anthropic Claude |
| `agentic-resume-foundry.yml` | Push (`jds/*.txt`) + manual | 4-agent resume pipeline via Azure OpenAI (Foundry) |
| `docs-lint.yml` | Push/PR (docs changes) | Markdown lint and link check |
| `dependabot-automerge.yml` | Dependabot PRs | Auto-merge dependency updates once checks pass |

## Main CI/CD Pipeline Stages

```text
Detect Changes → Code Quality → Security Scan → Tests → Terraform Validate* → Build → Deploy → Smoke Tests → Notify
```

`*` Terraform Validation is conditional (see the gate below).

```mermaid
flowchart TD
    PR[Pull Request to main]:::trigger --> DET
    PUSH[Push to main]:::trigger --> DET

    DET[0. Detect Changes<br/>infra path filter] --> CQ
    CQ[1. Code Quality<br/>ESLint, Prettier, npm audit] --> SS[2. Security Scan<br/>Dependency Review, Secret Scanning]
    SS --> TST[3. Tests<br/>8 unit tests]
    TST --> TFV{4. Terraform Validate<br/>run this job?}
    TFV -- "push to main / infra changed" --> TFRUN[fmt, init, validate, plan]
    TFV -. "app-only PR / Dependabot: skipped" .-> BLD

    TFRUN -. OIDC AssumeRoleWithWebIdentity .-> AWS[(AWS<br/>eu-north-1)]:::aws

    TFRUN --> GATE{Push to main?}
    GATE -- "PR only" --> STOP[Stop: plan posted as PR comment]:::stop
    GATE -- "yes" --> BLD[5. Build<br/>Lambda package]
    BLD --> DEP[6. Deploy<br/>terraform apply + Lambda update]
    DEP -. OIDC AssumeRoleWithWebIdentity .-> AWS
    DEP --> SMK[7. Smoke Tests<br/>health checks]
    SMK --> NTF[8. Notify<br/>deployment status]

    classDef trigger fill:#2563eb,stroke:#1e40af,color:#fff
    classDef aws fill:#ff9900,stroke:#cc7a00,color:#000
    classDef stop fill:#6b7280,stroke:#374151,color:#fff
```

> AWS access is keyless: every AWS-touching job assumes the `portfolio-ankit-github-deploy` IAM role via GitHub OIDC (`id-token: write` + `AWS_ROLE_ARN`). No static AWS keys are stored.

### Path-aware Terraform Validation

The `detect-changes` job (using `dorny/paths-filter`) decides whether the Terraform job runs:

- **Push to `main` / manual dispatch** — always runs, producing the plan the `deploy` job applies.
- **Pull request** — runs only when infra files changed (`terraform/**`, `scripts/build-lambda.sh`, or `ci-cd.yml`). App-only PRs skip it, and the `build` gate accepts the skipped result.
- **Dependabot PRs** — always skipped (read-only token cannot assume the AWS role via OIDC).

| Stage | Job | What it does |
|-------|-----|-------------|
| 0 | `detect-changes` | Path filter: did infra files change? |
| 1 | `code-quality` | ESLint, Prettier, npm audit |
| 2 | `security-scan` | Dependency Review (GitHub Advisory DB) + Secret Scanning |
| 3 | `test` | Unit tests (8 cases) |
| 4 | `terraform-validate` | IaC format check + plan (conditional) |
| 5 | `build` | Lambda package creation |
| 6 | `deploy` | Terraform apply + Lambda update |
| 7 | `smoke-tests` | Post-deploy health checks |
| 8 | `notify` | Deployment status notification |

## Application Lifecycle

End-to-end flow from a local change to the live site at `www.ankitraj.cloud`.

```mermaid
flowchart LR
    DEV[Local dev<br/>npm run dev]:::dev --> VAL[npm run validate<br/>lint, format, tests]
    VAL --> COMMIT[Commit<br/>conventional prefix]
    COMMIT --> BRANCH[Feature branch]
    BRANCH --> OPENPR[Open PR to main]
    OPENPR --> CI[CI checks<br/>quality, scan, test, tf plan]
    CI --> REVIEW{Review<br/>approved?}
    REVIEW -- "changes requested" --> DEV
    REVIEW -- "approved" --> MERGE[Merge to main]:::main
    MERGE --> CD[CD pipeline<br/>build, deploy, smoke]
    CD --> INFRA[AWS Lambda + API Gateway<br/>eu-north-1]:::aws
    INFRA --> CDN[Cloudflare DNS + SSL<br/>full strict]
    CDN --> PROD[Live: www.ankitraj.cloud]:::prod

    classDef dev fill:#10b981,stroke:#047857,color:#fff
    classDef main fill:#2563eb,stroke:#1e40af,color:#fff
    classDef aws fill:#ff9900,stroke:#cc7a00,color:#000
    classDef prod fill:#7c3aed,stroke:#5b21b6,color:#fff
```

## Paths-Ignore

Changes to `scripts/agent/**` do **not** trigger the main CI/CD pipeline (docs/agent code only). Only `jds/*.txt` additions trigger the agentic workflows.

## Dependabot

- **npm** — weekly Monday updates, grouped by dev/prod; minor + patch auto-merge, majors manual.
- **GitHub Actions** — weekly Monday updates, grouped into one PR; all update types (including majors) auto-merge.
- **Auto-merge** — `dependabot-automerge.yml` enables auto-merge (squash) once checks pass, gated on update type + ecosystem; requires the repo `Allow auto-merge` setting.
- **Labels**: `dependencies`, `ci`
- **PR limit**: 10 open PRs max

## Required Secrets

See [deployment.md](deployment.md) for the full secrets list. Additional secrets for the agentic pipeline are in [agentic-pipeline.md](agentic-pipeline.md#github-secrets).
