output "deploy_role_arn" {
  description = "IAM role ARN assumed by GitHub Actions (stored as AWS_ROLE_ARN secret)"
  value       = aws_iam_role.github_actions.arn
}

output "state_bucket" {
  description = "S3 bucket holding Terraform remote state"
  value       = aws_s3_bucket.tf_state.bucket
}

output "state_lock_table" {
  description = "DynamoDB table used for Terraform state locking"
  value       = aws_dynamodb_table.tf_locks.name
}

output "oidc_provider_arn" {
  description = "GitHub OIDC provider ARN"
  value       = aws_iam_openid_connect_provider.github.arn
}
