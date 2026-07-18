# Variables for the Green Room Terraform stack

variable "aws_region" {
  description = "AWS region for deployment. Matches the portfolio stack so the shared state bucket, lock table, and OIDC deploy role apply. The regional ACM certificate and API Gateway custom domain must share this region."
  type        = string
  default     = "eu-north-1"
}

variable "environment" {
  description = "Environment name (used as a name suffix and the API Gateway stage name)."
  type        = string
  default     = "prod"
}

variable "project_name" {
  description = "Resource name prefix. Kept under portfolio-ankit- so the shared GitHub OIDC deploy role's least-privilege ARNs cover these resources."
  type        = string
  default     = "portfolio-ankit-greenroom"
}

variable "domain_name" {
  description = "Custom domain (subdomain) that fronts the API Gateway."
  type        = string
  default     = "meet.ankitraj.cloud"
}

variable "enable_custom_domain" {
  description = "Whether to provision the API Gateway custom domain + mapping. Requires a valid certificate_arn."
  type        = bool
  default     = true
}

variable "certificate_arn" {
  description = "ACM certificate ARN for the custom domain, in the same region as aws_region. Created out-of-band because the shared deploy role has ACM read-only access."
  type        = string
  default     = ""
}

variable "log_retention_days" {
  description = "CloudWatch Logs retention (days) for the Lambda and API Gateway log groups. Lower values reduce storage cost."
  type        = number
  default     = 1
}
