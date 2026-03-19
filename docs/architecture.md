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

## Agentic Resume Pipeline

See [agentic-pipeline.md](agentic-pipeline.md) for the full 4-agent AI architecture.
