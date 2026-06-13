# Variables for the GitHub Actions OIDC bootstrap module

variable "aws_region" {
  description = "AWS region for deployment (matches the application stack)"
  type        = string
  default     = "eu-north-1"
}

variable "project_name" {
  description = "Project name prefix used to scope IAM, Lambda, and S3 resource ARNs"
  type        = string
  default     = "portfolio-ankit"
}

variable "role_name" {
  description = "Name of the IAM role assumed by GitHub Actions via OIDC"
  type        = string
  default     = "portfolio-ankit-github-deploy"
}

variable "subject_claims" {
  description = <<-EOT
    Allowed GitHub OIDC `sub` claims that may assume the deploy role.
    Covers the main branch, pull requests, and the deployment environments
    (jobs that target a GitHub Environment get an `environment:` sub claim
    instead of a `ref:` one). Tighten or widen as needed.
  EOT
  type        = list(string)
  default = [
    "repo:restlessankyyy/my-portfolio-app:ref:refs/heads/main",
    "repo:restlessankyyy/my-portfolio-app:pull_request",
    "repo:restlessankyyy/my-portfolio-app:environment:production",
    "repo:restlessankyyy/my-portfolio-app:environment:staging",
  ]
}

variable "state_bucket" {
  description = "S3 bucket holding Terraform remote state (granted to the deploy role)"
  type        = string
  default     = "portfolio-ankit-terraform-state"
}

variable "state_lock_table" {
  description = "DynamoDB table used for Terraform state locking"
  type        = string
  default     = "portfolio-ankit-terraform-locks"
}
