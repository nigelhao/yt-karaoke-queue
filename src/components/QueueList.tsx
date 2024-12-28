import React from "react";
import { useParams } from "react-router-dom";
import { useQueue } from "../contexts/QueueContext";
import { QueueItem } from "../types";
import { useWebSocket } from "../hooks/useWebSocket";
import LoadingSpinner from "./LoadingSpinner";

const QueueList: React.FC = () => {
    const { state, dispatch } = useQueue();
    const { sessionId } = useParams<{ sessionId: string }>();
    const { sendMessage } = useWebSocket(sessionId!);

    const handleRemoveFromQueue = (id: string) => {
        // Send message through WebSocket to update all clients
        sendMessage({
            action: "REMOVE_FROM_QUEUE",
            payload: id,
        });

        // Update local state
        dispatch({ type: "REMOVE_FROM_QUEUE", payload: id });
    };

    const handlePlayNext = (item: QueueItem) => {
        // Send message through WebSocket to update all clients
        sendMessage({
            action: "UPDATE_CURRENT_SONG",
            payload: item,
        });

        // Update local state
        dispatch({ type: "UPDATE_CURRENT_SONG", payload: item });
    };

    const formatDuration = (timestamp: string) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
        });
    };

    if (!state.session) {
        return (
            <div className="flex items-center justify-center h-full">
                <LoadingSpinner size="medium" />
            </div>
        );
    }

    return (
        <div className="bg-gray-900 text-white h-full flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-gray-800">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold">Queue</h2>
                    <span className="text-sm text-gray-400">
                        {state.queue.length}{" "}
                        {state.queue.length === 1 ? "song" : "songs"}
                    </span>
                </div>
            </div>

            {/* Queue List */}
            <div className="flex-1 overflow-y-auto">
                {state.queue.length === 0 ? (
                    <div className="text-gray-400 text-center py-8">
                        <p className="mb-2">No songs in queue</p>
                        <p className="text-sm">
                            Add some songs to get started!
                        </p>
                    </div>
                ) : (
                    <div className="space-y-2 p-4">
                        {state.queue.map((item: QueueItem) => (
                            <div
                                key={item.id}
                                className={`flex items-center space-x-4 p-3 rounded-lg ${
                                    state.session?.currentSong?.id === item.id
                                        ? "bg-blue-600"
                                        : "bg-gray-800 hover:bg-gray-700"
                                } transition-colors`}
                            >
                                {/* Thumbnail */}
                                <img
                                    src={item.thumbnail}
                                    alt={item.title}
                                    className="w-16 h-12 object-cover rounded flex-shrink-0"
                                />

                                {/* Song Info */}
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-sm font-medium truncate">
                                        {item.title}
                                    </h3>
                                    <p className="text-xs text-gray-400">
                                        Added by {item.addedBy} at{" "}
                                        {formatDuration(item.addedAt)}
                                    </p>
                                </div>

                                {/* Actions */}
                                {state.session?.currentSong?.id !== item.id && (
                                    <div className="flex items-center space-x-2 flex-shrink-0">
                                        {/* Play Next Button (only show in host view) */}
                                        {window.location.pathname.includes(
                                            "/host/"
                                        ) && (
                                            <button
                                                onClick={() =>
                                                    handlePlayNext(item)
                                                }
                                                className="p-2 hover:bg-blue-600 rounded-full transition-colors"
                                                title="Play next"
                                            >
                                                <svg
                                                    className="w-5 h-5"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                                                    />
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                                    />
                                                </svg>
                                            </button>
                                        )}

                                        {/* Remove Button */}
                                        <button
                                            onClick={() =>
                                                handleRemoveFromQueue(item.id)
                                            }
                                            className="p-2 hover:bg-red-600 rounded-full transition-colors"
                                            title="Remove from queue"
                                        >
                                            <svg
                                                className="w-5 h-5"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M6 18L18 6M6 6l12 12"
                                                />
                                            </svg>
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Currently Playing */}
            {state.session.currentSong && (
                <div className="p-4 border-t border-gray-800 bg-gray-800">
                    <div className="flex items-center space-x-4">
                        <img
                            src={state.session.currentSong.thumbnail}
                            alt={state.session.currentSong.title}
                            className="w-12 h-12 object-cover rounded"
                        />
                        <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-400">Now Playing</p>
                            <h3 className="text-sm font-medium truncate">
                                {state.session.currentSong.title}
                            </h3>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default QueueList;
