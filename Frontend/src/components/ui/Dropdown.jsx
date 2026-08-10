import React, { useState, useRef, useEffect } from "react";

/**
 * Generic Dropdown UI Primitive.
 * Zero business logic. Fully reusable.
 */
export const Dropdown = ({ trigger, children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
      <div onClick={() => setIsOpen(!isOpen)} style={{ cursor: "pointer" }}>
        {trigger}
      </div>
      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            right: 0,
            marginTop: "8px",
            backgroundColor: "#1e293b",
            border: "1px solid #334155",
            borderRadius: "8px",
            boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.3)",
            zIndex: 100,
            minWidth: "180px",
            overflow: "hidden",
          }}
          onClick={() => setIsOpen(false)}
        >
          {children}
        </div>
      )}
    </div>
  );
};

export default Dropdown;
