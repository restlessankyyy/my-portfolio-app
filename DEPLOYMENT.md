# Portfolio Serverless Deployment

This repository contains a modern, serverless portfolio website deployed to AWS Lambda using Terraform Infrastructure as Code.

## 🏗️ Architecture

- **AWS Lambda**: Serverless compute for the Express.js application
- **API Gateway**: HTTP API for routing requests to Lambda
- **S3**: Static asset storage (optional optimization)
- **CloudWatch**: Logging and monitoring
- **Terraform**: Infrastructure as Code deployment

## 🚀 Quick Deployment

### Prerequisites

1. **AWS CLI** configured with appropriate permissions
2. **Terraform** installed (>= 1.0)
3. **Node.js** (>= 18.x)

### Setup

1. **Clone and install dependencies:**
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

- `npm start` - Run locally for development
- `npm run deploy` - Deploy to AWS Lambda
- `npm run deploy:destroy` - Destroy AWS infrastructure
- `npm run terraform:init` - Initialize Terraform
- `npm run terraform:plan` - Plan infrastructure changes
- `npm run terraform:apply` - Apply infrastructure changes

## 🔧 Configuration

Edit `terraform/terraform.tfvars`:

```hcl
# AWS Configuration
aws_region = "us-east-1"
environment = "prod"

# Project Configuration
project_name = "portfolio-ankit"

# Optional: Custom Domain
# domain_name = "your-domain.com"
# certificate_arn = "arn:aws:acm:..."
```

## 🏷️ Infrastructure Components

### Lambda Function
- **Runtime**: Node.js 18.x
- **Memory**: 512 MB
- **Timeout**: 30 seconds
- **Handler**: `lambda.handler`

### API Gateway
- **Type**: HTTP API (v2)
- **CORS**: Enabled
- **Logging**: CloudWatch integration

### Monitoring
- **CloudWatch Logs**: 14-day retention
- **Health Check**: `/health` endpoint
- **Metrics**: Lambda and API Gateway metrics

## 🌐 Local Development

```bash
npm start
# Portfolio available at http://localhost:3000
```

## 📊 Cost Estimation

**Monthly costs (estimated for moderate traffic):**
- Lambda: ~$0.20 (1M requests)
- API Gateway: ~$1.00 (1M requests)
- CloudWatch Logs: ~$0.50
- **Total**: ~$1.70/month

## 🚨 Security Features

- IAM roles with least privilege
- API Gateway throttling
- CloudWatch monitoring
- No hardcoded secrets

## 🗑️ Cleanup

To remove all AWS resources:
```bash
npm run deploy:destroy
```

## 📝 Features

- ✅ Serverless Express.js app
- ✅ EmailJS contact form integration
- ✅ Modern 2026 portfolio design
- ✅ Multi-cloud architect showcase
- ✅ Infrastructure as Code with Terraform
- ✅ Production-ready deployment
- ✅ Cost-optimized architecture

## 🔗 URLs After Deployment

- **Portfolio**: `https://[api-id].execute-api.[region].amazonaws.com`
- **Health Check**: `https://[api-id].execute-api.[region].amazonaws.com/health`
- **CloudWatch Logs**: AWS Console → CloudWatch → Log Groups

---

**Author**: Ankit Raj - Multi-Cloud Solution Architect  
**Portfolio**: Cloud architecture and serverless expertise showcase