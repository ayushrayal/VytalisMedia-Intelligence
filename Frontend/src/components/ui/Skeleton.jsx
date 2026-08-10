import React from "react";

/**
 * Generic Skeleton UI Primitive.
 * Subtle #F7F9FC / #E8EAED loading placeholder.
 */
export const Skeleton = ({ width = "100%", height = "20px", borderRadius = "10px", style = {} }) => {
  return (
    <div
      style={{
        width,
        height,
        borderRadius,
        backgroundColor: "var(--color-border, #E8EAED)",
        opacity: 0.6,
        animation: "pulse 1.5s infinite ease-in-out",
        ...style,
      }}
    />
  );
};

export default Skeleton;
