# Terraform configuration for Portfolio Serverless Deployment
terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Remote state configuration - S3 backend with DynamoDB locking
  backend "s3" {
    bucket         = "portfolio-ankit-terraform-state"
    key            = "portfolio/aws/terraform.tfstate"
    region         = "eu-north-1"
    encrypt        = true
    dynamodb_table = "portfolio-ankit-terraform-locks"
  }
}

# Configure AWS Provider
provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "portfolio-serverless"
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}

# Random suffix for unique resource names
resource "random_string" "suffix" {
  length  = 8
  special = false
  upper   = false
}

# S3 Bucket for static assets (optional - for optimized static serving)
resource "aws_s3_bucket" "portfolio_assets" {
  bucket = "${var.project_name}-assets-${random_string.suffix.result}"
}

resource "aws_s3_bucket_public_access_block" "portfolio_assets_pab" {
  bucket = aws_s3_bucket.portfolio_assets.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

resource "aws_s3_bucket_website_configuration" "portfolio_assets_website" {
  bucket = aws_s3_bucket.portfolio_assets.id

  index_document {
    suffix = "index.html"
  }

  error_document {
    key = "error.html"
  }
}

# IAM Role for Lambda
resource "aws_iam_role" "lambda_role" {
  name = "${var.project_name}-lambda-role-${random_string.suffix.result}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

# IAM Policy for Lambda Basic Execution
resource "aws_iam_role_policy_attachment" "lambda_basic_execution" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# IAM Policy for SES (Contact Form Email)
resource "aws_iam_role_policy" "lambda_ses_policy" {
  name = "${var.project_name}-lambda-ses-policy"
  role = aws_iam_role.lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ses:SendEmail",
          "ses:SendRawEmail"
        ]
        Resource = "*"
      }
    ]
  })
}

# Lambda Function
resource "aws_lambda_function" "portfolio" {
  filename      = "${path.module}/portfolio-lambda.zip"
  function_name = "${var.project_name}-${var.environment}-${random_string.suffix.result}"
  role          = aws_iam_role.lambda_role.arn
  handler       = "lambda.handler"
  runtime       = "nodejs22.x"
  timeout       = 30
  memory_size   = 512

  # Use data source to handle missing file during validation
  source_code_hash = fileexists("${path.module}/portfolio-lambda.zip") ? filebase64sha256("${path.module}/portfolio-lambda.zip") : null

  environment {
    variables = {
      NODE_ENV = var.environment
    }
  }

  depends_on = [
    aws_iam_role_policy_attachment.lambda_basic_execution,
    aws_cloudwatch_log_group.lambda_logs,
  ]

  lifecycle {
    ignore_changes = [source_code_hash] # Lambda code is updated separately via CLI
  }
}

# CloudWatch Log Group
resource "aws_cloudwatch_log_group" "lambda_logs" {
  name              = "/aws/lambda/${var.project_name}-${var.environment}-${random_string.suffix.result}"
  retention_in_days = var.log_retention_days
}

# CloudWatch Log Group for API Gateway access logs.
#
# API Gateway v2 does not support clearing access logging in place: an empty
# AccessLogSettings is treated as "no change" and empty destination/format
# values are rejected, so logging that was once enabled cannot be removed
# without recreating the stage (which would cascade to the live custom-domain
# mappings). Instead of disabling it, we keep access logging on but make the
# destination Terraform-managed with the same short retention as the Lambda
# logs. This bounds cost to a single day of ingestion (effectively zero at this
# traffic level) and, critically, guarantees the log destination always exists
# so stage updates never fail with LogDestinationNotFoundException.
resource "aws_cloudwatch_log_group" "apigw_access_logs" {
  name              = "/aws/apigateway/${var.project_name}-${var.environment}-${random_string.suffix.result}"
  retention_in_days = var.log_retention_days
}

# API Gateway
resource "aws_apigatewayv2_api" "portfolio_api" {
  name          = "${var.project_name}-api-${random_string.suffix.result}"
  protocol_type = "HTTP"
  description   = "Portfolio Serverless API"

  cors_configuration {
    allow_credentials = false
    allow_headers     = ["content-type", "x-amz-date", "authorization", "x-api-key"]
    allow_methods     = ["*"]
    allow_origins     = ["*"]
    expose_headers    = ["date", "keep-alive"]
    max_age           = 86400
  }
}

