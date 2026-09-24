# =========================================================
# DATA SOURCES
# =========================================================

data "aws_ssm_parameter" "ecs_ami" {
  name = "/aws/service/ecs/optimized-ami/amazon-linux-2023/recommended/image_id"
}


# =========================================================
# VPC
# =========================================================

resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = {
    Name = "${var.app_name}-vpc"
  }
}


# =========================================================
# INTERNET GATEWAY
# =========================================================

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "${var.app_name}-igw"
  }
}


# =========================================================
# PUBLIC SUBNETS
# =========================================================

resource "aws_subnet" "public" {
  count = length(var.public_subnets)

  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.public_subnets[count.index]
  availability_zone       = var.availability_zones[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name = "${var.app_name}-public-${count.index + 1}"
  }
}


# =========================================================
# PRIVATE SUBNETS
# =========================================================

resource "aws_subnet" "private" {
  count = length(var.private_subnets)

  vpc_id            = aws_vpc.main.id
  cidr_block        = var.private_subnets[count.index]
  availability_zone = var.availability_zones[count.index]

  tags = {
    Name = "${var.app_name}-private-${count.index + 1}"
  }
}


# =========================================================
# NAT GATEWAY
# =========================================================

resource "aws_eip" "nat" {
  domain = "vpc"

  tags = {
    Name = "${var.app_name}-nat-eip"
  }
}


resource "aws_nat_gateway" "main" {
  allocation_id = aws_eip.nat.id
  subnet_id     = aws_subnet.public[0].id

  depends_on = [
    aws_internet_gateway.main
  ]

  tags = {
    Name = "${var.app_name}-nat"
  }
}


# =========================================================
# PUBLIC ROUTE TABLE
# =========================================================

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "${var.app_name}-public-rt"
  }
}


resource "aws_route" "public_internet" {
  route_table_id         = aws_route_table.public.id
  destination_cidr_block = "0.0.0.0/0"
  gateway_id             = aws_internet_gateway.main.id
}


resource "aws_route_table_association" "public" {
  count = length(aws_subnet.public)

  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}


# =========================================================
# PRIVATE ROUTE TABLE
# =========================================================

resource "aws_route_table" "private" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "${var.app_name}-private-rt"
  }
}


resource "aws_route" "private_nat" {
  route_table_id         = aws_route_table.private.id
  destination_cidr_block = "0.0.0.0/0"
  nat_gateway_id         = aws_nat_gateway.main.id
}


resource "aws_route_table_association" "private" {
  count = length(aws_subnet.private)

  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private.id
}


# =========================================================
# SECURITY GROUP - ALB
# =========================================================

resource "aws_security_group" "alb" {
  name        = "${var.app_name}-alb-sg"
  description = "Security group for Application Load Balancer"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.app_name}-alb-sg"
  }
}


# =========================================================
# SECURITY GROUP - ECS
# =========================================================

resource "aws_security_group" "ecs" {
  name        = "${var.app_name}-ecs-sg"
  description = "Security group for ECS EC2 instances"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "Frontend from ALB"
    from_port       = var.frontend_container_port
    to_port         = var.frontend_container_port
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  ingress {
    description     = "Backend from ALB"
    from_port       = var.backend_container_port
    to_port         = var.backend_container_port
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.app_name}-ecs-sg"
  }
}


# =========================================================
# SECURITY GROUP - RDS
# =========================================================

resource "aws_security_group" "rds" {
  name        = "${var.app_name}-rds-sg"
  description = "Security group for PostgreSQL"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "PostgreSQL from ECS"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.ecs.id]
  }

  egress {
    description = "Allow outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.app_name}-rds-sg"
  }
}


# =========================================================
# ECR - FRONTEND
# =========================================================

resource "aws_ecr_repository" "frontend" {
  name                 = "${var.app_name}-frontend"
  image_tag_mutability = "MUTABLE"
  force_delete         = true

  image_scanning_configuration {
    scan_on_push = true
  }

  encryption_configuration {
    encryption_type = "AES256"
  }

  tags = {
    Name = "${var.app_name}-frontend-ecr"
  }
}


