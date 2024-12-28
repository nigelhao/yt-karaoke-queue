import React from "react";

interface Props {
    size?: "small" | "medium" | "large";
    className?: string;
}

const LoadingSpinner: React.FC<Props> = ({
    size = "medium",
    className = "",
}) => {
    const sizeClasses = {
        small: "w-4 h-4",
        medium: "w-8 h-8",
        large: "w-12 h-12",
    };

    return (
        <div
            className={`loading-spinner ${sizeClasses[size]} ${className}`}
            role="status"
            aria-label="Loading"
        >
            <span className="sr-only">Loading...</span>
        </div>
    );
};

export default LoadingSpinner;
