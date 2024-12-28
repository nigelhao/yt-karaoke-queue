#!/bin/bash

# Exit on error
set -e

# Default environment
ENVIRONMENT=${1:-development}
REGION=${2:-ap-southeast-1}
STACK_NAME="yt-karaoke-queue-$ENVIRONMENT"
DEPLOYMENT_BUCKET="yt-karaoke-deployment-$ENVIRONMENT"

echo "Deploying to environment: $ENVIRONMENT"
echo "AWS Region: $REGION"

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "AWS CLI is not installed. Please install it first."
    exit 1
fi

# Check AWS credentials
echo "Checking AWS credentials..."
if ! aws sts get-caller-identity &> /dev/null; then
    echo "AWS credentials not configured. Please run 'aws configure' to set up your credentials."
    exit 1
fi

# Check if YouTube API key secret exists
SECRET_NAME="yt-karaoke-$ENVIRONMENT"
if ! aws secretsmanager describe-secret --secret-id "$SECRET_NAME" --region "$REGION" &> /dev/null; then
    echo "YouTube API key not found in AWS Secrets Manager."
    echo "Please run './setup.sh $ENVIRONMENT' first."
    exit 1
fi

# Create S3 bucket if it doesn't exist
if ! aws s3 ls "s3://$DEPLOYMENT_BUCKET" 2>&1 > /dev/null; then
    echo "Creating deployment bucket: $DEPLOYMENT_BUCKET"
    aws s3 mb "s3://$DEPLOYMENT_BUCKET" --region "$REGION"
fi

# Build and package Lambda functions
echo "Building Lambda functions..."

# Build getVideoDetails Lambda
cd lambda/getVideoDetails
npm install
zip -r ../../getVideoDetails.zip .
cd ../..

# Build WebSocket Lambda
cd lambda/websocket
npm install
zip -r ../../websocket.zip .
cd ../..

# Upload Lambda packages to S3
echo "Uploading Lambda packages to S3..."
aws s3 cp getVideoDetails.zip "s3://$DEPLOYMENT_BUCKET/$ENVIRONMENT/getVideoDetails.zip"
aws s3 cp websocket.zip "s3://$DEPLOYMENT_BUCKET/$ENVIRONMENT/websocket.zip"

# Deploy CloudFormation stack
echo "Deploying CloudFormation stack..."
aws cloudformation deploy \
    --template-file cloudformation.yaml \
    --stack-name "$STACK_NAME" \
    --parameter-overrides \
        Environment="$ENVIRONMENT" \
        DeploymentBucket="$DEPLOYMENT_BUCKET" \
    --capabilities CAPABILITY_IAM \
    --region "$REGION"

# Get stack outputs
echo "Getting stack outputs..."
aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --query 'Stacks[0].Outputs[*].[OutputKey,OutputValue]' \
    --output table \
    --region "$REGION"

# Update .env file with API endpoints
echo "Updating .env file with API endpoints..."
API_URL=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --query 'Stacks[0].Outputs[?OutputKey==`RestApiUrl`].OutputValue' \
    --output text \
    --region "$REGION")

WEBSOCKET_URL=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --query 'Stacks[0].Outputs[?OutputKey==`WebSocketApiUrl`].OutputValue' \
    --output text \
    --region "$REGION")

sed -i '' "s#VITE_API_ENDPOINT=.*#VITE_API_ENDPOINT=$API_URL#" .env
sed -i '' "s#VITE_WEBSOCKET_URL=.*#VITE_WEBSOCKET_URL=$WEBSOCKET_URL#" .env

# Clean up temporary files
echo "Cleaning up..."
rm -f getVideoDetails.zip websocket.zip

echo "
Deployment complete!

API Endpoints have been updated in your .env file:
REST API: $API_URL
WebSocket: $WEBSOCKET_URL

To run the application:
Development: ./dev.sh
Production:  npm run build && npm run preview

For more information, please refer to the README.md file.
"