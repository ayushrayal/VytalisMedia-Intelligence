import React from "react";

/**
 * Generic Spinner UI Primitive.
 * Reusable light theme loading spinner.
 */
export const Spinner = ({ size = "md", color = "var(--color-primary, #0A84FF)" }) => {
  const dim = size === "sm" ? "16px" : size === "lg" ? "36px" : "24px";

  return (
    <div
      style={{
        width: dim,
        height: dim,
        borderRadius: "50%",
        border: "3px solid var(--color-border, #E8EAED)",
        borderTopColor: color,
        animation: "spin 0.8s linear infinite",
        display: "inline-block",
      }}
    />
  );
};

export default Spinner;
