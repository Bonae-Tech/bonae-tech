terraform {
  required_version = ">= 1.6"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.21"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.0"
    }
  }
  backend "s3" {
    bucket         = "bonae-terraform-state-112066795953"
    key            = "bonae/content-api/terraform.tfstate"
    region         = "sa-east-1"
    dynamodb_table = "bonae-terraform-locks"
    encrypt        = true
  }
}
