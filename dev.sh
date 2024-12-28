#!/bin/bash

# Exit on error
set -e

echo "Starting YouTube Karaoke Queue System..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "Creating .env file from .env.example..."
    cp .env.example .env
    echo "Please update .env with your configuration values."
    exit 1
fi

# Load environment variables
source <(grep -v '^#' .env | sed -E 's/(.+)=(.+)/export \1="\2"/')

# Check required environment variables
required_vars=(
    "VITE_AWS_REGION"
    "VITE_AWS_ACCESS_KEY_ID"
    "VITE_AWS_SECRET_ACCESS_KEY"
    "VITE_API_ENDPOINT"
    "VITE_WEBSOCKET_URL"
    "MODE"
)

missing_vars=()
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        missing_vars+=("$var")
    fi
done

if [ ${#missing_vars[@]} -ne 0 ]; then
    echo "Error: Missing required environment variables:"
    printf '%s\n' "${missing_vars[@]}"
    echo "Please update your .env file with these values."
    exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Check AWS credentials
echo "Checking AWS credentials..."
if ! aws sts get-caller-identity &> /dev/null; then
    echo "AWS credentials not configured or invalid."
    echo "Please check your AWS credentials in .env file:"
    echo "VITE_AWS_ACCESS_KEY_ID"
    echo "VITE_AWS_SECRET_ACCESS_KEY"
    echo "VITE_AWS_REGION"
    exit 1
fi

# Check DynamoDB tables
echo "Checking DynamoDB tables..."
tables=(
    "KaraokeSessions-$MODE"
    "KaraokeQueues-$MODE"
)

missing_tables=()
for table in "${tables[@]}"; do
    if ! aws dynamodb describe-table \
        --table-name "$table" \
        --region "$VITE_AWS_REGION" &> /dev/null; then
        missing_tables+=("$table")
    fi
done

if [ ${#missing_tables[@]} -ne 0 ]; then
    echo "Error: Missing DynamoDB tables:"
    printf '%s\n' "${missing_tables[@]}"
    echo "Please run './setup.sh $MODE' to create the required tables."
    exit 1
fi

# Check AWS Secrets Manager
echo "Checking YouTube API key..."
SECRET_NAME="yt-karaoke-$MODE"
if ! aws secretsmanager describe-secret \
    --secret-id "$SECRET_NAME" \
    --region "$VITE_AWS_REGION" &> /dev/null; then
    echo "Error: YouTube API key not found in AWS Secrets Manager."
    echo "Please run './setup.sh $MODE' to configure the YouTube API key."
    exit 1
fi

# Start the development server
echo "Starting development server..."
echo "Environment: $MODE"
echo "AWS Region: $VITE_AWS_REGION"
echo "API Endpoint: $VITE_API_ENDPOINT"
echo "WebSocket URL: $VITE_WEBSOCKET_URL"
echo "The application will be available at http://localhost:3000"
echo "Use Ctrl+C to stop the server"

# Set development mode
export NODE_ENV=development

# Run the development server
npm run dev
