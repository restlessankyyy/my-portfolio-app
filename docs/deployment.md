# Deployment Guide

## Overview

Portfolio website deployed to **AWS Lambda + API Gateway** via Terraform Infrastructure as Code, with Cloudflare for DNS and SSL.

## Prerequisites

1. **AWS CLI** configured with appropriate permissions
2. **Terraform** >= 1.0
3. **Node.js** >= 24.x

## Quick Deploy

```bash
# 1. Install dependencies
npm install

# 2. Configure Terraform variables
cp terraform/terraform.tfvars.example terraform/terraform.tfvars
# Edit terraform/terraform.tfvars with your settings

# 3. Deploy to AWS
npm run deploy
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Run locally on port 3000 |
| `npm run dev` | Run with hot reload (nodemon) |
| `npm run deploy` | Deploy to AWS Lambda via Terraform |
| `npm run deploy:destroy` | Destroy all AWS infrastructure |
| `npm run terraform:init` | Initialize Terraform |
| `npm run terraform:plan` | Plan infrastructure changes |
| `npm run terraform:apply` | Apply infrastructure changes |

## Terraform Configuration

Edit `terraform/terraform.tfvars`:

```hcl
aws_region   = "eu-north-1"
environment  = "prod"
project_name = "portfolio-ankit"
```

## Infrastructure Components

### Lambda Function

- **Runtime**: Node.js 24.x
- **Memory**: 512 MB
- **Timeout**: 30 seconds
- **Handler**: `lambda.handler`

### API Gateway

- **Type**: HTTP API v2
- **CORS**: Enabled
- **Logging**: CloudWatch integration

### Cloudflare

- **DNS**: A, CNAME, TXT records managed via Terraform
- **SSL**: Full strict mode
- **Page Rules**: Root domain → www redirect

## Docker (Local)

```bash
docker build -t portfolio .
docker run -p 3000:3000 portfolio
```

## Cost Estimate

| Resource | Monthly cost |
|----------|-------------|
| Lambda | ~$0.20 (1M requests) |
| API Gateway | ~$1.00 (1M requests) |
| CloudWatch Logs | ~$0.50 |
| **Total** | **~$1.70/month** |

## Required GitHub Secrets

| Secret | Description |
|--------|-------------|
| `AWS_ACCESS_KEY_ID` | AWS IAM access key |
| `AWS_SECRET_ACCESS_KEY` | AWS IAM secret key |
| `CLOUDFLARE_API_TOKEN` | Cloudflare API token |
| `CLOUDFLARE_ZONE_ID` | Cloudflare zone ID |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account ID |
| `NOTIFICATION_EMAIL` | Email for deploy notifications |

## AWS IAM Permissions

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "lambda:*", "apigateway:*", "s3:*",
        "dynamodb:*", "cloudwatch:*", "logs:*",
        "iam:GetRole", "iam:CreateRole",
        "iam:AttachRolePolicy", "iam:PutRolePolicy", "iam:PassRole",
        "ses:SendEmail", "ses:SendRawEmail", "acm:*"
      ],
      "Resource": "*"
    }
  ]
}
```

## Cloudflare API Token Permissions

- `Zone:DNS:Edit`
- `Zone:Zone Settings:Edit`
- `Zone:Page Rules:Edit`

## Cleanup

```bash
npm run deploy:destroy
```

## Post-Deployment URLs

| Endpoint | URL |
|----------|-----|
| Portfolio | `https://www.ankitraj.cloud` |
| Health Check | `https://www.ankitraj.cloud/health` |
| API Gateway | `https://[api-id].execute-api.[region].amazonaws.com` |
