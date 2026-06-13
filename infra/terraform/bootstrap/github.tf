# ---------------------------------------------------------------------------
# GitHub repository secrets and environment
# Requires: GITHUB_TOKEN env var with repo + secrets + environments scope
# ---------------------------------------------------------------------------

resource "github_actions_secret" "aws_role_arn" {
  repository      = split("/", var.github_repo)[1]
  secret_name     = "AWS_ROLE_ARN"
  plaintext_value = aws_iam_role.github_actions.arn
}

resource "github_actions_secret" "aws_region" {
  repository      = split("/", var.github_repo)[1]
  secret_name     = "AWS_REGION"
  plaintext_value = var.aws_region
}

# The infra-production environment gates `terraform apply` behind required reviewers.
# Add reviewer IDs via the GitHub UI after creation, or extend this resource.
resource "github_repository_environment" "infra_production" {
  repository  = split("/", var.github_repo)[1]
  environment = var.github_environment

  # Prevent accidental deploys without approval
  deployment_branch_policy {
    protected_branches     = false
    custom_branch_policies = true
  }
}

resource "github_repository_environment_deployment_policy" "main" {
  repository     = split("/", var.github_repo)[1]
  environment    = github_repository_environment.infra_production.environment
  branch_pattern = "main"
}
