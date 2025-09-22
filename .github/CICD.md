# CI/CD Documentation

This repository uses GitHub Actions for continuous integration and deployment (CI/CD) to AWS.

## 🚀 Workflows

### 1. Main Deployment (`deploy.yml`)
**Triggers**: Push to `main` or `my-profile-v3-2026` branches
**Purpose**: Validates, builds, and deploys the portfolio to production

**Jobs**:
- **Validate**: Runs tests, linting, and Terraform validation
- **Build**: Creates Lambda deployment package
- **Deploy**: Deploys infrastructure and updates Lambda function
- **Notify**: Sends deployment status notifications

### 2. PR Validation (`pr-validation.yml`)
**Triggers**: Pull requests to `main`
**Purpose**: Validates code quality and infrastructure changes

**Jobs**:
- **Quality**: ESLint, Prettier, security audits
- **Terraform Check**: Validates Terraform configuration
- **Build Test**: Tests Lambda package creation
- **PR Comment**: Posts validation results as PR comment

### 3. Manual Deployment (`manual-deploy.yml`)
**Triggers**: Manual workflow dispatch
**Purpose**: Emergency deployments with custom options

**Options**:
- Environment selection (prod/staging)
- Force deployment (skip validation)
- Lambda-only updates (skip Terraform)

## 🔧 Setup Requirements

### GitHub Secrets
Configure these secrets in your repository settings:

```
AWS_ACCESS_KEY_ID     - AWS access key for deployment
AWS_SECRET_ACCESS_KEY - AWS secret key for deployment
```

### AWS Permissions
The AWS credentials need these permissions:
- Lambda: Full access for function management
- API Gateway: Full access for API management
- ACM: Certificate management
- CloudWatch: Logs access
- IAM: Role and policy management

## 🌍 Deployment Architecture

```
GitHub → GitHub Actions → AWS (eu-north-1)
   ↓
   ├── Build Lambda package
   ├── Run Terraform
   ├── Update Lambda function
   └── Test deployment
```

## 📋 Deployment Process

1. **Code Push/PR**: Triggers validation
2. **Validation**: 
   - Code quality checks (ESLint, Prettier)
   - Security audit (npm audit)
   - Terraform validation
   - Build test
3. **Deployment** (main branch only):
   - Build Lambda package with dependencies
   - Apply Terraform infrastructure changes
   - Update Lambda function code
   - Test deployment health

## 🔄 Environment Configuration

### Production
- **Branch**: `main`, `my-profile-v3-2026`
- **URL**: https://ankitraj.cloud
- **Region**: eu-north-1 (EU North - Stockholm)

### Development
- **Local**: `npm start` (port 3000)
- **Testing**: `npm test`, `npm run lint`

## 🚨 Emergency Procedures

### Quick Lambda Update
Use the Manual Deployment workflow with "Update Lambda only" option.

### Rollback
1. Go to AWS Lambda console
2. Use "Versions" tab to revert to previous version
3. Or redeploy from a previous git commit

### Infrastructure Issues
1. Check Terraform state in AWS
2. Use `terraform plan` locally to see changes
3. Manual fix via AWS console if needed

## 📊 Monitoring

### Health Check
- **Endpoint**: https://ankitraj.cloud/health
- **Expected Response**: `{"status":"healthy","timestamp":"..."}`

### Logs
- **Lambda Logs**: CloudWatch `/aws/lambda/portfolio-ankit-prod-*`
- **API Gateway Logs**: CloudWatch `/aws/apigateway/portfolio-ankit-prod-*`

## 🛠️ Development Workflow

1. **Feature Development**:
   ```bash
   git checkout -b feature/new-feature
   # Make changes
   git commit -m "feat: add new feature"
   git push origin feature/new-feature
   ```

2. **Create PR**: PR validation runs automatically

3. **Review & Merge**: Deployment runs automatically

4. **Monitor**: Check https://ankitraj.cloud

## 📝 Workflow Customization

### Adding Environments
1. Create new environment in GitHub repository settings
2. Add environment-specific secrets
3. Update workflow files with new environment options

### Modifying Deployment Steps
Edit `.github/workflows/deploy.yml`:
- Add new validation steps in `validate` job
- Modify build process in `build` job  
- Customize deployment in `deploy` job

## 🔍 Troubleshooting

### Common Issues

**Deployment Fails**:
- Check AWS credentials and permissions
- Verify Terraform state
- Check CloudWatch logs

**Tests Fail**:
- Run tests locally: `npm test`
- Check ESLint: `npm run lint`
- Fix code quality issues

**Lambda Update Fails**:
- Check package size (max 50MB)
- Verify Lambda function exists
- Check IAM permissions

**DNS/SSL Issues**:
- Verify Cloudflare configuration
- Check ACM certificate status
- Test direct API Gateway endpoint

### Debug Commands

```bash
# Local testing
npm start                    # Start local server
npm test                     # Run tests
npm run lint                 # Check code quality

# AWS CLI debugging
aws lambda list-functions --region eu-north-1
aws apigatewayv2 get-apis --region eu-north-1
aws acm list-certificates --region eu-north-1

# Terraform debugging
cd terraform
terraform plan
terraform validate
terraform state list
```