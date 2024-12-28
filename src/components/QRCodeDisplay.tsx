import React, { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { useQueue } from "../contexts/QueueContext";
import LoadingSpinner from "./LoadingSpinner";

const QRCodeDisplay: React.FC = () => {
    const { state } = useQueue();
    const [copied, setCopied] = useState(false);

    // Get the current session ID
    const sessionId = state.session?.id;

    // Generate the join URL that users will scan
    const joinUrl = sessionId
        ? `${window.location.origin}/join/${sessionId}`
        : "";

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(joinUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
        } catch (err) {
            console.error("Failed to copy URL:", err);
        }
    };

    if (!sessionId) {
        return (
            <div className="flex items-center justify-center h-full">
                <LoadingSpinner size="medium" />
            </div>
        );
    }

    return (
        <div className="bg-white p-6 rounded-lg shadow-lg text-center">
            <h2 className="text-xl font-bold mb-4 text-gray-800">
                Join Session
            </h2>

            {/* QR Code */}
            <div className="mb-4">
                <QRCodeSVG
                    value={joinUrl}
                    size={200}
                    level="H"
                    includeMargin={true}
                    className="mx-auto"
                />
            </div>

            {/* Session Info */}
            <div className="space-y-2">
                <p className="text-sm text-gray-600">Scan to join the queue</p>
                <p className="text-xs text-gray-500 break-all">
                    Session ID: {sessionId}
                </p>
            </div>

            {/* Copy Link Button */}
            <div className="mt-4">
                <button
                    onClick={handleCopyLink}
                    className={`text-sm px-4 py-2 rounded transition-colors ${
                        copied
                            ? "bg-green-500 text-white"
                            : "text-blue-600 hover:bg-blue-50"
                    }`}
                >
                    {copied ? "Copied!" : "Copy Join Link"}
                </button>
            </div>

            {/* Mobile Instructions */}
            <div className="mt-4 text-xs text-gray-400">
                <p>Or open this link on your phone:</p>
                <p className="mt-1 break-all">{joinUrl}</p>
            </div>
        </div>
    );
};

export default QRCodeDisplay;
