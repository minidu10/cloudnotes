variable "region" {
  default = "ap-south-1"
}

variable "project" {
  default = "cloudnotes"
}

variable "vpc_cidr" {
  default = "10.0.0.0/16"
}

variable "public_subnet_cidr" {
  default = "10.0.1.0/24"
}

variable "private_subnet_cidr" {
  default = "10.0.2.0/24"
}

variable "my_ip" {
  description = "Your home IP for SSH, like 112.134.5.20/32"
  type        = string
}