# Outputs for the Green Room Terraform stack

output "api_gateway_url" {
  description = "Base invoke URL for the API Gateway stage (origin)."
  value       = aws_apigatewayv2_stage.app.invoke_url
}

output "lambda_function_name" {
  description = "Name of the Lambda function (consumed by the CI/CD deploy step)."
  value       = aws_lambda_function.app.function_name
}

output "custom_domain_target" {
  description = "API Gateway regional target domain, used as the Cloudflare CNAME content for meet.ankitraj.cloud."
  value       = var.enable_custom_domain ? aws_apigatewayv2_domain_name.app[0].domain_name_configuration[0].target_domain_name : null
}

output "custom_domain_hosted_zone_id" {
  description = "Hosted zone ID for the API Gateway regional custom domain."
  value       = var.enable_custom_domain ? aws_apigatewayv2_domain_name.app[0].domain_name_configuration[0].hosted_zone_id : null
}
