# YouTube Karaoke Queue System

A real-time karaoke queue system that uses YouTube videos as the source for music and video. Built with React, TypeScript, and AWS serverless services.

## Features

-   Host view with YouTube player and queue management
-   QR code generation for easy session joining
-   Mobile-friendly interface for adding songs to queue
-   Real-time updates using WebSocket
-   AWS serverless backend for scalability

## Prerequisites

-   Node.js (v16 or higher)
-   npm or yarn
-   AWS account with appropriate permissions
-   AWS CLI installed and configured
-   YouTube Data API key

## Quick Start

1. Clone the repository:

```bash
git clone https://github.com/yourusername/yt-karaoke-queue.git
cd yt-karaoke-queue
```

2. Run the setup script:

```bash
# For development environment
./setup.sh development

# For production environment
./setup.sh production
```

3. Update the `.env` file with your AWS credentials and YouTube API key.

4. Deploy the AWS infrastructure:

```bash
# For development environment
./deploy.sh development

# For production environment
./deploy.sh production
```

5. Start the application:

```bash
# Development mode
./dev.sh

# Production mode
npm run build && npm run preview
```

## AWS Infrastructure

### DynamoDB Tables

1. KaraokeSessions-{environment}

    - Primary Key: sessionId (String)
    - Attributes:
        - createdAt (String)
        - active (Boolean)
        - currentSong (String/NULL)

2. KaraokeQueues-{environment}
    - Primary Key: sessionId (String)
    - Sort Key: itemId (String)
    - Attributes:
        - videoId (String)
        - title (String)
        - thumbnail (String)
        - addedBy (String)
        - addedAt (String)
        - played (Boolean)

### Lambda Functions

1. getVideoDetails

    - Fetches video information from YouTube API
    - Endpoint: GET /video-details/{videoId}

2. WebSocket Handler
    - Manages real-time connections and messages
    - Routes:
        - $connect
        - $disconnect
        - message

### API Gateway

1. REST API

    - /video-details/{videoId} - Get YouTube video details

2. WebSocket API
    - Handles real-time communication
    - Supports connection management and message broadcasting

## Development vs Production

### Development Mode

-   Uses local environment
-   Automatic reloading
-   Detailed error messages
-   Start with `./dev.sh`

### Production Mode

-   Optimized build
-   Minified code
-   Error tracking
-   Deploy with `./deploy.sh production`

## Environment Variables

Required variables in `.env` file:

```
# AWS Configuration
VITE_AWS_REGION=ap-southeast-1
VITE_AWS_ACCESS_KEY_ID=your-access-key-id
VITE_AWS_SECRET_ACCESS_KEY=your-secret-access-key

# API Gateway Configuration
VITE_API_ENDPOINT=https://xxx.execute-api.region.amazonaws.com/dev
VITE_WEBSOCKET_URL=wss://xxx.execute-api.region.amazonaws.com/dev

# Environment
MODE=development # or production
```

## Usage

### Host View

1. Visit the application URL
2. Click "Create New Session"
3. Share the displayed QR code with participants
4. Control playback and manage queue

### Participant View

1. Scan the QR code
2. Enter YouTube video URLs to add songs
3. View queue and currently playing song
4. Remove own songs from queue

## Troubleshooting

### Common Issues

1. AWS Deployment Failures

    - Check AWS credentials
    - Verify IAM permissions
    - Review CloudFormation logs

2. WebSocket Connection Issues

    - Check API Gateway configuration
    - Verify WebSocket URL
    - Review browser console logs

3. YouTube Player Problems
    - Ensure video is available in your region
    - Check browser console for errors
    - Verify YouTube API key

### Getting Help

1. Check CloudWatch logs for Lambda errors
2. Review API Gateway logs
3. Check DynamoDB table permissions
4. Verify environment variables

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
