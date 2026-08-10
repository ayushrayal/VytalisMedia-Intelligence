import React from "react";

/**
 * Application-level React Error Boundary.
 * Uses clean light theme styling.
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
            backgroundColor: "var(--color-background, #FFFFFF)",
            color: "var(--color-text-primary, #111827)",
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <h2 style={{ fontSize: "1.5rem", color: "var(--color-error, #E5484D)", marginBottom: "12px", fontWeight: "700" }}>
            Something went wrong
          </h2>
          <p style={{ color: "var(--color-text-secondary, #475569)", maxWidth: "500px", marginBottom: "24px" }}>
            An unexpected error occurred while rendering the application interface.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: "10px 20px",
              backgroundColor: "var(--color-primary, #0A84FF)",
              color: "#FFFFFF",
              border: "none",
              borderRadius: "var(--radius-button, 8px)",
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
