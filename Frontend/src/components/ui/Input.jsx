import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

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
  const [showPassword, setShowPassword] = useState(false);
  const [iconHovered, setIconHovered] = useState(false);

  const isPasswordInput = type === "password";
  const currentInputType = isPasswordInput ? (showPassword ? "text" : "password") : type;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px", width: "100%" }}>
      {label && (
        <label style={{ fontSize: "0.875rem", fontWeight: "600", color: "var(--color-text-secondary, #64748B)" }}>
          {label} {required && <span style={{ color: "var(--color-error, #E5484D)" }}>*</span>}
        </label>
      )}
      <div style={{ position: "relative", width: "100%", display: "flex", alignItems: "center" }}>
        <input
          type={currentInputType}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            width: "100%",
            height: "44px",
            paddingLeft: "14px",
            paddingRight: isPasswordInput ? "44px" : "14px",
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

        {isPasswordInput && (
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            title={showPassword ? "Hide password" : "Show password"}
            onMouseEnter={() => setIconHovered(true)}
            onMouseLeave={() => setIconHovered(false)}
            style={{
              position: "absolute",
              right: "14px",
              top: "50%",
              transform: "translateY(-50%)",
              background: "none",
              border: "none",
              padding: "4px",
              margin: 0,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: iconHovered ? "#0A84FF" : "#64748B",
              borderRadius: "4px",
              transition: "color 0.15s ease",
              outline: "none",
            }}
          >
            {showPassword ? (
              <EyeOff size={18} strokeWidth={2} />
            ) : (
              <Eye size={18} strokeWidth={2} />
            )}
          </button>
        )}
      </div>
      {error && <span style={{ fontSize: "0.8rem", color: "var(--color-error, #E5484D)" }}>{error}</span>}
    </div>
  );
};

export default Input;

