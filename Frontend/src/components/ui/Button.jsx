import React from "react";

/**
 * Generic Button UI Primitive.
 * Radius: 10px, Height: 40px–44px.
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
  const getBackgroundColor = () => {
    if (variant === "secondary") return "#FFFFFF";
    if (variant === "outline") return "transparent";
    if (variant === "danger") return "var(--color-error-light, rgba(229, 72, 77, 0.10))";
    return "var(--color-primary, #0A84FF)";
  };

  const getColor = () => {
    if (variant === "secondary") return "#334155";
    if (variant === "outline") return "var(--color-text-secondary, #64748B)";
    if (variant === "danger") return "var(--color-error, #E5484D)";
    return "#FFFFFF";
  };

  const getBorder = () => {
    if (variant === "secondary") return "1px solid var(--color-border, #E8EAED)";
    if (variant === "outline") return "1px solid var(--color-border, #E8EAED)";
    if (variant === "danger") return "1px solid rgba(229, 72, 77, 0.20)";
    return "none";
  };

  const getHeight = () => {
    if (size === "sm") return "34px";
    if (size === "lg") return "46px";
    return "42px";
  };

  const baseStyle = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "var(--radius-button, 10px)",
    height: getHeight(),
    padding: size === "sm" ? "0 14px" : size === "lg" ? "0 24px" : "0 18px",
    fontWeight: "600",
    fontSize: size === "sm" ? "0.85rem" : size === "lg" ? "1.05rem" : "0.95rem",
    cursor: disabled || isLoading ? "not-allowed" : "pointer",
    transition: "all 0.15s ease",
    outline: "none",
    opacity: disabled || isLoading ? 0.6 : 1,
    backgroundColor: getBackgroundColor(),
    color: getColor(),
    border: getBorder(),
    boxShadow: variant === "primary" ? "0 2px 4px rgba(10, 132, 255, 0.15)" : "none",
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
          <span style={{ animation: "spin 1s linear infinite" }}>⌛</span> Loading...
        </span>
      ) : (
        children
      )}
    </button>
  );
};

export default Button;
