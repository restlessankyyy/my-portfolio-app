# 🚀 Production CI/CD Pipeline Documentation

## Overview

This repository implements an **enterprise-grade CI/CD pipeline** using GitHub Actions for automated deployment to AWS Lambda + API Gateway.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         CI/CD Pipeline Architecture                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐              │
│  │  Code    │───▶│  Test &  │───▶│  Build   │───▶│  Deploy  │              │
│  │  Push    │    │  Scan    │    │  Package │    │  to AWS  │              │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘              │
│       │               │               │               │                     │
│       │               │               │               │                     │
│       ▼               ▼               ▼               ▼                     │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐              │
│  │ Trigger  │    │ Quality  │    │ Lambda   │    │ Health   │              │
│  │ Pipeline │    │ Security │    │ Artifact │    │ Checks   │              │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 📋 Workflows

### 1. Main CI/CD Pipeline (`ci-cd.yml`)

**Production-ready pipeline with 8 stages:**

| Stage | Job | Description |
|-------|-----|-------------|
| 1 | `code-quality` | ESLint, Prettier, npm audit |
| 2 | `security-scan` | GitLeaks, Trivy vulnerability scanning |
| 3 | `test` | Unit tests, integration tests |
| 4 | `terraform-validate` | IaC validation, format check, plan |
| 5 | `build` | Lambda package creation, artifact upload |
| 6 | `deploy` | Infrastructure + Lambda deployment |
| 7 | `smoke-tests` | Post-deployment validation |
| 8 | `notify` | Deployment status notification |

**Triggers:**
- Push to `main` or `my-profile-v3-2026`
- Pull requests to `main`
- Manual workflow dispatch

### 2. Security Scan (`security-scan.yml`)

**Scheduled weekly security scanning:**

- 📦 NPM dependency audit
- 🔐 Secret detection (GitLeaks)
- 🛡️ Trivy vulnerability scanner
- 🏗️ Checkov IaC security scan

**Schedule:** Every Monday at 9:00 AM UTC

### 3. Dependency Update (`dependency-update.yml`)

**Automated dependency updates:**

- Weekly check for outdated packages
- Automatic PR creation
- Configurable update type (patch/minor/major)

**Schedule:** Every Sunday at 2:00 AM UTC

### 4. Manual Deployment (`manual-deploy.yml`)

**Emergency/manual deployment options:**

- Environment selection (prod/staging)
- Force deployment (skip tests)
- Lambda-only updates
- Infrastructure-only updates

## 🔧 Setup

### Required GitHub Secrets

Configure these secrets in your repository settings (`Settings` → `Secrets and variables` → `Actions`):

| Secret | Description | Required |
|--------|-------------|----------|
| `AWS_ACCESS_KEY_ID` | AWS IAM access key | ✅ |
| `AWS_SECRET_ACCESS_KEY` | AWS IAM secret key | ✅ |
| `SLACK_WEBHOOK` | Slack notification URL | ❌ |

### AWS IAM Permissions

The AWS credentials need these permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "lambda:*",
        "apigateway:*",
        "s3:*",
        "cloudwatch:*",
        "logs:*",
        "iam:GetRole",
        "iam:CreateRole",
        "iam:AttachRolePolicy",
        "iam:PutRolePolicy",
        "iam:PassRole",
        "ses:SendEmail",
        "ses:SendRawEmail",
        "acm:*"
      ],
      "Resource": "*"
    }
  ]
}
```

### Environment Configuration

Create a GitHub Environment named `production`:

1. Go to `Settings` → `Environments`
2. Create `production` environment
3. Add protection rules (optional):
   - Required reviewers
   - Wait timer
   - Deployment branches

## 🏗️ Pipeline Features

### 🔒 Security

- **SAST Scanning**: Static analysis of source code
- **Dependency Audit**: Automated vulnerability detection
- **Secret Detection**: Prevents credential leaks
- **IaC Scanning**: Terraform security best practices

### 📦 Build Optimization

- **Caching**: npm dependency caching
- **Artifact Versioning**: SHA-based artifact naming
- **Minimal Packages**: Production-only dependencies

### 🚀 Deployment

- **Blue/Green Ready**: Version tracking for rollback
- **Health Checks**: Post-deployment validation
- **Automatic Rollback**: On deployment failure

### 📊 Observability

- **GitHub Actions Summary**: Rich deployment reports
- **Artifact Retention**: 30-day build artifacts
- **PR Comments**: Validation results on PRs

## 📈 Pipeline Metrics

The pipeline tracks and reports:

- Build package size
- Build hash (for versioning)
- Deployment ID
- Response times
- Test results

## 🔄 Deployment Flow

### Automatic (Push to main)

```
Push → Validate → Build → Deploy → Smoke Test → Notify
```

### Pull Request

```
PR Open → Validate → Build Test → PR Comment (no deploy)
```

### Manual

```
Trigger → [Skip Tests?] → Build → [Lambda Only?] → Deploy → Health Check
```

## 🚨 Emergency Procedures

### Quick Lambda Update

1. Go to Actions → Manual Deployment
2. Select `lambda-only` deployment type
3. Run workflow

### Rollback

1. Go to AWS Lambda console
2. Find the function: `portfolio-ankit-prod-7ette088`
3. Navigate to Versions
4. Deploy previous version

### Skip Tests (Emergency)

1. Go to Actions → Manual Deployment
2. Check "Skip tests"
3. Run workflow

⚠️ **Warning**: Only use skip tests for critical hotfixes!

## 📊 Monitoring

### GitHub Actions Dashboard

- View all pipeline runs
- Check job status
- Download artifacts
- Review logs

### AWS CloudWatch

- Lambda function metrics
- API Gateway metrics
- Error tracking

## 🔧 Troubleshooting

### Build Failures

1. Check npm audit output
2. Verify package.json dependencies
3. Review build logs

### Deployment Failures

1. Check AWS credentials
2. Verify Terraform state
3. Review Lambda logs

### Health Check Failures

1. Check Lambda function status
2. Verify API Gateway configuration
3. Test endpoint manually

## 📚 Related Files

| File | Description |
|------|-------------|
| `.github/workflows/ci-cd.yml` | Main CI/CD pipeline |
| `.github/workflows/security-scan.yml` | Security scanning |
| `.github/workflows/dependency-update.yml` | Auto dependency updates |
| `.github/workflows/manual-deploy.yml` | Manual deployment |
| `terraform/main.tf` | Infrastructure as Code |
| `scripts/build-lambda.sh` | Lambda build script |

## 🎯 Best Practices

1. **Never push directly to main** - Use PRs for code review
2. **Monitor security scans** - Address vulnerabilities promptly
3. **Review dependency updates** - Test before merging
4. **Use manual deployment carefully** - Document emergency deploys
5. **Keep secrets secure** - Rotate credentials regularly

---

*Last updated: December 2025*
