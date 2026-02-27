# Portfolio Serverless Deployment

Modern, serverless portfolio website deployed to AWS Lambda via Terraform Infrastructure as Code.

## 🏗️ Architecture

```
Cloudflare (DNS/SSL) → API Gateway (HTTP v2) → Lambda (Node.js 22) → SES / S3 / CloudWatch
```

- **AWS Lambda** — Serverless Express.js (Node.js 22.x, 512MB, 30s timeout)
- **API Gateway** — HTTP API v2 with CORS enabled
- **S3** — Static asset storage + Terraform remote state
- **SES** — Contact form email with DKIM verification
- **CloudWatch** — Logs (14-day retention) + metrics
- **Cloudflare** — DNS, full strict SSL, page rules
- **Terraform** — All infrastructure defined as code

## 🚀 Quick Deployment

### Prerequisites

1. **AWS CLI** configured with appropriate permissions
2. **Terraform** >= 1.0
3. **Node.js** >= 22.x

### Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure deployment:**
   ```bash
   cp terraform/terraform.tfvars.example terraform/terraform.tfvars
   # Edit terraform.tfvars with your settings
   ```

3. **Deploy to AWS:**
   ```bash
   npm run deploy
   ```

## 📋 Available Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Run locally on port 3000 |
| `npm run dev` | Run with hot reload (nodemon) |
| `npm run deploy` | Deploy to AWS Lambda |
| `npm run deploy:destroy` | Destroy AWS infrastructure |
| `npm run terraform:init` | Initialize Terraform |
| `npm run terraform:plan` | Plan infrastructure changes |
| `npm run terraform:apply` | Apply infrastructure changes |

## 🔧 Configuration

Edit `terraform/terraform.tfvars`:

```hcl
# AWS Configuration
aws_region  = "eu-north-1"
environment = "prod"

# Project Configuration
project_name = "portfolio-ankit"

# Optional: Custom Domain
# domain_name     = "ankitraj.cloud"
# certificate_arn = "arn:aws:acm:..."
```

## 🏷️ Infrastructure Components

### Lambda Function
- **Runtime**: Node.js 22.x
- **Memory**: 512 MB
- **Timeout**: 30 seconds
- **Handler**: `lambda.handler`

### API Gateway
- **Type**: HTTP API (v2)
- **CORS**: Enabled
- **Logging**: CloudWatch integration

### Remote State
- **S3 Bucket**: `portfolio-ankit-terraform-state`
- **DynamoDB Lock**: `portfolio-ankit-terraform-locks`
- **Region**: eu-north-1


### Docker
```bash
# Build and run locally
docker build -t portfolio .
docker run -p 3000:3000 portfolio
```
- **Base image**: `node:22-alpine`

## 🌐 Local Development

```bash
npm start
# → http://localhost:3000
```

## 📊 Cost Estimation

**Monthly costs (estimated for moderate traffic):**

| Resource | Cost |
|----------|------|
| Lambda | ~$0.20 (1M requests) |
| API Gateway | ~$1.00 (1M requests) |
| CloudWatch Logs | ~$0.50 |
| **Total** | **~$1.70/month** |

## 🛡️ Security

- IAM roles with least privilege
- API Gateway throttling
- CloudWatch monitoring
- No hardcoded secrets
- CodeQL + Dependabot + npm audit in CI
- npm overrides for transitive CVE patches

## 🔄 CI/CD Integration

Deployment is automated via GitHub Actions on push to `main`:

```
Lint → Security Scan → Test → Terraform Validate → Build → Deploy → Smoke Test → Notify
```

See [README.md](README.md) for full workflow details.

## 🗑️ Cleanup

```bash
# Remove all AWS resources
npm run deploy:destroy
```

## 🔗 URLs After Deployment

| Endpoint | URL |
|----------|-----|
| **Portfolio** | `https://www.ankitraj.cloud` |
| **Health Check** | `https://www.ankitraj.cloud/health` |
| **API Gateway** | `https://[api-id].execute-api.[region].amazonaws.com` |
| **CloudWatch Logs** | AWS Console → CloudWatch → Log Groups |

---

**Author**: Ankit Raj — Lead Solution Architect & Multi-Cloud Engineer  
**Contact**: rajankit749@gmail.com