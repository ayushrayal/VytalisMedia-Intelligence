import React from "react";

/**
 * Generic Button UI Primitive.
 * Zero business logic. Fully reusable.
 */
export const Button = ({
  children,
  type = "button",
  variant = "primary",
  size = "md",
  disabled = false,
  isLoading = false,
  onClick,
  className = "",
  style = {},
  ...props
}) => {
  const baseStyle = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "8px",
    fontWeight: "600",
    cursor: disabled || isLoading ? "not-allowed" : "pointer",
    transition: "all 0.2s ease",
    border: "none",
    outline: "none",
    opacity: disabled || isLoading ? 0.6 : 1,
    padding: size === "sm" ? "6px 12px" : size === "lg" ? "12px 24px" : "8px 16px",
    fontSize: size === "sm" ? "0.875rem" : size === "lg" ? "1.125rem" : "1rem",
    backgroundColor:
      variant === "secondary" ? "#334155" : variant === "outline" ? "transparent" : variant === "danger" ? "#ef4444" : "#6366f1",
    color: variant === "outline" ? "#94a3b8" : "#ffffff",
    border: variant === "outline" ? "1px solid #475569" : "none",
    ...style,
  };

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      onClick={onClick}
      style={baseStyle}
      className={`vytalis-btn ${className}`}
      {...props}
    >
      {isLoading ? (
        <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
          <span style={{ animation: "spin 1s linear infinite" }}>⏳</span> Loading...
        </span>
      ) : (
        children
      )}
    </button>
  );
};

export default Button;
