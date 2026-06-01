output "user_pool_id" {
  description = "Cognito User Pool ID — set as VITE_COGNITO_USER_POOL_ID in admin SPA build"
  value       = aws_cognito_user_pool.admins.id
}

output "user_pool_client_id" {
  description = "Cognito User Pool Client ID — set as VITE_COGNITO_CLIENT_ID in admin SPA build"
  value       = aws_cognito_user_pool_client.spa.id
}

output "api_url" {
  description = "Content API base URL — set as VITE_API_BASE_URL in admin SPA build"
  value       = aws_apigatewayv2_stage.default.invoke_url
}

output "admin_cloudfront_domain" {
  description = "CloudFront domain for the admin SPA (used as CORS origin in subsequent deploys)"
  value       = aws_cloudfront_distribution.admin_spa.domain_name
}

output "admin_cloudfront_distribution_id" {
  description = "CloudFront distribution ID — used for cache invalidation after S3 sync"
  value       = aws_cloudfront_distribution.admin_spa.id
}

output "admin_s3_bucket_name" {
  description = "S3 bucket name for admin SPA static files"
  value       = aws_s3_bucket.admin_spa.id
}

output "github_secret_arn" {
  description = "Secrets Manager ARN — update this secret with GitHub App credentials after first deploy"
  value       = aws_secretsmanager_secret.github_app.arn
}
