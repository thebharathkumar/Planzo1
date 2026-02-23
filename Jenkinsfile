pipeline {
  agent any

  options {
    timestamps()
  }

  environment {
    NODE_ENV = 'production'
  }

  stages {
    stage('Install') {
      steps {
        sh 'npm install'
      }
    }
    stage('Lint') {
      steps {
        sh 'npm run lint'
      }
    }
    stage('Typecheck') {
      steps {
        sh 'npm run typecheck'
      }
    }
    stage('Test') {
      steps {
        sh 'npm test'
      }
    }
    stage('Build') {
      steps {
        sh 'npm run build'
      }
    }
    // TODO (Week 2+): docker build/push to ECR + CDK deploy to staging/prod.
  }
}
