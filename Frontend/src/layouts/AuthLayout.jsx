import React from "react";
import AppLogo from "../components/shared/AppLogo.jsx";

/**
 * AuthLayout wrapper for Login and Signup pages.
 * Clean light styling: #FFFFFF background, #F7F9FC card surface, #E8EAED border.
 */
export const AuthLayout = ({ children }) => {
  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "var(--color-background, #FFFFFF)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
    >
      <div style={{ marginBottom: "32px" }}>
        <AppLogo size="lg" />
      </div>
      <div
        style={{
          backgroundColor: "var(--color-surface, #F7F9FC)",
          border: "1px solid var(--color-border, #E8EAED)",
          borderRadius: "var(--radius-card, 16px)",
          padding: "36px",
          maxWidth: "420px",
          width: "100%",
          boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01)",
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default AuthLayout;
