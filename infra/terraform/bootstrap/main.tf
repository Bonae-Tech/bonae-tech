terraform {
  required_version = ">= 1.6"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    github = {
      source  = "integrations/github"
      version = "~> 6.0"
    }
  }
  # No backend block — local state by design.
  # This module is run once with personal AWS credentials before any CI exists.
}

provider "aws" {
  region = var.aws_region
}

provider "github" {
  owner = split("/", var.github_repo)[0]
  # Token set via GITHUB_TOKEN environment variable
}

data "aws_caller_identity" "current" {}
