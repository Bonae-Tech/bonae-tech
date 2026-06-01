data "archive_file" "lambda_zip" {
  type        = "zip"
  source_dir  = "${path.root}/../../services/content-api/dist"
  output_path = "/tmp/bonae-content-api-lambda.zip"
}

resource "aws_iam_role" "lambda_exec" {
  name = "bonae-content-api-lambda"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_basic" {
  role       = aws_iam_role.lambda_exec.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy" "lambda_secrets" {
  name = "bonae-lambda-read-github-secret"
  role = aws_iam_role.lambda_exec.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["secretsmanager:GetSecretValue"]
      Resource = aws_secretsmanager_secret.github_app.arn
    }]
  })
}

resource "aws_lambda_function" "content_api" {
  filename         = data.archive_file.lambda_zip.output_path
  function_name    = "bonae-content-api"
  role             = aws_iam_role.lambda_exec.arn
  handler          = "handler.handler"
  runtime          = "nodejs20.x"
  memory_size      = 256
  timeout          = 30
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256

  environment {
    variables = {
      CORS_ORIGIN         = var.cors_origin
      GITHUB_REPO         = var.github_repo
      GITHUB_BRANCH       = var.github_branch
      CONTENT_PATH_PREFIX = var.content_path_prefix
      GITHUB_SECRET_ARN   = aws_secretsmanager_secret.github_app.arn
    }
  }
}

resource "aws_lambda_permission" "api_gateway" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.content_api.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.content_api.execution_arn}/*/*"
}
