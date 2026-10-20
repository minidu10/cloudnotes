terraform {
  backend "s3" {
    bucket       = "konga-tf-state-2026"
    key          = "cloudnotes/terraform.tfstate"
    region       = "ap-south-1"
    encrypt      = true
    use_lockfile = true
  }
}