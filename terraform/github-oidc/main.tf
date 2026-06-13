# ============================================================================
# GitHub Actions OIDC bootstrap for keyless AWS deploys
# ============================================================================
# Creates the GitHub OIDC identity provider and an IAM role that GitHub
# Actions assumes via short-lived tokens (no static AWS access keys).
#
# This is a BOOTSTRAP module: apply it once with an admin identity, then set
# the resulting role ARN as the `AWS_ROLE_ARN` repo secret. The main CI/CD
# pipeline (terraform/) then runs entirely keyless.
# ============================================================================

terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Reuses the existing remote-state bucket with a distinct key so the
  # bootstrap role is tracked separately from the application stack.
  backend "s3" {
    bucket         = "portfolio-ankit-terraform-state"
    key            = "portfolio/github-oidc/terraform.tfstate"
    region         = "eu-north-1"
    encrypt        = true
    dynamodb_table = "portfolio-ankit-terraform-locks"
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "portfolio-serverless"
      Environment = "shared"
      ManagedBy   = "terraform"
      Component   = "github-oidc"
    }
  }
}

data "aws_caller_identity" "current" {}

# GitHub's OIDC identity provider. AWS validates the token signature against
# GitHub's published keys; the thumbprint is required by the API but is no
# longer used for trust decisions by AWS.
resource "aws_iam_openid_connect_provider" "github" {
  url             = "https://token.actions.githubusercontent.com"
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = ["6938fd4d98bab03faadb97b34396831e3780aea1"]
}

# Trust policy: only GitHub Actions runs from this repo, on the allowed refs,
# may assume the role. `sub` claim scoping is the primary security control.
data "aws_iam_policy_document" "github_trust" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRoleWithWebIdentity"]

    principals {
      type        = "Federated"
      identifiers = [aws_iam_openid_connect_provider.github.arn]
    }

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"
      values   = ["sts.amazonaws.com"]
    }

    condition {
      test     = "StringLike"
      variable = "token.actions.githubusercontent.com:sub"
      values   = var.subject_claims
    }
  }
}

resource "aws_iam_role" "github_deploy" {
  name                 = var.role_name
  description          = "Assumed by GitHub Actions (OIDC) to deploy the portfolio stack"
  assume_role_policy   = data.aws_iam_policy_document.github_trust.json
  max_session_duration = 3600
}

