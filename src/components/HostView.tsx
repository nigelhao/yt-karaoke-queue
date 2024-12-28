import React, { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSession } from "../hooks/useSession";
import { useWebSocket } from "../hooks/useWebSocket";
import { useQueue } from "../contexts/QueueContext";
import YouTubePlayer from "./YouTubePlayer";
import QueueList from "./QueueList";
import QRCodeDisplay from "./QRCodeDisplay";
import LoadingSpinner from "./LoadingSpinner";

const HostView: React.FC = () => {
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
            <div className="h-screen bg-gray-900 flex items-center justify-center">
                <LoadingSpinner size="large" />
            </div>
        );
    }

    // Show error state with retry option
    if (error || !state.session) {
        return (
            <div className="h-screen bg-gray-900 flex items-center justify-center p-4">
                <div className="bg-gray-800 rounded-lg p-8 max-w-lg w-full text-center">
                    <h2 className="text-xl font-bold mb-4 text-white">
                        Session Error
                    </h2>
                    <p className="text-red-400 mb-6">
                        {error || "Session not found"}
                    </p>
                    <button
                        onClick={() => navigate("/")}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition-colors"
                    >
                        Create New Session
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen bg-gray-900 text-white">
            <div className="grid grid-cols-1 lg:grid-cols-4 h-full">
                {/* Main content area - YouTube player */}
                <div className="lg:col-span-3 h-full relative">
                    <YouTubePlayer />

                    {/* Connection Status */}
                    <div className="absolute top-4 right-4 flex items-center space-x-2">
                        <div
                            className={`w-2 h-2 rounded-full ${
                                isConnected ? "bg-green-500" : "bg-red-500"
                            }`}
                        />
                        <span className="text-sm">
                            {isConnected ? "Connected" : "Disconnected"}
                        </span>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="lg:col-span-1 border-l border-gray-700 flex flex-col h-full">
                    {/* Queue list */}
                    <div className="flex-grow overflow-hidden">
                        <QueueList />
                    </div>

                    {/* QR Code section */}
                    <div className="p-4 border-t border-gray-700">
                        <QRCodeDisplay />
                    </div>
                </div>
            </div>

            {/* Mobile Layout - Bottom Navigation */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700">
                <div className="flex justify-around">
                    <button
                        className="flex-1 py-4 text-center text-sm font-medium text-gray-400 hover:text-white"
                        onClick={() =>
                            document
                                .getElementById("player-section")
                                ?.scrollIntoView()
                        }
                    >
                        Player
                    </button>
                    <button
                        className="flex-1 py-4 text-center text-sm font-medium text-gray-400 hover:text-white"
                        onClick={() =>
                            document
                                .getElementById("queue-section")
                                ?.scrollIntoView()
                        }
                    >
                        Queue
                    </button>
                    <button
                        className="flex-1 py-4 text-center text-sm font-medium text-gray-400 hover:text-white"
                        onClick={() =>
                            document
                                .getElementById("qr-section")
                                ?.scrollIntoView()
                        }
                    >
                        QR Code
                    </button>
                </div>
            </div>
        </div>
    );
};

export default HostView;
