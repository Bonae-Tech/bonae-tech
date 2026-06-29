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

output "ses_domain" {
  description = "SES domain configured for Cognito email"
  value       = var.ses_domain
}

output "cognito_from_email" {
  description = "FROM address used when cognito_use_ses_email is true"
  value       = var.cognito_from_email
}

output "cognito_use_ses_email" {
  description = "Whether Cognito is currently configured to send via SES"
  value       = var.cognito_use_ses_email
}

output "ses_domain_verification_txt" {
  description = "Add as TXT in Cloudflare for SES domain verification"
  value = {
    name  = "_amazonses.${var.ses_domain}"
    type  = "TXT"
    value = aws_ses_domain_identity.cognito.verification_token
  }
}

output "ses_dkim_cname_records" {
  description = "Add three CNAME records in Cloudflare for DKIM"
  value = [
    for token in aws_ses_domain_dkim.cognito.dkim_tokens : {
      name  = "${token}._domainkey.${var.ses_domain}"
      type  = "CNAME"
      value = "${token}.dkim.amazonses.com"
    }
  ]
}
