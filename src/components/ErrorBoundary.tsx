import React from "react";
import LoadingSpinner from "./LoadingSpinner";

interface Props {
    children: React.ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: React.ErrorInfo | null;
    isLoading: boolean;
}

class ErrorBoundary extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
            isLoading: false,
        };
    }

    static getDerivedStateFromError(error: Error) {
        return {
            hasError: true,
            error,
        };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        this.setState({
            error,
            errorInfo,
        });

        // Log error to console in development
        if (process.env.NODE_ENV === "development") {
            console.error("React error:", error);
            console.error("Error info:", errorInfo);
        }

        // In production, you could send error to error tracking service
        // if (process.env.NODE_ENV === 'production') {
        //   sendErrorToService(error, errorInfo);
        // }
    }

    handleRetry = async () => {
        this.setState({ isLoading: true });

        try {
            // Clear error state
            this.setState({
                hasError: false,
                error: null,
                errorInfo: null,
            });

            // Wait for state to update
            await new Promise((resolve) => setTimeout(resolve, 100));

            // Reload the page
            window.location.reload();
        } catch (error) {
            this.setState({
                hasError: true,
                error: error as Error,
                errorInfo: null,
            });
        } finally {
            this.setState({ isLoading: false });
        }
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
                    <div className="bg-gray-800 rounded-lg p-8 max-w-lg w-full text-center">
                        <h1 className="text-xl font-bold mb-4 text-white">
                            Something went wrong
                        </h1>

                        <p className="text-gray-300 mb-6">
                            {this.state.error?.message ||
                                "An unexpected error occurred"}
                        </p>

                        {process.env.NODE_ENV === "development" &&
                            this.state.errorInfo && (
                                <pre className="text-left text-xs text-gray-400 bg-gray-900 p-4 rounded mb-6 overflow-auto">
                                    {this.state.errorInfo.componentStack}
                                </pre>
                            )}

                        <button
                            onClick={this.handleRetry}
                            disabled={this.state.isLoading}
                            className={`inline-flex items-center justify-center px-4 py-2 rounded ${
                                this.state.isLoading
                                    ? "bg-gray-600 cursor-not-allowed"
                                    : "bg-blue-600 hover:bg-blue-700"
                            } text-white font-medium transition-colors`}
                        >
                            {this.state.isLoading ? (
                                <>
                                    <LoadingSpinner size="small" />
                                    <span className="ml-2">Reloading...</span>
                                </>
                            ) : (
                                "Try Again"
                            )}
                        </button>

                        {!this.state.isLoading && (
                            <p className="mt-4 text-sm text-gray-400">
                                If the problem persists, please refresh the page
                            </p>
                        )}
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
