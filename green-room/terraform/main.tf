# ============================================================================
# Green Room: serverless deployment (AWS Lambda + API Gateway v2)
# ============================================================================
# Lives inside the my-portfolio-app repo and REUSES the portfolio's shared
# infrastructure: the same Terraform state bucket + lock table, the same GitHub
# OIDC deploy role, and the same Cloudflare zone. Resources are named with the
# `portfolio-ankit-greenroom-` prefix so they fall under the existing deploy
# role's least-privilege ARNs (function:portfolio-ankit-*, role/portfolio-ankit-*).
# ============================================================================
terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
  }

  # Shared remote state bucket, distinct key.
  backend "s3" {
    bucket         = "portfolio-ankit-terraform-state"
    key            = "greenroom/aws/terraform.tfstate"
    region         = "eu-north-1"
    encrypt        = true
    dynamodb_table = "portfolio-ankit-terraform-locks"
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "green-room"
      Environment = var.environment
      ManagedBy   = "terraform"
      Component   = "green-room"
    }
  }
}

resource "random_string" "suffix" {
  length  = 8
  special = false
  upper   = false
}

# ==================== IAM (least privilege) ====================

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

resource "aws_iam_role_policy_attachment" "lambda_basic_execution" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# ==================== Compute ====================

resource "aws_cloudwatch_log_group" "lambda_logs" {
  name              = "/aws/lambda/${var.project_name}-${var.environment}-${random_string.suffix.result}"
  retention_in_days = var.log_retention_days
}

resource "aws_lambda_function" "app" {
  filename      = "${path.module}/greenroom-lambda.zip"
  function_name = "${var.project_name}-${var.environment}-${random_string.suffix.result}"
  role          = aws_iam_role.lambda_role.arn
  handler       = "lambda.handler"
  runtime       = "nodejs22.x"
  timeout       = 15
  memory_size   = 256

  # Tolerate a missing zip during `terraform validate` in CI (the package is
  # built by scripts/build-lambda.sh before plan/apply).
  source_code_hash = fileexists("${path.module}/greenroom-lambda.zip") ? filebase64sha256("${path.module}/greenroom-lambda.zip") : null

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
    ignore_changes = [source_code_hash]
  }
}

# ==================== API Gateway (HTTP API) ====================

resource "aws_cloudwatch_log_group" "apigw_access_logs" {
  name              = "/aws/apigateway/${var.project_name}-${var.environment}-${random_string.suffix.result}"
  retention_in_days = var.log_retention_days
}

resource "aws_apigatewayv2_api" "app" {
  name          = "${var.project_name}-api-${random_string.suffix.result}"
  protocol_type = "HTTP"
  description   = "Green Room serverless API"

  cors_configuration {
    allow_credentials = false
    allow_headers     = ["content-type"]
    allow_methods     = ["GET", "HEAD", "OPTIONS"]
    allow_origins     = ["https://${var.domain_name}"]
    max_age           = 86400
  }
}

resource "aws_apigatewayv2_stage" "app" {
  api_id      = aws_apigatewayv2_api.app.id
  name        = var.environment
  auto_deploy = true

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

resource "aws_apigatewayv2_integration" "app" {
  api_id             = aws_apigatewayv2_api.app.id
  integration_uri    = aws_lambda_function.app.invoke_arn
  integration_type   = "AWS_PROXY"
  integration_method = "POST"
}

resource "aws_apigatewayv2_route" "proxy" {
  api_id    = aws_apigatewayv2_api.app.id
  route_key = "ANY /{proxy+}"
  target    = "integrations/${aws_apigatewayv2_integration.app.id}"
}

resource "aws_apigatewayv2_route" "root" {
  api_id    = aws_apigatewayv2_api.app.id
  route_key = "ANY /"
  target    = "integrations/${aws_apigatewayv2_integration.app.id}"
}

resource "aws_lambda_permission" "api_gw" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.app.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.app.execution_arn}/*/*"
}

# ==================== Custom domain (meet.ankitraj.cloud) ====================
# The ACM certificate is created out-of-band (the shared deploy role has ACM
# read-only permissions), then its ARN is passed in via var.certificate_arn.
# DNS (the app CNAME + the ACM validation CNAME) is managed in the Cloudflare
# module (terraform/cloudflare).
resource "aws_apigatewayv2_domain_name" "app" {
  count       = var.enable_custom_domain ? 1 : 0
  domain_name = var.domain_name

  domain_name_configuration {
    certificate_arn = var.certificate_arn
    endpoint_type   = "REGIONAL"
    security_policy = "TLS_1_2"
  }
}

resource "aws_apigatewayv2_api_mapping" "app" {
  count       = var.enable_custom_domain ? 1 : 0
  api_id      = aws_apigatewayv2_api.app.id
  domain_name = aws_apigatewayv2_domain_name.app[0].id
  stage       = aws_apigatewayv2_stage.app.id
}
