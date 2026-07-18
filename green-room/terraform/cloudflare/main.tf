# ============================================================================
# Cloudflare DNS for meet.ankitraj.cloud (Green Room)
# ============================================================================
# Mirrors the portfolio's Cloudflare module. Reuses the same ankitraj.cloud zone
# and the shared Terraform state bucket (distinct key). Manages the app CNAME
# (meet -> API Gateway custom-domain target) and the ACM validation CNAME.
# ============================================================================
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

  backend "s3" {
    bucket         = "portfolio-ankit-terraform-state"
    key            = "greenroom/cloudflare/terraform.tfstate"
    region         = "eu-north-1"
    encrypt        = true
    dynamodb_table = "portfolio-ankit-terraform-locks"
  }
}

# AWS provider is only needed so the S3 backend can authenticate.
provider "aws" {
  region = "eu-north-1"
}

provider "cloudflare" {
  api_token = var.cloudflare_api_token
}

# ==================== Variables ====================

variable "cloudflare_api_token" {
  description = "Cloudflare API token with DNS edit permission for ankitraj.cloud."
  type        = string
  sensitive   = true
}

variable "cloudflare_zone_id" {
  description = "Cloudflare Zone ID for ankitraj.cloud."
  type        = string
}

variable "domain_name" {
  description = "Fully qualified subdomain served by Green Room."
  type        = string
  default     = "meet.ankitraj.cloud"
}

variable "record_name" {
  description = "Subdomain label for the app CNAME (the part before the zone apex)."
  type        = string
  default     = "meet"
}

variable "origin_host" {
  description = "API Gateway default endpoint host (from the AWS stack output api_endpoint_host). Cloudflare proxies meet.ankitraj.cloud to this origin."
  type        = string
}

variable "ci_probe_secret" {
  description = "Shared secret sent in the x-ci-probe header by CI health/smoke checks. Requests carrying this value skip Cloudflare WAF/bot products so CI runner IPs are not falsely blocked. Leave empty to disable the bypass rule."
  type        = string
  sensitive   = true
  default     = ""
}

variable "enable_ci_probe_ruleset" {
  description = "Create the CI probe WAF bypass ruleset. Requires the Cloudflare API token to have Zone > Firewall Services > Edit. Leave false when the token only has DNS edit scope; the origin-gated CI health check works without this rule."
  type        = bool
  default     = false
}

# ==================== DNS records ====================

# App subdomain -> API Gateway default endpoint. Proxied so Cloudflare
# terminates public TLS at the edge (Universal SSL) and connects to the AWS
# origin over its built-in *.execute-api certificate (Full mode). No ACM cert.
resource "cloudflare_record" "app" {
  zone_id = var.cloudflare_zone_id
  name    = var.record_name
  content = var.origin_host
  type    = "CNAME"
  ttl     = 1
  proxied = true
  comment = "meet.ankitraj.cloud to Green Room API Gateway endpoint"
}

# ==================== Origin Rule: Host header override ====================
# API Gateway's default (regional) endpoint returns 403 for any Host header that
# is not its own *.execute-api name. Cloudflare proxies the visitor's Host
# (meet.ankitraj.cloud), so without this rule every request is rejected. This
# Origin Rule rewrites only the Host header sent to the origin to the execute-api
# host; SNI stays as the CNAME target, so it still matches AWS's built-in cert.
resource "cloudflare_ruleset" "app_origin_host" {
  zone_id     = var.cloudflare_zone_id
  name        = "Green Room origin Host header override"
  description = "Send API Gateway's execute-api host as the origin Host header"
  kind        = "zone"
  phase       = "http_request_origin"

  rules {
    ref         = "greenroom_origin_host_override"
    description = "Rewrite Host to the API Gateway endpoint for ${var.domain_name}"
    expression  = "(http.host eq \"${var.domain_name}\")"
    action      = "route"

    action_parameters {
      host_header = var.origin_host
    }
  }
}

# ==================== WAF: CI probe bypass (opt-in) ====================
# Lets the GitHub Actions health/smoke probe skip Cloudflare bot management on
# /health only, so CI runner IPs are not falsely challenged. Requires a token
# with Zone > Firewall Services > Edit; the origin-gated check works without it.
resource "cloudflare_ruleset" "ci_probe_bypass" {
  count = var.enable_ci_probe_ruleset && var.ci_probe_secret != "" ? 1 : 0

  zone_id     = var.cloudflare_zone_id
  name        = "Green Room CI probe WAF bypass"
  description = "Skip WAF/bot products for the authenticated CI health probe"
  kind        = "zone"
  phase       = "http_request_firewall_custom"

  rules {
    ref         = "greenroom_ci_probe_skip"
    description = "Skip free-tier security products for the CI probe on /health only"
    expression  = "(http.host eq \"${var.domain_name}\" and http.request.uri.path eq \"/health\" and http.request.headers[\"x-ci-probe\"][0] eq \"${var.ci_probe_secret}\")"
    action      = "skip"

    action_parameters {
      products = [
        "bic",
        "hot",
        "securityLevel",
        "uaBlock",
      ]
    }

    logging {
      enabled = true
    }
  }
}

# ==================== Outputs ====================

output "app_record" {
  description = "App subdomain CNAME record."
  value       = cloudflare_record.app.hostname
}
