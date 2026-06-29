variable "ses_domain" {
  description = "Domain to verify in SES for Cognito transactional email"
  type        = string
  default     = "bonaetech.com"
}

variable "cognito_from_email" {
  description = "FROM address for Cognito email (must be on ses_domain)"
  type        = string
  default     = "noreply@bonaetech.com"
}

variable "cognito_use_ses_email" {
  description = "When true, Cognito sends via SES. Enable only after SES domain DNS is verified."
  type        = bool
  default     = false
}
