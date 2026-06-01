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
}

resource "aws_cognito_user_pool_client" "spa" {
  name         = "bonae-content-admin-spa"
  user_pool_id = aws_cognito_user_pool.admins.id

  generate_secret = false

  explicit_auth_flows = [
    "ALLOW_USER_SRP_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH",
  ]

  prevent_user_existence_errors = "ENABLED"
}

resource "aws_cognito_user_pool_group" "administrators" {
  name         = "Administrators"
  description  = "Content editors with publish access"
  user_pool_id = aws_cognito_user_pool.admins.id
}
