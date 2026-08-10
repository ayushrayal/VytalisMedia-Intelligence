import React, { useState, useRef, useEffect } from "react";

/**
 * Generic Dropdown UI Primitive.
 * Modern SaaS Popover: #FFFFFF background, #E8EAED border, 12px radius, subtle shadow.
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
            backgroundColor: "#FFFFFF",
            border: "1px solid var(--color-border, #E8EAED)",
            borderRadius: "12px",
            boxShadow: "0 8px 16px -4px rgba(15, 23, 42, 0.08)",
            zIndex: 100,
            minWidth: "190px",
            overflow: "hidden",
            padding: "4px 0",
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
