output "user_pool_id" {
  description = "Cognito User Pool ID — set as VITE_COGNITO_USER_POOL_ID in admin SPA build"
  value       = aws_cognito_user_pool.admins.id
}

output "user_pool_client_id" {
  description = "Cognito User Pool Client ID — set as VITE_COGNITO_CLIENT_ID in admin SPA build"
  value       = aws_cognito_user_pool_client.spa.id
}

output "cognito_issuer" {
  description = "Cognito JWT issuer URL — used by the content API Worker for JWKS verification"
  value       = "https://cognito-idp.${data.aws_region.current.region}.amazonaws.com/${aws_cognito_user_pool.admins.id}"
}
