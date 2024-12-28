import { Routes, Route, Navigate } from "react-router-dom";
import { QueueProvider } from "./contexts/QueueContext";
import ErrorBoundary from "./components/ErrorBoundary";
import HomePage from "./components/HomePage";
import HostView from "./components/HostView";
import MobileView from "./components/MobileView";

function App() {
    return (
        <ErrorBoundary>
            <QueueProvider>
                <div className="min-h-screen bg-gray-900">
                    <Routes>
                        {/* Home page - Create new session */}
                        <Route path="/" element={<HomePage />} />

                        {/* Host view - YouTube player and queue management */}
                        <Route path="/host/:sessionId" element={<HostView />} />
                        <Route
                            path="/host"
                            element={<Navigate to="/" replace />}
                        />

                        {/* Mobile view - Add songs to queue */}
                        <Route
                            path="/join/:sessionId"
                            element={<MobileView />}
                        />
                        <Route
                            path="/join"
                            element={<Navigate to="/" replace />}
                        />

                        {/* Catch all - Redirect to home */}
                        <Route
                            path="*"
                            element={
                                <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
                                    <div className="text-center">
                                        <h1 className="text-2xl font-bold text-white mb-4">
                                            Page Not Found
                                        </h1>
                                        <p className="text-gray-300 mb-6">
                                            The page you're looking for doesn't
                                            exist
                                        </p>
                                        <a
                                            href="/"
                                            className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                                        >
                                            Go Home
                                        </a>
                                    </div>
                                </div>
                            }
                        />
                    </Routes>
                </div>
            </QueueProvider>
        </ErrorBoundary>
    );
}

export default App;
