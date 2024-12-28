import React, { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSession } from "../hooks/useSession";
import { useWebSocket } from "../hooks/useWebSocket";
import { useQueue } from "../contexts/QueueContext";
import AddToQueue from "./AddToQueue";
import QueueList from "./QueueList";
import LoadingSpinner from "./LoadingSpinner";

const MobileView: React.FC = () => {
    const { sessionId } = useParams<{ sessionId: string }>();
    const navigate = useNavigate();
    const { loading, error } = useSession(sessionId);
    const { state } = useQueue();
    const { isConnected } = useWebSocket(sessionId!);

    // Redirect to home if no sessionId
    useEffect(() => {
        if (!sessionId) {
            navigate("/");
        }
    }, [sessionId, navigate]);

    // Show loading state
    if (loading) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <LoadingSpinner size="large" />
            </div>
        );
    }

    // Show error state with retry option
    if (error || !state.session) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
                <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full text-center">
                    <h2 className="text-xl font-bold mb-4 text-gray-800">
                        Unable to Join Session
                    </h2>
                    <p className="text-red-600 mb-6">
                        {error || "Session not found"}
                    </p>
                    <button
                        onClick={() => navigate("/")}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition-colors"
                    >
                        Return Home
                    </button>
                    <p className="mt-4 text-sm text-gray-600">
                        Ask the host to share a new QR code
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Header */}
            <header className="bg-white shadow-sm">
                <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
                    <h1 className="text-lg font-semibold text-gray-900">
                        Add Songs to Queue
                    </h1>
                    <div className="flex items-center space-x-2">
                        <div
                            className={`w-2 h-2 rounded-full ${
                                isConnected ? "bg-green-500" : "bg-red-500"
                            }`}
                        />
                        <span className="text-sm text-gray-600">
                            {isConnected ? "Connected" : "Disconnected"}
                        </span>
                    </div>
                </div>
            </header>

            <div className="max-w-md mx-auto py-6 px-4 space-y-6">
                {/* Add to queue form */}
                <div className="bg-white rounded-lg shadow">
                    <AddToQueue />
                </div>

                {/* Current queue */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="p-4 border-b border-gray-200">
                        <h2 className="text-lg font-semibold text-gray-900">
                            Current Queue
                        </h2>
                    </div>
                    <div className="max-h-[60vh] overflow-y-auto">
                        <QueueList />
                    </div>
                </div>

                {/* Currently playing */}
                {state.session.currentSong && (
                    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
                        <div className="max-w-md mx-auto flex items-center space-x-4">
                            <img
                                src={state.session.currentSong.thumbnail}
                                alt="Thumbnail"
                                className="w-12 h-12 object-cover rounded"
                            />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                    Now Playing
                                </p>
                                <p className="text-sm text-gray-500 truncate">
                                    {state.session.currentSong.title}
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MobileView;
