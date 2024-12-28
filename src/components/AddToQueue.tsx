import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { useQueue } from "../contexts/QueueContext";
import { QueueItem } from "../types";
import { extractVideoId, isValidVideoUrl } from "../utils/youtube";
import { fetchVideoDetails } from "../services/aws";
import { getUUID } from "../utils/uuid";
import { useWebSocket } from "../hooks/useWebSocket";
import LoadingSpinner from "./LoadingSpinner";

const AddToQueue: React.FC = () => {
    const [url, setUrl] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const { dispatch } = useQueue();
    const { sessionId } = useParams<{ sessionId: string }>();
    const { sendMessage } = useWebSocket(sessionId!);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        // Validate URL
        if (!isValidVideoUrl(url)) {
            setError("Please enter a valid YouTube URL");
            return;
        }

        setLoading(true);

        try {
            const videoId = extractVideoId(url);
            if (!videoId) {
                throw new Error("Invalid YouTube URL");
            }

            const videoDetails = await fetchVideoDetails(videoId);

            const newQueueItem: QueueItem = {
                id: getUUID(),
                videoId: videoDetails.videoId,
                title: videoDetails.title,
                thumbnail: videoDetails.thumbnail,
                addedBy: "Guest", // In a real app, this would be the user's name
                addedAt: new Date().toISOString(),
                played: false,
            };

            // Send message through WebSocket to update all clients
            sendMessage({
                action: "ADD_TO_QUEUE",
                payload: newQueueItem,
            });

            // Update local state
            dispatch({ type: "ADD_TO_QUEUE", payload: newQueueItem });

            // Clear input
            setUrl("");
            setError("");
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to add video to queue"
            );
            console.error("Error adding video:", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4 text-gray-800">
                Add to Queue
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label
                        htmlFor="url"
                        className="block text-sm font-medium text-gray-700"
                    >
                        YouTube URL
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                        <input
                            type="text"
                            id="url"
                            value={url}
                            onChange={(e) => {
                                setUrl(e.target.value);
                                setError(""); // Clear error when user types
                            }}
                            placeholder="https://youtube.com/watch?v=..."
                            className={`block w-full pr-10 ${
                                error
                                    ? "border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500"
                                    : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                            } rounded-md focus:outline-none sm:text-sm`}
                            disabled={loading}
                        />
                        {error && (
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                <svg
                                    className="h-5 w-5 text-red-500"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                            </div>
                        )}
                    </div>
                    {error && (
                        <p className="mt-2 text-sm text-red-600">{error}</p>
                    )}
                </div>

                <button
                    type="submit"
                    disabled={loading || !url}
                    className={`w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                        loading || !url
                            ? "bg-blue-400 cursor-not-allowed"
                            : "bg-blue-600 hover:bg-blue-700"
                    } transition-colors`}
                >
                    {loading ? (
                        <>
                            <LoadingSpinner size="small" />
                            <span className="ml-2">Adding...</span>
                        </>
                    ) : (
                        "Add to Queue"
                    )}
                </button>
            </form>

            {/* URL Format Help */}
            <div className="mt-4 text-xs text-gray-500">
                <p>Supported URL formats:</p>
                <ul className="list-disc list-inside mt-1">
                    <li>youtube.com/watch?v=VIDEO_ID</li>
                    <li>youtu.be/VIDEO_ID</li>
                    <li>youtube.com/shorts/VIDEO_ID</li>
                </ul>
            </div>
        </div>
    );
};

export default AddToQueue;
