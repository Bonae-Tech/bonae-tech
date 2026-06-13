resource "aws_apigatewayv2_api" "content_api" {
  name          = "bonae-content-api"
  protocol_type = "HTTP"
  description   = "BONAE content admin API — Cognito JWT auth + GitHub git proxy"

  cors_configuration {
    allow_origins = [var.cors_origin]
    allow_headers = ["Authorization", "Content-Type"]
    allow_methods = ["GET", "PUT", "POST", "OPTIONS"]
    max_age       = 300
  }
}

resource "aws_apigatewayv2_authorizer" "cognito_jwt" {
  api_id           = aws_apigatewayv2_api.content_api.id
  authorizer_type  = "JWT"
  identity_sources = ["$request.header.Authorization"]
  name             = "cognito-jwt"

  jwt_configuration {
    audience = [aws_cognito_user_pool_client.spa.id]
    issuer   = "https://cognito-idp.${data.aws_region.current.name}.amazonaws.com/${aws_cognito_user_pool.admins.id}"
  }
}

resource "aws_apigatewayv2_integration" "lambda" {
  api_id                 = aws_apigatewayv2_api.content_api.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.content_api.invoke_arn
  payload_format_version = "2.0"
}

locals {
  authenticated_routes = toset([
    "GET /content/drafts/{locale}",
    "PUT /content/drafts/{locale}",
    "GET /content/published/{locale}",
    "POST /content/publish",
  ])
}

resource "aws_apigatewayv2_route" "authenticated" {
  for_each = local.authenticated_routes

  api_id             = aws_apigatewayv2_api.content_api.id
  route_key          = each.value
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.cognito_jwt.id
  target             = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.content_api.id
  name        = "$default"
  auto_deploy = true
}
