import React from "react";

export const GoogleIntegration = () => {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div>
        <h1 style={{ margin: 0, fontSize: "24px", fontWeight: "700", color: "#0F172A", letterSpacing: "-0.4px" }}>
          Google Integration
        </h1>
        <p style={{ margin: "4px 0 0 0", fontSize: "14px", color: "#64748B" }}>
          Manage your Google Ads connection and account settings.
        </p>
      </div>

      <div
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: "16px",
          border: "1px dashed #CBD5E1",
          padding: "48px 24px",
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "12px",
          maxWidth: "560px",
          margin: "20px auto 0 auto",
        }}
      >
        <div
          style={{
            width: "56px",
            height: "56px",
            borderRadius: "50%",
            backgroundColor: "rgba(10, 132, 255, 0.08)",
            color: "#0A84FF",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "24px",
            fontWeight: "700",
          }}
        >
          G
        </div>
        <h3 style={{ margin: "8px 0 0 0", fontSize: "18px", fontWeight: "700", color: "#0F172A" }}>
          Google Ads Integration
        </h3>
        <p style={{ margin: 0, fontSize: "14px", color: "#64748B", maxWidth: "380px", lineHeight: "1.5" }}>
          Google Ads integration will be available soon. Connect your Google Ads manager account to aggregate search and display performance analytics.
        </p>
        <div
          style={{
            marginTop: "12px",
            padding: "6px 14px",
            borderRadius: "20px",
            backgroundColor: "#F1F5F9",
            color: "#475569",
            fontSize: "12px",
            fontWeight: "600",
          }}
        >
          Coming Soon
        </div>
      </div>
    </div>
  );
};

export default GoogleIntegration;
