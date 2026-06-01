provider "aws" {
  region = "sa-east-1"
}

data "aws_caller_identity" "current" {}
data "aws_region" "current" {}
