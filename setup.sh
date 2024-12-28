#!/bin/bash

# Exit on error
set -e

echo "YouTube Karaoke Queue System Setup"
echo "================================="

# Check for required tools
echo "Checking required tools..."

if ! command -v node &> /dev/null; then
    echo "Node.js is not installed. Please install Node.js v16 or higher."
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "npm is not installed. Please install npm."
    exit 1
fi

if ! command -v aws &> /dev/null; then
    echo "AWS CLI is not installed. Please install and configure AWS CLI."
    exit 1
fi

# Check AWS credentials
echo "Checking AWS credentials..."
if ! aws sts get-caller-identity &> /dev/null; then
    echo "AWS credentials not configured. Please run 'aws configure' to set up your credentials."
    exit 1
fi

# Check environment argument
ENVIRONMENT=${1:-development}
if [ "$ENVIRONMENT" != "development" ] && [ "$ENVIRONMENT" != "production" ]; then
    echo "Invalid environment. Please use 'development' or 'production'."
    exit 1
fi

# Install dependencies
echo "Installing project dependencies..."
npm install

# Install Lambda dependencies
echo "Installing Lambda dependencies..."
cd lambda/getVideoDetails && npm install && cd ../..
cd lambda/websocket && npm install && cd ../..

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "Creating .env file..."
    cp .env.example .env
fi

# Update environment in .env file
sed -i '' "s/MODE=.*/MODE=$ENVIRONMENT/" .env

# Get AWS region from .env or use default
REGION=$(grep VITE_AWS_REGION .env | cut -d '=' -f2 || echo "ap-southeast-1")

# Get YouTube API key
echo "Please enter your YouTube API key:"
read -s YOUTUBE_API_KEY
echo

# Create or update AWS Secrets Manager secret
echo "Setting up YouTube API key in AWS Secrets Manager..."
SECRET_NAME="yt-karaoke-$ENVIRONMENT"

# Check if secret exists
if aws secretsmanager describe-secret --secret-id "$SECRET_NAME" --region "$REGION" &> /dev/null; then
    # Update existing secret
    aws secretsmanager update-secret \
        --secret-id "$SECRET_NAME" \
        --secret-string "{\"YouTubeApiKey\":\"$YOUTUBE_API_KEY\"}" \
        --region "$REGION"
else
    # Create new secret
    aws secretsmanager create-secret \
        --name "$SECRET_NAME" \
        --description "YouTube API key for Karaoke Queue System" \
        --secret-string "{\"YouTubeApiKey\":\"$YOUTUBE_API_KEY\"}" \
        --region "$REGION"
fi

echo "Setting up DynamoDB tables..."

# Function to create table with error handling
create_table() {
    local table_name=$1
    local command=$2
    
    echo "Creating table: $table_name"
    if aws dynamodb describe-table --table-name "$table_name" --region "$REGION" &> /dev/null; then
        echo "Table $table_name already exists"
    else
        eval "$command"
        # Wait for table to be active
        echo "Waiting for table $table_name to be active..."
        aws dynamodb wait table-exists --table-name "$table_name" --region "$REGION"
    fi
}

# Create Sessions table
SESSIONS_TABLE="KaraokeSessions-$ENVIRONMENT"
SESSIONS_COMMAND="aws dynamodb create-table \
    --table-name \"$SESSIONS_TABLE\" \
    --attribute-definitions AttributeName=sessionId,AttributeType=S \
    --key-schema AttributeName=sessionId,KeyType=HASH \
    --billing-mode PAY_PER_REQUEST \
    --region \"$REGION\""

create_table "$SESSIONS_TABLE" "$SESSIONS_COMMAND"

# Create Queues table
QUEUES_TABLE="KaraokeQueues-$ENVIRONMENT"
QUEUES_COMMAND="aws dynamodb create-table \
    --table-name \"$QUEUES_TABLE\" \
    --attribute-definitions \
        AttributeName=sessionId,AttributeType=S \
        AttributeName=itemId,AttributeType=S \
    --key-schema \
        AttributeName=sessionId,KeyType=HASH \
        AttributeName=itemId,KeyType=RANGE \
    --billing-mode PAY_PER_REQUEST \
    --region \"$REGION\""

create_table "$QUEUES_TABLE" "$QUEUES_COMMAND"

echo "
Setup Complete!

Next steps:
1. Update the .env file with your AWS configuration:
   - Add your AWS credentials
   - Update API Gateway endpoints after deployment

2. Deploy AWS infrastructure:
   ./deploy.sh $ENVIRONMENT

3. Start the application:
   Development: ./dev.sh
   Production:  npm run build && npm run preview

For more information, please refer to the README.md file.
"