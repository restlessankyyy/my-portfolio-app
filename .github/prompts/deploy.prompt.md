---
description: "Deploy portfolio to AWS Lambda or manage Terraform infrastructure"
---

# Deploy to AWS

## Task

Deploy the portfolio website to AWS Lambda + API Gateway via Terraform.

## Quick Deploy

```bash
npm run deploy
```

## Step-by-Step

1. **Validate locally**:

   ```bash
   npm run validate  # lint + format + tests
   ```

2. **Check Terraform**:

   ```bash
   cd terraform && terraform init && terraform plan
   ```

3. **Deploy**:

   ```bash
   npm run deploy
   ```

4. **Smoke test**:

   ```bash
   curl -s https://www.ankitraj.cloud/health | jq .
   ```

## Destroy

```bash
npm run deploy:destroy
```

## Required Secrets

- `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`
- `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ZONE_ID`, `CLOUDFLARE_ACCOUNT_ID`

## Notes

- All AWS resources in `eu-north-1`
- Terraform state in S3 with DynamoDB locking
- Push to `main` triggers automatic CI/CD deployment