resource "aws_ecr_lifecycle_policy" "frontend" {
  repository = aws_ecr_repository.frontend.name

  policy = jsonencode({
    rules = [
      {
        rulePriority = 1

        description = "Keep only last 10 images"

        selection = {
          tagStatus   = "any"
          countType   = "imageCountMoreThan"
          countNumber = 10
        }

        action = {
          type = "expire"
        }
      }
    ]
  })
}


# =========================================================
# ECR - BACKEND
# =========================================================

resource "aws_ecr_repository" "backend" {
  name                 = "${var.app_name}-backend"
  image_tag_mutability = "MUTABLE"
  force_delete         = true

  image_scanning_configuration {
    scan_on_push = true
  }

  encryption_configuration {
    encryption_type = "AES256"
  }

  tags = {
    Name = "${var.app_name}-backend-ecr"
  }
}


resource "aws_ecr_lifecycle_policy" "backend" {
  repository = aws_ecr_repository.backend.name

  policy = jsonencode({
    rules = [
      {
        rulePriority = 1

        description = "Keep only last 10 images"

        selection = {
          tagStatus   = "any"
          countType   = "imageCountMoreThan"
          countNumber = 10
        }

        action = {
          type = "expire"
        }
      }
    ]
  })
}


# =========================================================
# RDS SUBNET GROUP
# =========================================================

resource "aws_db_subnet_group" "postgres" {
  name = "${var.app_name}-db-subnet-group"

  subnet_ids = aws_subnet.private[*].id

  tags = {
    Name = "${var.app_name}-db-subnet-group"
  }
}


# =========================================================
# RDS POSTGRESQL
# =========================================================

resource "aws_db_instance" "postgres" {
  identifier = "${var.app_name}-postgres"

  engine         = "postgres"
  engine_version = var.db_engine_version

  instance_class        = var.db_instance_class
  allocated_storage     = var.db_allocated_storage
  max_allocated_storage = 100
  storage_type          = "gp3"

  db_name  = var.db_name
  username = var.db_username

  manage_master_user_password = true

  storage_encrypted = true

  publicly_accessible = false

  multi_az = false

  port = 5432

  db_subnet_group_name = aws_db_subnet_group.postgres.name

  vpc_security_group_ids = [
    aws_security_group.rds.id
  ]

  backup_retention_period = 7

  skip_final_snapshot = true
  deletion_protection = false

  tags = {
    Name = "${var.app_name}-postgres"
  }
}


# =========================================================
# IAM ROLE - ECS EC2
# =========================================================

resource "aws_iam_role" "ecs_instance" {
  name = "${var.app_name}-ecs-instance-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"

    Statement = [
      {
        Effect = "Allow"

        Principal = {
          Service = "ec2.amazonaws.com"
        }

        Action = "sts:AssumeRole"
      }
    ]
  })
}


resource "aws_iam_role_policy_attachment" "ecs_instance_ecs" {
  role = aws_iam_role.ecs_instance.name

  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonEC2ContainerServiceforEC2Role"
}


resource "aws_iam_role_policy_attachment" "ecs_instance_ecr" {
  role = aws_iam_role.ecs_instance.name

  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
}


resource "aws_iam_role_policy_attachment" "ecs_instance_ssm" {
  role = aws_iam_role.ecs_instance.name

  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}


resource "aws_iam_instance_profile" "ecs_instance" {
  name = "${var.app_name}-ecs-instance-profile"

  role = aws_iam_role.ecs_instance.name
}


# =========================================================
# IAM ROLE - ECS TASK EXECUTION
# =========================================================

resource "aws_iam_role" "ecs_task_execution" {
  name = "${var.app_name}-ecs-task-execution-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"

    Statement = [
      {
        Effect = "Allow"

        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }

        Action = "sts:AssumeRole"
      }
    ]
  })
}


