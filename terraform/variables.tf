variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "app_name" {
  description = "Application name"
  type        = string
  default     = "english-conversation-partner"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

# ---------------------------------------------------------
# VPC
# ---------------------------------------------------------

variable "vpc_cidr" {
  description = "VPC CIDR"
  type        = string
  default     = "10.60.0.0/16"
}

variable "availability_zones" {
  description = "Availability zones"
  type        = list(string)

  default = [
    "us-east-1a",
    "us-east-1b"
  ]
}

variable "public_subnets" {
  description = "Public subnet CIDRs"
  type        = list(string)

  default = [
    "10.60.1.0/24",
    "10.60.2.0/24"
  ]
}

variable "private_subnets" {
  description = "Private subnet CIDRs"
  type        = list(string)

  default = [
    "10.60.11.0/24",
    "10.60.12.0/24"
  ]
}

# ---------------------------------------------------------
# ECS
# ---------------------------------------------------------

variable "ecs_cluster_name" {
  description = "ECS cluster name"
  type        = string
  default     = "english-conversation-partner-cluster"
}

variable "ec2_instance_type" {
  description = "ECS EC2 instance type"
  type        = string
  default     = "t3.medium"
}

variable "ecs_min_size" {
  description = "Minimum ECS EC2 instances"
  type        = number
  default     = 2
}

variable "ecs_desired_size" {
  description = "Desired ECS EC2 instances"
  type        = number
  default     = 2
}

variable "ecs_max_size" {
  description = "Maximum ECS EC2 instances"
  type        = number
  default     = 4
}

# ---------------------------------------------------------
# Frontend
# ---------------------------------------------------------

variable "frontend_container_port" {
  description = "Frontend container port"
  type        = number
  default     = 8080
}

variable "frontend_cpu" {
  description = "Frontend task CPU"
  type        = number
  default     = 256
}

variable "frontend_memory" {
  description = "Frontend task memory"
  type        = number
  default     = 512
}

variable "frontend_image_tag" {
  description = "Frontend Docker image tag"
  type        = string
  default     = "latest"
}

# ---------------------------------------------------------
# Backend
# ---------------------------------------------------------

variable "backend_container_port" {
  description = "Backend container port"
  type        = number
  default     = 8000
}

variable "backend_cpu" {
  description = "Backend task CPU"
  type        = number
  default     = 512
}

variable "backend_memory" {
  description = "Backend task memory"
  type        = number
  default     = 1024
}

variable "backend_image_tag" {
  description = "Backend Docker image tag"
  type        = string
  default     = "latest"
}

# ---------------------------------------------------------
# RDS PostgreSQL
# ---------------------------------------------------------

variable "db_name" {
  description = "PostgreSQL database name"
  type        = string
  default     = "english_partner"
}

variable "db_username" {
  description = "PostgreSQL master username"
  type        = string
  default     = "appuser"
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.micro"
}

variable "db_allocated_storage" {
  description = "RDS storage in GB"
  type        = number
  default     = 20
}

variable "db_engine_version" {
  description = "PostgreSQL engine version"
  type        = string
  default     = "17"
}

# ---------------------------------------------------------
# Monitoring
# ---------------------------------------------------------

variable "alert_email" {
  description = "Email address for SNS alerts"
  type        = string
  default     = ""
}