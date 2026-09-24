# =========================================================
# VPC
# =========================================================

output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.main.id
}


output "public_subnets" {
  description = "Public subnet IDs"
  value       = aws_subnet.public[*].id
}


output "private_subnets" {
  description = "Private subnet IDs"
  value       = aws_subnet.private[*].id
}


# =========================================================
# ALB
# =========================================================

output "alb_dns_name" {
  description = "Application Load Balancer DNS name"
  value       = aws_lb.alb.dns_name
}


output "application_url" {
  description = "Frontend application URL"
  value       = "http://${aws_lb.alb.dns_name}"
}


output "backend_url" {
  description = "Backend API URL"
  value       = "http://${aws_lb.alb.dns_name}/api"
}


# =========================================================
# ECR
# =========================================================

output "frontend_ecr_repository" {
  description = "Frontend ECR repository"
  value       = aws_ecr_repository.frontend.repository_url
}


output "backend_ecr_repository" {
  description = "Backend ECR repository"
  value       = aws_ecr_repository.backend.repository_url
}


# =========================================================
# ECS
# =========================================================

output "ecs_cluster_name" {
  description = "ECS cluster name"
  value       = aws_ecs_cluster.main.name
}


output "frontend_ecs_service" {
  description = "Frontend ECS service"
  value       = aws_ecs_service.frontend.name
}


output "backend_ecs_service" {
  description = "Backend ECS service"
  value       = aws_ecs_service.backend.name
}


output "ecs_auto_scaling_group" {
  description = "ECS EC2 Auto Scaling Group"
  value       = aws_autoscaling_group.ecs.name
}


# =========================================================
# RDS
# =========================================================

output "rds_address" {
  description = "RDS PostgreSQL hostname"
  value       = aws_db_instance.postgres.address
}


output "rds_endpoint" {
  description = "RDS PostgreSQL endpoint"
  value       = aws_db_instance.postgres.endpoint
}


output "rds_port" {
  description = "RDS PostgreSQL port"
  value       = aws_db_instance.postgres.port
}


output "rds_secret_arn" {
  description = "RDS managed master password secret ARN"
  value       = aws_db_instance.postgres.master_user_secret[0].secret_arn
  sensitive   = true
}


# =========================================================
# CLOUDWATCH
# =========================================================

output "frontend_log_group" {
  description = "Frontend CloudWatch log group"
  value       = aws_cloudwatch_log_group.frontend.name
}


output "backend_log_group" {
  description = "Backend CloudWatch log group"
  value       = aws_cloudwatch_log_group.backend.name
}


# =========================================================
# SNS
# =========================================================

output "sns_topic_arn" {
  description = "SNS alert topic ARN"
  value       = aws_sns_topic.alerts.arn
}