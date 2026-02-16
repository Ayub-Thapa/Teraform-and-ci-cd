# Jenkins Migration Plan for Terraform

This document describes how to move the current GitHub Actions Terraform flow to Jenkins later without changing the Terraform structure.

## Migration Objective
- Keep the same Terraform stages: `fmt`, `init`, `validate`, `plan`, `apply`.
- Use Jenkins credentials instead of GitHub repository secrets.
- Keep `terraform/` as the working directory.

## Mapping: GitHub Actions to Jenkins
- Runner: `ubuntu-latest` -> Jenkins agent/node with Terraform installed.
- Secrets: GitHub Secrets -> Jenkins Credentials.
- Manual apply trigger: `workflow_dispatch` + environment approval -> Jenkins `input` approval step.
- Artifacts: GitHub artifact upload -> Jenkins archived artifacts.

## Jenkins Prerequisites
- Jenkins pipeline job (multibranch preferred).
- Terraform installed on the Jenkins agent.
- AWS credentials in Jenkins:
  - `aws-access-key-id` (Secret text)
  - `aws-secret-access-key` (Secret text)
  - Optional `aws-region` (Secret text)

## Example Jenkinsfile
Create `Jenkinsfile` in repository root:

```groovy
pipeline {
  agent any

  environment {
    TF_IN_AUTOMATION = "true"
    AWS_ACCESS_KEY_ID = credentials('aws-access-key-id')
    AWS_SECRET_ACCESS_KEY = credentials('aws-secret-access-key')
    AWS_REGION = credentials('aws-region')
  }

  stages {
    stage('Terraform Fmt') {
      steps {
        dir('terraform') {
          sh 'terraform fmt -check'
        }
      }
    }

    stage('Terraform Init') {
      steps {
        dir('terraform') {
          sh 'terraform init -input=false'
        }
      }
    }

    stage('Terraform Validate') {
      steps {
        dir('terraform') {
          sh 'terraform validate'
        }
      }
    }

    stage('Terraform Plan') {
      steps {
        dir('terraform') {
          sh 'terraform plan -input=false -no-color -out=tfplan'
        }
      }
    }

    stage('Approval') {
      when {
        branch 'main'
      }
      steps {
        input message: 'Approve Terraform apply to production?', ok: 'Apply'
      }
    }

    stage('Terraform Apply') {
      when {
        branch 'main'
      }
      steps {
        dir('terraform') {
          sh 'terraform apply -input=false -auto-approve tfplan'
        }
      }
    }
  }

  post {
    always {
      archiveArtifacts artifacts: 'terraform/tfplan', fingerprint: true, allowEmptyArchive: true
    }
  }
}
```

## Migration Checklist
- Confirm Terraform version in Jenkins matches local/dev version.
- Configure backend state storage (S3 + DynamoDB lock) before enabling apply.
- Restrict apply to protected branches and approval users.
- Add notifications (Slack/Email) for plan/apply status.

## Future Hardening
- Move from static AWS keys to IAM role-based auth for Jenkins agents.
- Split pipelines per environment (`dev`, `staging`, `prod`) with variable files.
