resource "aws_cognito_user_pool" "admins" {
  name = "bonae-content-admins"

  username_attributes      = ["email"]
  auto_verified_attributes = ["email"]

  admin_create_user_config {
    allow_admin_create_user_only = true
  }

  schema {
    name                = "email"
    attribute_data_type = "String"
    required            = true
    mutable             = true
  }

  password_policy {
    minimum_length    = 12
    require_lowercase = true
    require_numbers   = true
    require_symbols   = false
    require_uppercase = true
  }

  account_recovery_setting {
    recovery_mechanism {
      name     = "verified_email"
      priority = 1
    }
  }

  dynamic "email_configuration" {
    for_each = var.cognito_use_ses_email ? [1] : []
    content {
      email_sending_account = "DEVELOPER"
      from_email_address    = var.cognito_from_email
      source_arn            = aws_ses_domain_identity.cognito.arn
    }
  }
}

resource "aws_cognito_user_pool_client" "spa" {
  name         = "bonae-content-admin-spa"
  user_pool_id = aws_cognito_user_pool.admins.id

  generate_secret = false

  explicit_auth_flows = [
    "ALLOW_USER_SRP_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH",
  ]

  token_validity_units {
    id_token      = "hours"
    refresh_token = "days"
  }

  id_token_validity      = 1
  refresh_token_validity = 30

  prevent_user_existence_errors = "ENABLED"
}

resource "aws_cognito_user_group" "administrators" {
  name         = "Administrators"
  description  = "Content editors with publish access"
  user_pool_id = aws_cognito_user_pool.admins.id
}
