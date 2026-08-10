import React from "react";

/**
 * Generic Input UI Primitive.
 * Zero business logic. Fully reusable.
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
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px", width: "100%" }}>
      {label && (
        <label style={{ fontSize: "0.875rem", fontWeight: "500", color: "#cbd5e1" }}>
          {label} {required && <span style={{ color: "#ef4444" }}>*</span>}
        </label>
      )}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        style={{
          width: "100%",
          padding: "10px 14px",
          borderRadius: "8px",
          backgroundColor: "#1e293b",
          border: error ? "1px solid #ef4444" : "1px solid #334155",
          color: "#f8fafc",
          fontSize: "0.95rem",
          outline: "none",
          boxSizing: "border-box",
          ...style,
        }}
        className={`vytalis-input ${className}`}
        {...props}
      />
      {error && <span style={{ fontSize: "0.8rem", color: "#f87171" }}>{error}</span>}
    </div>
  );
};

export default Input;