resource "aws_iam_role_policy_attachment" "ecs_task_execution" {
  role = aws_iam_role.ecs_task_execution.name

  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}


# =========================================================
# IAM ROLE - ECS TASK
# =========================================================

resource "aws_iam_role" "ecs_task" {
  name = "${var.app_name}-ecs-task-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"

    Statement = [
      {
        Effect = "Allow"

        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }

        Action = "sts:AssumeRole"
      }
    ]
  })
}


# =========================================================
# ECS SECRET ACCESS
# =========================================================

resource "aws_iam_role_policy" "ecs_task_secrets" {
  name = "${var.app_name}-ecs-secret-access"

  role = aws_iam_role.ecs_task_execution.id

  policy = jsonencode({
    Version = "2012-10-17"

    Statement = [
      {
        Effect = "Allow"

        Action = [
          "secretsmanager:GetSecretValue"
        ]

        Resource = aws_db_instance.postgres.master_user_secret[0].secret_arn
      }
    ]
  })
}


# =========================================================
# ECS CLUSTER
# =========================================================

resource "aws_ecs_cluster" "main" {
  name = var.ecs_cluster_name

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = {
    Name = var.ecs_cluster_name
  }
}


# =========================================================
# CLOUDWATCH LOG GROUP - FRONTEND
# =========================================================

resource "aws_cloudwatch_log_group" "frontend" {
  name              = "/ecs/${var.app_name}/frontend"
  retention_in_days = 7
}


# =========================================================
# CLOUDWATCH LOG GROUP - BACKEND
# =========================================================

resource "aws_cloudwatch_log_group" "backend" {
  name              = "/ecs/${var.app_name}/backend"
  retention_in_days = 7
}


# =========================================================
# ECS EC2 LAUNCH TEMPLATE
# =========================================================

resource "aws_launch_template" "ecs" {
  name_prefix = "${var.app_name}-ecs-"

  image_id = data.aws_ssm_parameter.ecs_ami.value

  instance_type = var.ec2_instance_type

  iam_instance_profile {
    name = aws_iam_instance_profile.ecs_instance.name
  }

  vpc_security_group_ids = [
    aws_security_group.ecs.id
  ]

  user_data = base64encode(<<-EOF
    #!/bin/bash

    echo ECS_CLUSTER=${var.ecs_cluster_name} >> /etc/ecs/ecs.config

    echo ECS_ENABLE_CONTAINER_METADATA=true >> /etc/ecs/ecs.config

    echo ECS_ENABLE_TASK_IAM_ROLE=true >> /etc/ecs/ecs.config

    echo ECS_ENABLE_TASK_IAM_ROLE_NETWORK_HOST=true >> /etc/ecs/ecs.config
  EOF
  )

  metadata_options {
    http_endpoint = "enabled"
    http_tokens   = "required"
  }

  tag_specifications {
    resource_type = "instance"

    tags = {
      Name = "${var.app_name}-ecs-instance"
    }
  }

  tag_specifications {
    resource_type = "volume"

    tags = {
      Name = "${var.app_name}-ecs-volume"
    }
  }
}


# =========================================================
# ECS AUTO SCALING GROUP
# =========================================================

resource "aws_autoscaling_group" "ecs" {
  name = "${var.app_name}-ecs-asg"

  min_size         = var.ecs_min_size
  desired_capacity = var.ecs_desired_size
  max_size         = var.ecs_max_size

  vpc_zone_identifier = aws_subnet.private[*].id

  health_check_type = "EC2"

  launch_template {
    id      = aws_launch_template.ecs.id
    version = "$Latest"
  }

  tag {
    key                 = "Name"
    value               = "${var.app_name}-ecs-instance"
    propagate_at_launch = true
  }

  tag {
    key                 = "AmazonECSManaged"
    value               = "true"
    propagate_at_launch = true
  }

  lifecycle {
    create_before_destroy = true
  }
}


# =========================================================
# ECS CAPACITY PROVIDER
# =========================================================

