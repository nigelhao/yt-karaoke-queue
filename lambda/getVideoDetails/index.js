const AWS = require("aws-sdk");
const https = require("https");

const secretsManager = new AWS.SecretsManager();

// Cache the API key to avoid fetching it on every request
let cachedApiKey = null;
let cacheExpiry = 0;
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes

async function getYouTubeApiKey() {
    const now = Date.now();
    if (cachedApiKey && now < cacheExpiry) {
        return cachedApiKey;
    }

    const secretName = `yt-karaoke-${process.env.NODE_ENV || "development"}`;
    const data = await secretsManager
        .getSecretValue({ SecretId: secretName })
        .promise();
    const secret = JSON.parse(data.SecretString);

    cachedApiKey = secret.YouTubeApiKey;
    cacheExpiry = now + CACHE_TTL;

    return cachedApiKey;
}

async function fetchVideoDetails(videoId, apiKey) {
    return new Promise((resolve, reject) => {
        const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${apiKey}`;

        https
            .get(url, (res) => {
                let data = "";

                res.on("data", (chunk) => {
                    data += chunk;
                });

                res.on("end", () => {
                    try {
                        const response = JSON.parse(data);
                        if (response.error) {
                            reject(new Error(response.error.message));
                            return;
                        }

                        if (!response.items || response.items.length === 0) {
                            reject(new Error("Video not found"));
                            return;
                        }

                        const video = response.items[0];
                        resolve({
                            videoId: video.id,
                            title: video.snippet.title,
                            thumbnail: video.snippet.thumbnails.medium.url,
                        });
                    } catch (error) {
                        reject(error);
                    }
                });
            })
            .on("error", reject);
    });
}

exports.handler = async (event) => {
    try {
        // Extract video ID from path parameters
        const videoId = event.pathParameters?.videoId;
        if (!videoId) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: "Video ID is required" }),
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "GET",
                    "Access-Control-Allow-Headers": "Content-Type",
                },
            };
        }

        // Get YouTube API key from Secrets Manager
        const apiKey = await getYouTubeApiKey();

        // Fetch video details from YouTube API
        const videoDetails = await fetchVideoDetails(videoId, apiKey);

        return {
            statusCode: 200,
            body: JSON.stringify(videoDetails),
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET",
                "Access-Control-Allow-Headers": "Content-Type",
            },
        };
    } catch (error) {
        console.error("Error:", error);

        return {
            statusCode: error.statusCode || 500,
            body: JSON.stringify({
                error: error.message || "Internal server error",
            }),
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET",
                "Access-Control-Allow-Headers": "Content-Type",
            },
        };
    }
};
