resource "aws_ses_domain_identity" "cognito" {
  domain = var.ses_domain
}

resource "aws_ses_domain_dkim" "cognito" {
  domain = aws_ses_domain_identity.cognito.domain
}

resource "aws_ses_identity_policy" "cognito" {
  identity = aws_ses_domain_identity.cognito.arn
  name     = "cognito-idp"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Sid    = "AllowCognitoSend"
      Effect = "Allow"
      Principal = {
        Service = "cognito-idp.amazonaws.com"
      }
      Action = [
        "ses:SendEmail",
        "ses:SendRawEmail",
      ]
      Resource = aws_ses_domain_identity.cognito.arn
      Condition = {
        StringEquals = {
          "aws:SourceAccount" = data.aws_caller_identity.current.account_id
        }
      }
    }]
  })
}
