import React from "react";

/**
 * Generic Spinner UI Primitive.
 * Reusable loading indicator.
 */
export const Spinner = ({ size = "md", color = "#6366f1" }) => {
  const dim = size === "sm" ? "16px" : size === "lg" ? "36px" : "24px";

  return (
    <div
      style={{
        width: dim,
        height: dim,
        borderRadius: "50%",
        border: `3px solid rgba(255, 255, 255, 0.1)`,
        borderTopColor: color,
        animation: "spin 0.8s linear infinite",
        display: "inline-block",
      }}
    />
  );
};

export default Spinner;
