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