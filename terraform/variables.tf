# Variables for Portfolio Terraform Configuration

variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "eu-north-1"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "prod"
}

variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "portfolio-ankit"
}

variable "domain_name" {
  description = "Custom domain name (optional)"
  type        = string
  default     = "ankitraj.cloud"
}

variable "enable_custom_domain" {
  description = "Whether to enable custom domain (requires valid ACM certificate)"
  type        = bool
  default     = false
}

variable "certificate_arn" {
  description = "ACM certificate ARN for custom domain (eu-north-1 for CloudFront)"
  type        = string
  default     = "arn:aws:acm:eu-north-1:351323459199:certificate/bf3bd7c5-353e-41a6-b852-2d49b4962a21"
}

variable "cloudfront_certificate_arn" {
  description = "ACM certificate ARN for CloudFront (must be in us-east-1)"
  type        = string
  default     = "arn:aws:acm:us-east-1:351323459199:certificate/e6af6c14-0083-43af-91f1-259e534b6cb2"
}

variable "wildcard_certificate_arn" {
  description = "ACM wildcard certificate ARN for *.ankitraj.cloud (eu-north-1)"
  type        = string
  default     = "arn:aws:acm:eu-north-1:157539276388:certificate/be572efd-37be-4806-b8a7-53a7f45f9970"
}

variable "log_retention_days" {
  description = "CloudWatch Logs retention (days) for the Lambda log group. Lower values reduce storage cost."
  type        = number
  default     = 1
}

variable "monthly_budget_limit_usd" {
  description = "Monthly AWS cost budget in USD. An alert fires when actual or forecasted spend crosses the configured thresholds."
  type        = number
  default     = 5
}

variable "budget_alert_emails" {
  description = "Email addresses that receive the AWS Budgets cost alert notifications."
  type        = list(string)
  default     = ["rajankit749@gmail.com"]
}