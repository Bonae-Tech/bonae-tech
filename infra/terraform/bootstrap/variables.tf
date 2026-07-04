variable "aws_region" {
  description = "AWS region for all resources"
  type        = string
  default     = "sa-east-1"
}

variable "github_repo" {
  description = "GitHub repository in owner/repo format (e.g. bonae-tech/bonae-tech)"
  type        = string
  default     = "bonae-tech/bonae-tech"
}

variable "state_bucket" {
  description = "S3 bucket name for Terraform remote state"
  type        = string
  default     = "bonae-terraform-state-112066795953"
}

variable "state_lock_table" {
  description = "DynamoDB table name for Terraform state locking"
  type        = string
  default     = "bonae-terraform-locks"
}

variable "deploy_role_name" {
  description = "IAM role name assumed by GitHub Actions via OIDC"
  type        = string
  default     = "github-actions-bonae-deploy"
}

variable "github_environment" {
  description = "GitHub Actions environment name that gates terraform apply"
  type        = string
  default     = "infra-production"
}
