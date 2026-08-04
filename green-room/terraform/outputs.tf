# Outputs for the Green Room Terraform stack

output "api_gateway_url" {
  description = "Base invoke URL for the API Gateway stage (origin)."
  value       = aws_apigatewayv2_stage.app.invoke_url
}

output "lambda_function_name" {
  description = "Name of the Lambda function (consumed by the CI/CD deploy step)."
  value       = aws_lambda_function.app.function_name
}

output "api_endpoint_host" {
  description = "API Gateway default endpoint host (Cloudflare CNAME target for meet.ankitraj.cloud)."
  value       = replace(aws_apigatewayv2_api.app.api_endpoint, "https://", "")
}
