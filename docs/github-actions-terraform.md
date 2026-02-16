# GitHub Actions for Terraform

This project can use GitHub Actions to run Terraform checks and deployment from the `terraform/` folder.

## Goals
- Run Terraform quality checks on every pull request.
- Generate a Terraform plan on push to `main`.
- Allow controlled apply to AWS from GitHub Actions.

## Prerequisites
- Terraform files are in `terraform/`.
- AWS account and IAM user/role for CI/CD.
- GitHub repository secrets configured.

## Required GitHub Secrets
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- Optional: `AWS_REGION` (defaults to `us-east-1` if not set)

## Recommended Workflow Behavior
- Pull Request:
  - `terraform fmt -check`
  - `terraform init`
  - `terraform validate`
  - `terraform plan` (no apply)
- Push to `main`:
  - Same checks
  - Plan output
  - Optional apply step (manual approval recommended with GitHub Environments)

## Example Workflow
Create `.github/workflows/terraform.yml`:

```yaml
name: Terraform CI/CD

on:
  pull_request:
    paths:
      - "terraform/**"
      - ".github/workflows/terraform.yml"
  push:
    branches: [ "main" ]
    paths:
      - "terraform/**"
      - ".github/workflows/terraform.yml"
  workflow_dispatch:

jobs:
  terraform:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: terraform
    env:
      TF_IN_AUTOMATION: true
      AWS_REGION: ${{ secrets.AWS_REGION || 'us-east-1' }}
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Terraform
        uses: hashicorp/setup-terraform@v3
        with:
          terraform_version: 1.6.6

      - name: Terraform Init
        run: terraform init -input=false

      - name: Terraform Format Check
        run: terraform fmt -check

      - name: Terraform Validate
        run: terraform validate

      - name: Terraform Plan
        run: terraform plan -input=false -no-color -out=tfplan

      - name: Upload Plan Artifact
        uses: actions/upload-artifact@v4
        with:
          name: tfplan
          path: terraform/tfplan

  apply:
    if: github.event_name == 'workflow_dispatch'
    needs: terraform
    runs-on: ubuntu-latest
    environment: production
    defaults:
      run:
        working-directory: terraform
    env:
      TF_IN_AUTOMATION: true
      AWS_REGION: ${{ secrets.AWS_REGION || 'us-east-1' }}
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Terraform
        uses: hashicorp/setup-terraform@v3
        with:
          terraform_version: 1.6.6

      - name: Terraform Init
        run: terraform init -input=false

      - name: Terraform Apply
        run: terraform apply -input=false -auto-approve
```

## Notes for This Repository
- Current `terraform/main.tf` is a scaffold, so plan/apply may produce minimal output until AWS resources are added.
- Keep state remote (S3 + DynamoDB lock) before production use.
- Prefer OIDC-based AWS auth later instead of long-lived AWS keys.
