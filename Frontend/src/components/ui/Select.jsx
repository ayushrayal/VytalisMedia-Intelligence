import React from "react";

/**
 * Generic Select UI Primitive.
 * Zero business logic. Fully reusable.
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
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px", width: "100%" }}>
      {label && (
        <label style={{ fontSize: "0.875rem", fontWeight: "500", color: "#cbd5e1" }}>{label}</label>
      )}
      <select
        value={value}
        onChange={onChange}
        style={{
          width: "100%",
          padding: "10px 14px",
          borderRadius: "8px",
          backgroundColor: "#1e293b",
          border: error ? "1px solid #ef4444" : "1px solid #334155",
          color: "#f8fafc",
          fontSize: "0.95rem",
          outline: "none",
          cursor: "pointer",
          boxSizing: "border-box",
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
      {error && <span style={{ fontSize: "0.8rem", color: "#f87171" }}>{error}</span>}
    </div>
  );
};

export default Select;
