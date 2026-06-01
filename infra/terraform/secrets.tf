resource "aws_secretsmanager_secret" "github_app" {
  name        = "bonae/github-app-content"
  description = "GitHub App credentials for the content API Lambda (appId, installationId, privateKey)"
}

resource "aws_secretsmanager_secret_version" "github_app_placeholder" {
  secret_id = aws_secretsmanager_secret.github_app.id
  secret_string = jsonencode({
    appId          = "REPLACE"
    installationId = "REPLACE"
    privateKey     = "REPLACE"
  })

  # Prevent Terraform from overwriting the secret after it has been populated manually
  lifecycle {
    ignore_changes = [secret_string]
  }
}
