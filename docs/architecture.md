# System Architecture

## Portfolio Infrastructure

```text
                    ┌─────────────┐
                    │  Cloudflare │
                    │   DNS/SSL   │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │ API Gateway │
                    │  (HTTP v2)  │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │   Lambda    │
                    │ (Node.js 24)│
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
       ┌──────▼──────┐ ┌───▼───┐ ┌─────▼─────┐
       │    SES      │ │  S3   │ │CloudWatch │
       │  (Email)    │ │(State)│ │  (Logs)   │
       └─────────────┘ └───────┘ └───────────┘
```

## AWS Resources

| Resource | Config |
|----------|--------|
| Lambda | Node.js 24.x, 512 MB, 30s timeout |
| API Gateway | HTTP API v2 with CORS |
| ACM Certificate | SSL for custom domain |
| SES | Email with DKIM verification |
| S3 | Static assets + Terraform state |
| CloudWatch | Logs (14-day retention) + metrics |

## Cloudflare

- **DNS** — A, CNAME, TXT records
- **SSL** — Full (strict) mode
- **Page Rules** — Root domain → www redirect

## Terraform Remote State

| Resource | Name |
|----------|------|
| S3 Bucket | `portfolio-ankit-terraform-state` |
| DynamoDB Table | `portfolio-ankit-terraform-locks` |
| Region | `eu-north-1` |

State file locations:

- AWS: `s3://portfolio-ankit-terraform-state/portfolio/aws/terraform.tfstate`
- Cloudflare: `s3://portfolio-ankit-terraform-state/portfolio/cloudflare/terraform.tfstate`

## CI/CD Pipeline

The `ci-cd.yml` workflow gates deploys behind quality, security, and infrastructure checks. All AWS access is keyless via GitHub OIDC (no static keys).

```text
Detect Changes → Code Quality → Security Scan → Tests → Terraform Validate* → Build → Deploy → Smoke Tests → Notify
```

`*` Terraform Validation is conditional:

- **Push to `main` / manual dispatch** — always runs, producing the plan the `deploy` job applies.
- **Pull request** — runs only when infra files changed (`terraform/**`, `scripts/build-lambda.sh`, or `ci-cd.yml`), detected by the `detect-changes` job. App-only PRs skip it, and `build` accepts the skipped result.
- **Dependabot PRs** — always skipped (read-only token cannot assume the AWS role via OIDC).

Change detection uses `dorny/paths-filter`; the infra path list lives in the `detect-changes` job.

### Dependency automation (Dependabot)

- **npm** — weekly, grouped by dev/prod; minor + patch auto-merge, majors manual.
- **GitHub Actions** — weekly, grouped into one PR; all update types (including majors) auto-merge.
- Auto-merge is driven by `dependabot-automerge.yml` (squash, after checks pass) with the repo-level `Allow auto-merge` setting enabled.

See [cicd.md](cicd.md) for the full stage-by-stage reference.

## Agentic Resume Pipeline

See [agentic-pipeline.md](agentic-pipeline.md) for the full 4-agent AI architecture.
