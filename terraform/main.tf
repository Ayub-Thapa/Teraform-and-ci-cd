locals {
  tags = {
    Project = var.project_name
    Managed = "terraform"
  }
}

# Starter file.
# Next step: add VPC, ALB, ECS cluster/service, and ECR resources.
