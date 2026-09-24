aws_region = "us-east-1"

app_name    = "english-conversation-partner"
environment = "production"

# =========================================================
# VPC
# =========================================================

vpc_cidr = "10.60.0.0/16"

availability_zones = [
  "us-east-1a",
  "us-east-1b"
]

public_subnets = [
  "10.60.1.0/24",
  "10.60.2.0/24"
]

private_subnets = [
  "10.60.11.0/24",
  "10.60.12.0/24"
]

# =========================================================
# ECS
# =========================================================

ecs_cluster_name = "english-conversation-partner-cluster"

ec2_instance_type = "t3.medium"

ecs_min_size     = 2
ecs_desired_size = 2
ecs_max_size     = 4

# =========================================================
# FRONTEND
# =========================================================

frontend_container_port = 8080

frontend_cpu    = 256
frontend_memory = 512

frontend_image_tag = "latest"

# =========================================================
# BACKEND
# =========================================================

backend_container_port = 8000

backend_cpu    = 512
backend_memory = 1024

backend_image_tag = "latest"

# =========================================================
# DATABASE
# =========================================================

db_name = "english_partner"

db_username = "appuser"

db_instance_class = "db.t3.micro"

db_allocated_storage = 20

db_engine_version = "17"

# =========================================================
# SNS
# =========================================================

# Put your email here if you want CloudWatch alerts.
# Leave empty if you don't need SNS email alerts.

alert_email = ""