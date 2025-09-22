# Outputs for Portfolio Terraform Deployment

output "api_gateway_url" {
  description = "Base URL for API Gateway stage"
  value       = aws_apigatewayv2_stage.portfolio_stage.invoke_url
}

output "lambda_function_name" {
  description = "Name of the Lambda function"
  value       = aws_lambda_function.portfolio.function_name
}

output "lambda_function_arn" {
  description = "ARN of the Lambda function"
  value       = aws_lambda_function.portfolio.arn
}

output "s3_bucket_name" {
  description = "Name of the S3 bucket for static assets"
  value       = aws_s3_bucket.portfolio_assets.bucket
}

output "s3_website_url" {
  description = "S3 website URL"
  value       = aws_s3_bucket_website_configuration.portfolio_assets_website.website_endpoint
}

output "cloudwatch_log_group" {
  description = "CloudWatch log group for Lambda"
  value       = aws_cloudwatch_log_group.lambda_logs.name
}

output "deployment_info" {
  description = "Deployment information"
  value = {
    region           = var.aws_region
    environment      = var.environment
    api_url         = aws_apigatewayv2_stage.portfolio_stage.invoke_url
    lambda_function = aws_lambda_function.portfolio.function_name
  }
}