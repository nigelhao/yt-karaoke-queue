import React, { useRef, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useQueue } from "../contexts/QueueContext";
import { useYouTubePlayer } from "../hooks/useYouTubePlayer";
import { useWebSocket } from "../hooks/useWebSocket";
import LoadingSpinner from "./LoadingSpinner";

const YouTubePlayer: React.FC = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const { state, dispatch } = useQueue();
    const { sessionId } = useParams<{ sessionId: string }>();
    const { sendMessage } = useWebSocket(sessionId!);
    const { playerState, initializePlayer, play, pause, seekTo, setVolume } =
        useYouTubePlayer();

    useEffect(() => {
        if (containerRef.current) {
            initializePlayer("youtube-player");
        }
    }, [initializePlayer]);

    // Handle video end and play next song
    const handleVideoEnd = () => {
        if (!state.session?.currentSong || !state.queue.length) return;

        const nextSong = state.queue[0];
        if (nextSong) {
            // Send message through WebSocket to update all clients
            sendMessage({
                action: "UPDATE_CURRENT_SONG",
                payload: nextSong,
            });

            // Update local state
            dispatch({ type: "UPDATE_CURRENT_SONG", payload: nextSong });
        }
    };

    // Handle manual play next
    const handlePlayNext = () => {
        if (!state.queue.length) return;
        handleVideoEnd();
    };

    if (!state.session) {
        return (
            <div className="h-screen bg-gray-900 flex items-center justify-center">
                <LoadingSpinner size="large" />
            </div>
        );
    }

    return (
        <div className="relative w-full h-full bg-black">
            {/* YouTube Player Container */}
            <div
                ref={containerRef}
                id="youtube-player"
                className="absolute inset-0"
            />

            {/* Loading State */}
            {!playerState.isReady && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                    <LoadingSpinner size="large" className="text-white" />
                </div>
            )}

            {/* Current Song Overlay */}
            {state.session.currentSong && playerState.isReady && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
                    <div className="max-w-3xl mx-auto">
                        <h2 className="text-white text-lg font-semibold truncate">
                            {state.session.currentSong.title}
                        </h2>
                        <p className="text-gray-300 text-sm">
                            Added by {state.session.currentSong.addedBy}
                        </p>
                    </div>
                </div>
            )}

            {/* No Song Playing State */}
            {!state.session.currentSong && playerState.isReady && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black text-center p-8">
                    <h2 className="text-white text-2xl font-bold mb-4">
                        No Song Playing
                    </h2>
                    {state.queue.length > 0 ? (
                        <>
                            <p className="text-gray-400 mb-4">
                                Next song will play automatically
                            </p>
                            <button
                                onClick={handlePlayNext}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                            >
                                Play Next Song
                            </button>
                        </>
                    ) : (
                        <p className="text-gray-400">
                            Add songs to the queue to get started!
                        </p>
                    )}
                </div>
            )}

            {/* Connection Status */}
            <div className="absolute top-4 right-4 flex items-center space-x-2">
                <div
                    className={`w-2 h-2 rounded-full ${
                        state.isConnected ? "bg-green-500" : "bg-red-500"
                    }`}
                />
                <span className="text-sm text-white">
                    {state.isConnected ? "Connected" : "Disconnected"}
                </span>
            </div>

            {/* Player Controls */}
            {playerState.isReady && state.session.currentSong && (
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black">
                    <div className="max-w-3xl mx-auto flex items-center space-x-4">
                        <button
                            onClick={playerState.isPlaying ? pause : play}
                            className="p-2 hover:bg-gray-800 rounded-full transition-colors"
                        >
                            {playerState.isPlaying ? (
                                <svg
                                    className="w-6 h-6"
                                    fill="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                                </svg>
                            ) : (
                                <svg
                                    className="w-6 h-6"
                                    fill="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path d="M8 5v14l11-7z" />
                                </svg>
                            )}
                        </button>
                        <div className="flex-1">
                            <div className="h-1 bg-gray-700 rounded-full">
                                <div
                                    className="h-full bg-blue-500 rounded-full"
                                    style={{
                                        width: `${(playerState.currentTime / playerState.duration) * 100}%`,
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default YouTubePlayer;