resource "aws_ecs_capacity_provider" "ec2" {
  name = "${var.app_name}-ec2-cp"

  auto_scaling_group_provider {
    auto_scaling_group_arn = aws_autoscaling_group.ecs.arn

    managed_scaling {
      status = "ENABLED"

      target_capacity = 100

      minimum_scaling_step_size = 1
      maximum_scaling_step_size = 2
    }

    managed_termination_protection = "DISABLED"
  }
}


resource "aws_ecs_cluster_capacity_providers" "main" {
  cluster_name = aws_ecs_cluster.main.name

  capacity_providers = [
    aws_ecs_capacity_provider.ec2.name
  ]

  default_capacity_provider_strategy {
    capacity_provider = aws_ecs_capacity_provider.ec2.name

    weight = 100
    base   = 1
  }
}


# =========================================================
# ALB
# =========================================================

resource "aws_lb" "alb" {
  name = "${var.app_name}-alb"

  internal           = false
  load_balancer_type = "application"

  security_groups = [
    aws_security_group.alb.id
  ]

  subnets = aws_subnet.public[*].id

  enable_deletion_protection = false

  tags = {
    Name = "${var.app_name}-alb"
  }
}


# =========================================================
# FRONTEND TARGET GROUP
# =========================================================

resource "aws_lb_target_group" "frontend" {
  name = "${var.app_name}-fe"

  port     = var.frontend_container_port
  protocol = "HTTP"

  target_type = "instance"

  vpc_id = aws_vpc.main.id

  health_check {
    enabled = true

    path = "/"

    port = "traffic-port"

    protocol = "HTTP"

    healthy_threshold   = 2
    unhealthy_threshold = 3

    timeout  = 5
    interval = 30

    matcher = "200-399"
  }

  tags = {
    Name = "${var.app_name}-frontend-tg"
  }
}


# =========================================================
# BACKEND TARGET GROUP
# =========================================================

resource "aws_lb_target_group" "backend" {
  name = "${var.app_name}-be"

  port     = var.backend_container_port
  protocol = "HTTP"

  target_type = "instance"

  vpc_id = aws_vpc.main.id

  health_check {
    enabled = true

    path = "/health"

    port = "traffic-port"

    protocol = "HTTP"

    healthy_threshold   = 2
    unhealthy_threshold = 3

    timeout  = 5
    interval = 30

    matcher = "200-399"
  }

  tags = {
    Name = "${var.app_name}-backend-tg"
  }
}


# =========================================================
# ALB LISTENER
# =========================================================

resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.alb.arn

  port     = 80
  protocol = "HTTP"

  default_action {
    type = "forward"

    target_group_arn = aws_lb_target_group.frontend.arn
  }
}


# =========================================================
# ALB BACKEND ROUTING
# /api
# /api/*
# =========================================================

resource "aws_lb_listener_rule" "backend" {
  listener_arn = aws_lb_listener.http.arn

  priority = 10

  action {
    type = "forward"

    target_group_arn = aws_lb_target_group.backend.arn
  }

  condition {
    path_pattern {
      values = [
        "/api",
        "/api/*"
      ]
    }
  }
}


# =========================================================
# FRONTEND ECS TASK
# =========================================================

resource "aws_ecs_task_definition" "frontend" {
  family = "${var.app_name}-frontend"

  network_mode = "bridge"

  requires_compatibilities = [
    "EC2"
  ]

  cpu    = var.frontend_cpu
  memory = var.frontend_memory

  execution_role_arn = aws_iam_role.ecs_task_execution.arn

  task_role_arn = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([
    {
      name = "frontend"

      image = "${aws_ecr_repository.frontend.repository_url}:${var.frontend_image_tag}"

      essential = true

      cpu    = var.frontend_cpu
      memory = var.frontend_memory

      portMappings = [
        {
          containerPort = var.frontend_container_port
          hostPort      = var.frontend_container_port
          protocol      = "tcp"
        }
      ]

      environment = [
        {
          name  = "BACKEND_URL"
          value = "/api"
        },

        {
          name  = "PORT"
          value = tostring(var.frontend_container_port)
        }
      ]

      logConfiguration = {
        logDriver = "awslogs"

        options = {
          awslogs-group         = aws_cloudwatch_log_group.frontend.name
          awslogs-region        = var.aws_region
          awslogs-stream-prefix = "frontend"
        }
      }
    }
  ])

  depends_on = [
    aws_iam_role_policy_attachment.ecs_task_execution
  ]
}


