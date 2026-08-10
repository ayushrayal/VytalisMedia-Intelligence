import React from "react";

/**
 * Application-level React Error Boundary.
 * Catches unhandled rendering errors and displays clean fallback UI.
 */
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("[ErrorBoundary] Caught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            padding: "48px 24px",
            textAlign: "center",
            backgroundColor: "#0f172a",
            color: "#f8fafc",
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <h2 style={{ fontSize: "1.5rem", color: "#f43f5e", marginBottom: "12px" }}>
            Something went wrong
          </h2>
          <p style={{ color: "#94a3b8", maxWidth: "500px", marginBottom: "24px" }}>
            An unexpected error occurred while rendering the application interface.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: "10px 20px",
              backgroundColor: "#6366f1",
              color: "#ffffff",
              border: "none",
              borderRadius: "8px",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            Reload Application
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
