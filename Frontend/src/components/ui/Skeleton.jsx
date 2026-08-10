import React from "react";

/**
 * Generic Skeleton UI Primitive.
 * Zero business logic. Fully reusable loading placeholder.
 */
export const Skeleton = ({ width = "100%", height = "20px", borderRadius = "6px", style = {} }) => {
  return (
    <div
      style={{
        width,
        height,
        borderRadius,
        backgroundColor: "#334155",
        opacity: 0.6,
        animation: "pulse 1.5s infinite ease-in-out",
        ...style,
      }}
    />
  );
};

export default Skeleton;