# API Gateway Stage
resource "aws_apigatewayv2_stage" "portfolio_stage" {
  api_id      = aws_apigatewayv2_api.portfolio_api.id
  name        = var.environment
  auto_deploy = true

  # Access logging is intentionally kept minimal rather than disabled. API
  # Gateway v2 cannot clear access logging in place once it has been enabled, so
  # we point it at a Terraform-managed log group with one-day retention (see
  # aws_cloudwatch_log_group.apigw_access_logs). This keeps ingestion cost
  # negligible while ensuring the destination always exists, so stage updates
  # never fail with LogDestinationNotFoundException.
  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.apigw_access_logs.arn
    format = jsonencode({
      httpMethod     = "$context.httpMethod"
      ip             = "$context.identity.sourceIp"
      protocol       = "$context.protocol"
      requestId      = "$context.requestId"
      requestTime    = "$context.requestTime"
      responseLength = "$context.responseLength"
      routeKey       = "$context.routeKey"
      status         = "$context.status"
    })
  }
}

# ==================== Cost Guardrail ====================

# Monthly cost budget with email alerts. Catches unexpected spend (e.g. abusive
# traffic inflating API Gateway / data-transfer charges on the public endpoint)
# well before it becomes material. Budgets and their notifications are free.
resource "aws_budgets_budget" "monthly_cost" {
  name         = "${var.project_name}-monthly-cost"
  budget_type  = "COST"
  limit_amount = tostring(var.monthly_budget_limit_usd)
  limit_unit   = "USD"
  time_unit    = "MONTHLY"

  # Alert when actual spend reaches 80% of the limit.
  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 80
    threshold_type             = "PERCENTAGE"
    notification_type          = "ACTUAL"
    subscriber_email_addresses = var.budget_alert_emails
  }

  # Alert when actual spend exceeds 100% of the limit.
  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 100
    threshold_type             = "PERCENTAGE"
    notification_type          = "ACTUAL"
    subscriber_email_addresses = var.budget_alert_emails
  }

  # Early warning: alert when forecasted month-end spend exceeds the limit.
  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 100
    threshold_type             = "PERCENTAGE"
    notification_type          = "FORECASTED"
    subscriber_email_addresses = var.budget_alert_emails
  }
}

# API Gateway Integration
resource "aws_apigatewayv2_integration" "portfolio_integration" {
  api_id = aws_apigatewayv2_api.portfolio_api.id

  integration_uri    = aws_lambda_function.portfolio.invoke_arn
  integration_type   = "AWS_PROXY"
  integration_method = "POST"
}

# API Gateway Route (catch all)
resource "aws_apigatewayv2_route" "portfolio_route" {
  api_id = aws_apigatewayv2_api.portfolio_api.id

  route_key = "ANY /{proxy+}"
  target    = "integrations/${aws_apigatewayv2_integration.portfolio_integration.id}"
}

# API Gateway Route (root)
resource "aws_apigatewayv2_route" "portfolio_root_route" {
  api_id = aws_apigatewayv2_api.portfolio_api.id

  route_key = "ANY /"
  target    = "integrations/${aws_apigatewayv2_integration.portfolio_integration.id}"
}

# Lambda Permission for API Gateway
resource "aws_lambda_permission" "api_gw" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.portfolio.function_name
  principal     = "apigateway.amazonaws.com"

  source_arn = "${aws_apigatewayv2_api.portfolio_api.execution_arn}/*/*"
}

# API Gateway Custom Domain (conditional)
resource "aws_apigatewayv2_domain_name" "portfolio_domain" {
  count       = var.enable_custom_domain ? 1 : 0
  domain_name = var.domain_name

  domain_name_configuration {
    certificate_arn = var.certificate_arn
    endpoint_type   = "REGIONAL"
    security_policy = "TLS_1_2"
  }
}

# API Gateway Domain Mapping (conditional)
resource "aws_apigatewayv2_api_mapping" "portfolio_mapping" {
  count       = var.enable_custom_domain ? 1 : 0
  api_id      = aws_apigatewayv2_api.portfolio_api.id
  domain_name = aws_apigatewayv2_domain_name.portfolio_domain[0].id
  stage       = aws_apigatewayv2_stage.portfolio_stage.id
}

# ==================== Profile Subdomain ====================

# API Gateway Custom Domain for profile.ankitraj.cloud
resource "aws_apigatewayv2_domain_name" "profile_domain" {
  domain_name = "profile.${var.domain_name}"

  domain_name_configuration {
    certificate_arn = var.wildcard_certificate_arn
    endpoint_type   = "REGIONAL"
    security_policy = "TLS_1_2"
  }
}

# API Gateway Domain Mapping for profile subdomain
resource "aws_apigatewayv2_api_mapping" "profile_mapping" {
  api_id      = aws_apigatewayv2_api.portfolio_api.id
  domain_name = aws_apigatewayv2_domain_name.profile_domain.id
  stage       = aws_apigatewayv2_stage.portfolio_stage.id
}