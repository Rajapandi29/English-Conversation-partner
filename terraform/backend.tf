terraform {
  backend "s3" {
    bucket = "terraform-state-10-09"
    key    = "english-app/terraform.tfstate"
    region = "us-east-1"
  }
}