# =========================================================
# BACKEND ECS TASK
# =========================================================

resource "aws_ecs_task_definition" "backend" {
  family = "${var.app_name}-backend"

  network_mode = "bridge"

  requires_compatibilities = [
    "EC2"
  ]

  cpu    = var.backend_cpu
  memory = var.backend_memory

  execution_role_arn = aws_iam_role.ecs_task_execution.arn

  task_role_arn = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([
    {
      name = "backend"

      image = "${aws_ecr_repository.backend.repository_url}:${var.backend_image_tag}"

      essential = true

      cpu    = var.backend_cpu
      memory = var.backend_memory

      portMappings = [
        {
          containerPort = var.backend_container_port
          hostPort      = var.backend_container_port
          protocol      = "tcp"
        }
      ]

      environment = [
        {
          name  = "DB_HOST"
          value = aws_db_instance.postgres.address
        },

        {
          name  = "DB_PORT"
          value = "5432"
        },

        {
          name  = "DB_NAME"
          value = var.db_name
        },

        {
          name  = "PORT"
          value = tostring(var.backend_container_port)
        }
      ]

      secrets = [
        {
          name      = "DB_USER"
          valueFrom = "${aws_db_instance.postgres.master_user_secret[0].secret_arn}:username::"
        },

        {
          name      = "DB_PASSWORD"
          valueFrom = "${aws_db_instance.postgres.master_user_secret[0].secret_arn}:password::"
        }
      ]

      healthCheck = {
        command = [
          "CMD-SHELL",
          "curl -f http://localhost:8000/health || exit 1"
        ]

        interval    = 30
        timeout     = 5
        retries     = 3
        startPeriod = 60
      }

      logConfiguration = {
        logDriver = "awslogs"

        options = {
          awslogs-group         = aws_cloudwatch_log_group.backend.name
          awslogs-region        = var.aws_region
          awslogs-stream-prefix = "backend"
        }
      }
    }
  ])

  depends_on = [
    aws_db_instance.postgres,
    aws_iam_role_policy.ecs_task_secrets,
    aws_iam_role_policy_attachment.ecs_task_execution
  ]
}


# =========================================================
# FRONTEND ECS SERVICE
# =========================================================

resource "aws_ecs_service" "frontend" {
  name = "${var.app_name}-frontend"

  cluster = aws_ecs_cluster.main.id

  desired_count = 1

  capacity_provider_strategy {
    capacity_provider = aws_ecs_capacity_provider.ec2.name

    weight = 100

    base = 1
  }

  task_definition = aws_ecs_task_definition.frontend.arn

  deployment_minimum_healthy_percent = 50
  deployment_maximum_percent         = 200

  health_check_grace_period_seconds = 60

  enable_execute_command = true

  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.frontend.arn

    container_name = "frontend"

    container_port = var.frontend_container_port
  }

  ordered_placement_strategy {
    type  = "spread"
    field = "attribute:ecs.availability-zone"
  }

  depends_on = [
    aws_ecs_cluster_capacity_providers.main,
    aws_lb_listener.http
  ]
}


# =========================================================
# BACKEND ECS SERVICE
# =========================================================

