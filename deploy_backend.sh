#!/bin/bash
set -e

echo "🚀 Starting deployment process..."

# Change to backend directory
cd "$(dirname "$0")/backend"

# AWS Environment Checks
echo "🔍 Checking AWS environment..."
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI not found. Please install AWS CLI first."
    exit 1
fi

if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS credentials not configured. Please run 'aws configure' first."
    exit 1
fi

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
REGION=$(aws configure get region || echo "us-east-1")
echo "✅ AWS configured - Account: $ACCOUNT_ID, Region: $REGION"

# User confirmation for deployment
echo ""
echo "🔔 Deployment Confirmation"
echo "Account ID: $ACCOUNT_ID"
echo "Region: $REGION"
echo ""
read -p "Do you want to proceed with backend deployment? (y/N): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Deployment cancelled by user"
    exit 0
fi

# Check Docker availability
echo "🐳 Checking Docker..."
if ! command -v docker &> /dev/null; then
    echo "❌ Docker not found. Please install Docker first."
    exit 1
fi

if ! docker info &> /dev/null; then
    echo "❌ Docker daemon not running. Please start Docker first."
    exit 1
fi

# Set Docker platform for consistent builds
export DOCKER_DEFAULT_PLATFORM=linux/amd64

# Verify Lambda requirements.txt exists
if [ ! -f "lambda/requirements.txt" ]; then
    echo "❌ lambda/requirements.txt not found. Creating default file..."
    echo "pydantic==2.9.2" > lambda/requirements.txt
    echo "boto3==1.35.36" >> lambda/requirements.txt
    echo "✅ Created lambda/requirements.txt"
fi

# Install dependencies
echo "📦 Installing dependencies..."
if [ ! -d "node_modules" ]; then
    npm install
else
    echo "✅ Node modules already installed"
fi

# Build project
echo "🔨 Building project..."
npm run build

# Bootstrap CDK if required
echo "🏗️ Checking CDK bootstrap status..."
if ! aws cloudformation describe-stacks --stack-name CDKToolkit --region $REGION &> /dev/null; then
    echo "🔧 Bootstrapping CDK..."
    npx cdk bootstrap aws://$ACCOUNT_ID/$REGION
else
    echo "✅ CDK already bootstrapped"
fi

# Deploy stack
echo "🚀 Deploying stack..."
npx cdk deploy --require-approval never

echo "✅ Deployment completed successfully!"
