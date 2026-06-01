variable "github_repo" {
  description = "GitHub repository in owner/repo format (e.g. acme/my-site)"
  type        = string
}

variable "github_branch" {
  description = "Branch to which content commits are pushed"
  type        = string
  default     = "main"
}

variable "cors_origin" {
  description = "Allowed CORS origin for the content API — the admin SPA URL (e.g. https://d1234.cloudfront.net)"
  type        = string
}

variable "content_path_prefix" {
  description = "Path prefix for content JSON files inside the repository"
  type        = string
  default     = "apps/static/content"
}
