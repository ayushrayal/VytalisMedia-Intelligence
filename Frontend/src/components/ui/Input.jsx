import React, { useState } from "react";

/**
 * Generic Input UI Primitive.
 * Height: 42px–46px, Radius: 10px, Focus: #0A84FF.
 */
export const Input = ({
  label,
  type = "text",
  value,
  onChange,
  placeholder = "",
  error,
  required = false,
  className = "",
  style = {},
  ...props
}) => {
  const [focused, setFocused] = useState(false);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px", width: "100%" }}>
      {label && (
        <label style={{ fontSize: "0.875rem", fontWeight: "600", color: "var(--color-text-secondary, #64748B)" }}>
          {label} {required && <span style={{ color: "var(--color-error, #E5484D)" }}>*</span>}
        </label>
      )}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: "100%",
          height: "44px",
          padding: "0 14px",
          borderRadius: "var(--radius-input, 10px)",
          backgroundColor: "#FFFFFF",
          border: error
            ? "1px solid var(--color-error, #E5484D)"
            : focused
            ? "1px solid var(--color-primary, #0A84FF)"
            : "1px solid var(--color-border, #E8EAED)",
          boxShadow: focused && !error ? "0 0 0 3px rgba(10, 132, 255, 0.15)" : "none",
          color: "var(--color-text-primary, #111827)",
          fontSize: "0.95rem",
          outline: "none",
          transition: "all 0.15s ease",
          boxSizing: "border-box",
          ...style,
        }}
        className={`vytalis-input ${className}`}
        {...props}
      />
      {error && <span style={{ fontSize: "0.8rem", color: "var(--color-error, #E5484D)" }}>{error}</span>}
    </div>
  );
};

export default Input;
