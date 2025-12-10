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
    region          = var.aws_region
    environment     = var.environment
    api_url         = aws_apigatewayv2_stage.portfolio_stage.invoke_url
    lambda_function = aws_lambda_function.portfolio.function_name
  }
}

# Custom Domain Outputs (conditional)
output "custom_domain_name" {
  description = "Custom domain name"
  value       = var.domain_name != "" ? var.domain_name : null
}

output "api_gateway_domain_name" {
  description = "API Gateway domain name for DNS configuration"
  value       = replace(replace(aws_apigatewayv2_stage.portfolio_stage.invoke_url, "https://", ""), "/prod", "")
}

output "dns_instruction" {
  description = "DNS configuration instruction"
  value       = var.domain_name != "" ? "Create a CNAME record pointing ${var.domain_name} to ${replace(replace(aws_apigatewayv2_stage.portfolio_stage.invoke_url, "https://", ""), "/prod", "")}" : null
}

# Custom Domain Target for DNS
output "custom_domain_target" {
  description = "Target domain name for DNS CNAME record"
  value       = var.enable_custom_domain ? aws_apigatewayv2_domain_name.portfolio_domain[0].domain_name_configuration[0].target_domain_name : null
}

output "custom_domain_hosted_zone_id" {
  description = "Hosted zone ID for custom domain (for Route 53 alias records)"
  value       = var.enable_custom_domain ? aws_apigatewayv2_domain_name.portfolio_domain[0].domain_name_configuration[0].hosted_zone_id : null
}