resource "aws_ecs_service" "backend" {
  name = "${var.app_name}-backend"

  cluster = aws_ecs_cluster.main.id

  desired_count = 1

  capacity_provider_strategy {
    capacity_provider = aws_ecs_capacity_provider.ec2.name

    weight = 100

    base = 1
  }

  task_definition = aws_ecs_task_definition.backend.arn

  deployment_minimum_healthy_percent = 50
  deployment_maximum_percent         = 200

  health_check_grace_period_seconds = 60

  enable_execute_command = true

  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.backend.arn

    container_name = "backend"

    container_port = var.backend_container_port
  }

  ordered_placement_strategy {
    type  = "spread"
    field = "attribute:ecs.availability-zone"
  }

  depends_on = [
    aws_ecs_cluster_capacity_providers.main,
    aws_lb_listener_rule.backend,
    aws_iam_role_policy.ecs_task_secrets
  ]
}


# =========================================================
# SNS
# =========================================================

resource "aws_sns_topic" "alerts" {
  name = "${var.app_name}-alerts"
}


resource "aws_sns_topic_subscription" "email" {
  count = var.alert_email != "" ? 1 : 0

  topic_arn = aws_sns_topic.alerts.arn

  protocol = "email"

  endpoint = var.alert_email
}


# =========================================================
# ALB FRONTEND UNHEALTHY ALARM
# =========================================================

resource "aws_cloudwatch_metric_alarm" "frontend_unhealthy" {
  alarm_name = "${var.app_name}-frontend-unhealthy"

  alarm_description = "Frontend target is unhealthy"

  namespace = "AWS/ApplicationELB"

  metric_name = "UnHealthyHostCount"

  statistic = "Maximum"

  period = 60

  evaluation_periods = 2

  threshold = 1

  comparison_operator = "GreaterThanOrEqualToThreshold"

  dimensions = {
    LoadBalancer = aws_lb.alb.arn_suffix
    TargetGroup  = aws_lb_target_group.frontend.arn_suffix
  }

  alarm_actions = [
    aws_sns_topic.alerts.arn
  ]

  treat_missing_data = "notBreaching"
}


# =========================================================
# ALB BACKEND UNHEALTHY ALARM
# =========================================================

resource "aws_cloudwatch_metric_alarm" "backend_unhealthy" {
  alarm_name = "${var.app_name}-backend-unhealthy"

  alarm_description = "Backend target is unhealthy"

  namespace = "AWS/ApplicationELB"

  metric_name = "UnHealthyHostCount"

  statistic = "Maximum"

  period = 60

  evaluation_periods = 2

  threshold = 1

  comparison_operator = "GreaterThanOrEqualToThreshold"

  dimensions = {
    LoadBalancer = aws_lb.alb.arn_suffix
    TargetGroup  = aws_lb_target_group.backend.arn_suffix
  }

  alarm_actions = [
    aws_sns_topic.alerts.arn
  ]

  treat_missing_data = "notBreaching"
}


# =========================================================
# RDS CPU ALARM
# =========================================================

resource "aws_cloudwatch_metric_alarm" "rds_cpu" {
  alarm_name = "${var.app_name}-rds-high-cpu"

  alarm_description = "RDS CPU utilization is high"

  namespace = "AWS/RDS"

  metric_name = "CPUUtilization"

  statistic = "Average"

  period = 300

  evaluation_periods = 2

  threshold = 80

  comparison_operator = "GreaterThanThreshold"

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.postgres.id
  }

  alarm_actions = [
    aws_sns_topic.alerts.arn
  ]

  treat_missing_data = "notBreaching"
}


# =========================================================
# ALB 5XX ALARM
# =========================================================

resource "aws_cloudwatch_metric_alarm" "alb_5xx" {
  alarm_name = "${var.app_name}-alb-5xx"

  alarm_description = "ALB is returning 5XX responses"

  namespace = "AWS/ApplicationELB"

  metric_name = "HTTPCode_ELB_5XX_Count"

  statistic = "Sum"

  period = 300

  evaluation_periods = 2

  threshold = 10

  comparison_operator = "GreaterThanThreshold"

  dimensions = {
    LoadBalancer = aws_lb.alb.arn_suffix
  }

  alarm_actions = [
    aws_sns_topic.alerts.arn
  ]

  treat_missing_data = "notBreaching"
}