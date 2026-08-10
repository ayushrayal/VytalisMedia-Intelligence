import React from "react";
import AppLogo from "../components/shared/AppLogo.jsx";

/**
 * AuthLayout wrapper for Login and Signup pages.
 */
export const AuthLayout = ({ children }) => {
  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#0f172a",
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
          backgroundColor: "#1e293b",
          border: "1px solid #334155",
          borderRadius: "16px",
          padding: "36px",
          maxWidth: "420px",
          width: "100%",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default AuthLayout;
