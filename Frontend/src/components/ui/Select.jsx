import React, { useState } from "react";

/**
 * Generic Select UI Primitive.
 * Height: 42px, Radius: 10px, Focus: #0A84FF.
 */
export const Select = ({
  label,
  value,
  onChange,
  options = [],
  placeholder = "Select an option",
  error,
  className = "",
  style = {},
  ...props
}) => {
  const [focused, setFocused] = useState(false);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px", width: "100%" }}>
      {label && (
        <label style={{ fontSize: "0.875rem", fontWeight: "600", color: "var(--color-text-secondary, #64748B)" }}>
          {label}
        </label>
      )}
      <select
        value={value}
        onChange={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: "100%",
          height: "42px",
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
          fontSize: "0.9rem",
          fontWeight: "500",
          outline: "none",
          cursor: "pointer",
          boxSizing: "border-box",
          transition: "all 0.15s ease",
          ...style,
        }}
        className={`vytalis-select ${className}`}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <span style={{ fontSize: "0.8rem", color: "var(--color-error, #E5484D)" }}>{error}</span>}
    </div>
  );
};

export default Select;