# Deploy permissions for the CI/CD pipeline: the services the Terraform stack
# and deploy steps touch (Lambda, API Gateway, S3 assets, CloudWatch logs,
# ACM reads, SES send). Scoped to the project where practical.
data "aws_iam_policy_document" "deploy" {
  statement {
    sid    = "LambdaManage"
    effect = "Allow"
    actions = [
      "lambda:*",
    ]
    resources = ["arn:aws:lambda:${var.aws_region}:${data.aws_caller_identity.current.account_id}:function:${var.project_name}-*"]
  }

  statement {
    sid    = "ApiGatewayManage"
    effect = "Allow"
    actions = [
      "apigateway:*",
    ]
    resources = ["*"]
  }

  statement {
    sid    = "CloudWatchLogs"
    effect = "Allow"
    actions = [
      "logs:CreateLogGroup",
      "logs:DeleteLogGroup",
      "logs:DescribeLogGroups",
      "logs:PutRetentionPolicy",
      "logs:TagResource",
      "logs:UntagResource",
      "logs:ListTagsForResource",
      # Required by API Gateway v2 UpdateStage to set OR clear a stage's access
      # log settings. AWS validates these even when logging is being disabled,
      # so they are needed to remove logging from the existing prod stage.
      "logs:CreateLogDelivery",
      "logs:DeleteLogDelivery",
      "logs:GetLogDelivery",
      "logs:UpdateLogDelivery",
      "logs:ListLogDeliveries",
      "logs:PutResourcePolicy",
      "logs:DescribeResourcePolicies",
    ]
    resources = ["*"]
  }

  statement {
    sid    = "SesSend"
    effect = "Allow"
    actions = [
      "ses:SendEmail",
      "ses:SendRawEmail",
    ]
    resources = ["*"]
  }

  # Manage the monthly cost budget and its alert notifications. The Budgets API
  # is global and does not support resource-level permissions, so the actions
  # are granted on "*".
  statement {
    sid    = "Budgets"
    effect = "Allow"
    actions = [
      "budgets:ViewBudget",
      "budgets:ModifyBudget",
      "budgets:CreateBudgetAction",
      "budgets:DeleteBudgetAction",
      "budgets:UpdateBudgetAction",
      "budgets:DescribeBudgetActionsForBudget",
    ]
    resources = ["*"]
  }

  statement {
    sid    = "AcmRead"
    effect = "Allow"
    actions = [
      "acm:DescribeCertificate",
      "acm:ListCertificates",
      "acm:ListTagsForCertificate",
    ]
    resources = ["*"]
  }

  # Manage the project IAM roles (Lambda execution role) created by the stack.
  statement {
    sid    = "IamProjectRoles"
    effect = "Allow"
    actions = [
      "iam:CreateRole",
      "iam:DeleteRole",
      "iam:GetRole",
      "iam:PassRole",
      "iam:TagRole",
      "iam:UntagRole",
      "iam:ListRolePolicies",
      "iam:ListAttachedRolePolicies",
      "iam:ListInstanceProfilesForRole",
      "iam:PutRolePolicy",
      "iam:DeleteRolePolicy",
      "iam:GetRolePolicy",
      "iam:AttachRolePolicy",
      "iam:DetachRolePolicy",
    ]
    resources = ["arn:aws:iam::${data.aws_caller_identity.current.account_id}:role/${var.project_name}-*"]
  }

  # Read managed policies (Terraform refresh reads AWSLambdaBasicExecutionRole
  # and similar when attaching them to the execution role).
  statement {
    sid    = "IamReadManagedPolicies"
    effect = "Allow"
    actions = [
      "iam:GetPolicy",
      "iam:GetPolicyVersion",
      "iam:ListPolicyVersions",
    ]
    resources = ["arn:aws:iam::aws:policy/*"]
  }

  # Terraform remote state: read/write the state object and acquire the lock.
  statement {
    sid    = "TerraformStateBucket"
    effect = "Allow"
    actions = [
      "s3:ListBucket",
      "s3:GetObject",
      "s3:PutObject",
      "s3:DeleteObject",
    ]
    resources = [
      "arn:aws:s3:::${var.state_bucket}",
      "arn:aws:s3:::${var.state_bucket}/*",
    ]
  }

  statement {
    sid    = "TerraformStateLock"
    effect = "Allow"
    actions = [
      "dynamodb:GetItem",
      "dynamodb:PutItem",
      "dynamodb:DeleteItem",
    ]
    resources = ["arn:aws:dynamodb:${var.aws_region}:${data.aws_caller_identity.current.account_id}:table/${var.state_lock_table}"]
  }

  # Manage the project's static-asset S3 buckets created by the stack.
  statement {
    sid    = "ProjectAssetBuckets"
    effect = "Allow"
    actions = [
      "s3:CreateBucket",
      "s3:DeleteBucket",
      "s3:GetBucket*",
      "s3:PutBucket*",
      "s3:ListBucket",
      "s3:GetObject",
      "s3:PutObject",
      "s3:DeleteObject",
      # The aws_s3_bucket provider refreshes these sub-configurations on every
      # plan. Their IAM action names do not match the s3:GetBucket*/s3:PutBucket*
      # wildcards, so they must be granted explicitly.
      "s3:GetLifecycleConfiguration",
      "s3:PutLifecycleConfiguration",
      "s3:GetEncryptionConfiguration",
      "s3:PutEncryptionConfiguration",
      "s3:GetReplicationConfiguration",
      "s3:PutReplicationConfiguration",
      "s3:GetAccelerateConfiguration",
      "s3:PutAccelerateConfiguration",
    ]
    resources = [
      "arn:aws:s3:::${var.project_name}-*",
      "arn:aws:s3:::${var.project_name}-*/*",
    ]
  }
}

resource "aws_iam_role_policy" "deploy" {
  name   = "${var.role_name}-deploy"
  role   = aws_iam_role.github_deploy.id
  policy = data.aws_iam_policy_document.deploy.json
}
