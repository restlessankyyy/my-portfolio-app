# Cloudflare DNS Management for ankitraj.cloud
terraform {
  required_version = ">= 1.0"
  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.0"
    }
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Remote state configuration - S3 backend with DynamoDB locking
  backend "s3" {
    bucket         = "portfolio-ankit-terraform-state"
    key            = "portfolio/cloudflare/terraform.tfstate"
    region         = "eu-north-1"
    encrypt        = true
    dynamodb_table = "portfolio-ankit-terraform-locks"
  }
}

# AWS Provider for backend (required for S3 state)
provider "aws" {
  region = "eu-north-1"
}

# Configure Cloudflare Provider
provider "cloudflare" {
  api_token = var.cloudflare_api_token
}

# Variables
variable "cloudflare_api_token" {
  description = "Cloudflare API Token with DNS edit permissions"
  type        = string
  sensitive   = true
}

variable "cloudflare_zone_id" {
  description = "Cloudflare Zone ID for ankitraj.cloud"
  type        = string
}

variable "cloudflare_account_id" {
  description = "Cloudflare Account ID"
  type        = string
}

variable "api_gateway_domain" {
  description = "AWS API Gateway domain"
  type        = string
  default     = "jmgjkrpp65.execute-api.eu-north-1.amazonaws.com"
}

variable "custom_domain_target" {
  description = "AWS API Gateway custom domain target (from API Gateway custom domain setup)"
  type        = string
}

variable "acm_validation_name" {
  description = "ACM certificate validation CNAME name"
  type        = string
  default     = "_fda1caf491ef2ac8c3dc323852e4243d"
}

variable "acm_validation_value" {
  description = "ACM certificate validation CNAME value"
  type        = string
  default     = "_a21d0ea08f7f5d4ec86278a9b3b41242.jkddzztszm.acm-validations.aws."
}

# ==================== SSL/TLS Settings ====================

# Set SSL mode to Full (Cloudflare connects to origin via HTTPS)
resource "cloudflare_zone_settings_override" "ssl_settings" {
  zone_id = var.cloudflare_zone_id

  settings {
    ssl                      = "full"
    always_use_https         = "on"
    automatic_https_rewrites = "on"
    min_tls_version          = "1.2"
    tls_1_3                  = "on"
  }
}

# ==================== Redirect Rule (Root to WWW) ====================

# Redirect ankitraj.cloud to www.ankitraj.cloud using Page Rules
resource "cloudflare_page_rule" "redirect_root_to_www" {
  zone_id  = var.cloudflare_zone_id
  target   = "ankitraj.cloud/*"
  priority = 1

  actions {
    forwarding_url {
      url         = "https://www.ankitraj.cloud/$1"
      status_code = 301
    }
  }
}

# ==================== DNS Records ====================

# DNS Record - Root domain points to www for redirect
resource "cloudflare_record" "root" {
  zone_id = var.cloudflare_zone_id
  name    = "@"
  content = "www.ankitraj.cloud"
  type    = "CNAME"
  ttl     = 1    # Auto
  proxied = true # Cloudflare will handle SSL and redirect
  comment = "Root domain - CNAME to www"
}

# DNS Record - ACM Certificate Validation
resource "cloudflare_record" "acm_validation" {
  zone_id = var.cloudflare_zone_id
  name    = var.acm_validation_name
  content = var.acm_validation_value
  type    = "CNAME"
  ttl     = 1     # Auto
  proxied = false # DNS only - required for ACM validation
  comment = "AWS ACM Certificate Validation"
}

# DNS Record - WWW subdomain to AWS API Gateway Custom Domain (AWS handles SSL)
resource "cloudflare_record" "www" {
  zone_id = var.cloudflare_zone_id
  name    = "www"
  content = var.custom_domain_target # AWS API Gateway custom domain target
  type    = "CNAME"
  ttl     = 1     # Auto
  proxied = false # DNS only - AWS ACM handles SSL
  comment = "WWW to AWS API Gateway Custom Domain"
}

# ==================== AWS SES DKIM Records ====================
# These records enable DKIM signing for emails sent from ankitraj.cloud domain
# Improves email deliverability and prevents spam filtering

resource "cloudflare_record" "ses_dkim_1" {
  zone_id = var.cloudflare_zone_id
  name    = "3hryyszifzsacww3lktwo7pg44pe63w7._domainkey"
  content = "3hryyszifzsacww3lktwo7pg44pe63w7.dkim.amazonses.com"
  type    = "CNAME"
  ttl     = 1     # Auto
  proxied = false # DNS only - required for DKIM
  comment = "AWS SES DKIM Record 1"
}

resource "cloudflare_record" "ses_dkim_2" {
  zone_id = var.cloudflare_zone_id
  name    = "ppohooaykyxf7amjltwaebd7u2d4ndvy._domainkey"
  content = "ppohooaykyxf7amjltwaebd7u2d4ndvy.dkim.amazonses.com"
  type    = "CNAME"
  ttl     = 1     # Auto
  proxied = false # DNS only - required for DKIM
  comment = "AWS SES DKIM Record 2"
}

resource "cloudflare_record" "ses_dkim_3" {
  zone_id = var.cloudflare_zone_id
  name    = "7nvquw6a44t6gdps2sqsnjpvwdq3kmu4._domainkey"
  content = "7nvquw6a44t6gdps2sqsnjpvwdq3kmu4.dkim.amazonses.com"
  type    = "CNAME"
  ttl     = 1     # Auto
  proxied = false # DNS only - required for DKIM
  comment = "AWS SES DKIM Record 3"
}

# SPF Record - Authorizes Amazon SES to send emails for this domain
resource "cloudflare_record" "spf" {
  zone_id = var.cloudflare_zone_id
  name    = "@"
  content = "v=spf1 include:amazonses.com ~all"
  type    = "TXT"
  ttl     = 1 # Auto
  proxied = false
  comment = "SPF record for AWS SES email sending"
}

# DMARC Record - Email authentication policy
resource "cloudflare_record" "dmarc" {
  zone_id = var.cloudflare_zone_id
  name    = "_dmarc"
  content = "v=DMARC1; p=none; rua=mailto:rajankit749@gmail.com"
  type    = "TXT"
  ttl     = 1 # Auto
  proxied = false
  comment = "DMARC policy for email authentication"
}

# Outputs
output "root_record" {
  description = "Root domain CNAME record"
  value       = cloudflare_record.root.hostname
}

output "acm_validation_record" {
  description = "ACM validation CNAME record"
  value       = cloudflare_record.acm_validation.hostname
}

output "www_record" {
  description = "WWW subdomain CNAME record"
  value       = cloudflare_record.www.hostname
}
