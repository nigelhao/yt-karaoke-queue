import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createSession } from "../services/aws";
import LoadingSpinner from "./LoadingSpinner";

const HomePage: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const handleCreateSession = async () => {
        setLoading(true);
        setError(null);

        try {
            const session = await createSession();
            // Navigate to the host view with the new session ID
            navigate(`/host/${session.id}`);
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Failed to create session"
            );
            console.error("Session creation error:", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
            <div className="max-w-md w-full bg-gray-800 rounded-lg shadow-lg p-8 text-center">
                <h1 className="text-3xl font-bold text-white mb-8">
                    YouTube Karaoke Queue
                </h1>

                <button
                    onClick={handleCreateSession}
                    disabled={loading}
                    className={`w-full py-3 px-6 rounded-lg text-lg font-semibold transition-colors ${
                        loading
                            ? "bg-blue-400 cursor-not-allowed"
                            : "bg-blue-600 hover:bg-blue-700"
                    } text-white`}
                >
                    {loading ? (
                        <div className="flex items-center justify-center">
                            <LoadingSpinner size="small" />
                            <span className="ml-2">Creating Session...</span>
                        </div>
                    ) : (
                        "Create New Session"
                    )}
                </button>

                {error && (
                    <div className="mt-4 text-red-400 text-sm">{error}</div>
                )}

                <div className="mt-8 text-gray-400 text-sm">
                    <p>
                        Click the button above to start a new karaoke session.
                    </p>
                    <p className="mt-2">
                        Share the QR code with others to let them join and add
                        songs to the queue!
                    </p>
                </div>

                <div className="mt-8 text-gray-500 text-xs">
                    <p>Made with ❤️ using React and AWS</p>
                </div>
            </div>
        </div>
    );
};

export default HomePage;
