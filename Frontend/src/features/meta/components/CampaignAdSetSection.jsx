import React from "react";
import StatusBadge from "./StatusBadge.jsx";

export const CampaignAdSetSection = ({ creative }) => {
  const rawStatus =
    creative.effective_status || creative.ad_status || creative.status || "ACTIVE";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <h4 style={{ margin: 0, fontSize: "0.95rem", fontWeight: "700", color: "var(--color-text-primary, #111827)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
        Campaign & Ad Set Information
      </h4>

      <div
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: "12px",
          border: "1px solid var(--color-border, #E8EAED)",
          padding: "20px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          fontSize: "0.875rem",
        }}
      >
        {creative.campaign && (
          <div>
            <span style={{ color: "#64748B", fontSize: "0.78rem", display: "block", marginBottom: "2px" }}>Campaign</span>
            <strong style={{ color: "#111827", fontSize: "1rem", wordBreak: "break-word" }}>{creative.campaign}</strong>
          </div>
        )}

        {creative.campaign_id && (
          <div>
            <span style={{ color: "#64748B", fontSize: "0.78rem", display: "block", marginBottom: "2px" }}>Campaign ID</span>
            <code style={{ fontSize: "0.85rem", color: "#0A84FF", wordBreak: "break-all", fontWeight: "600" }}>{creative.campaign_id}</code>
          </div>
        )}

        {creative.adset_name && (
          <div style={{ paddingTop: "12px", borderTop: "1px solid #E8EAED" }}>
            <span style={{ color: "#64748B", fontSize: "0.78rem", display: "block", marginBottom: "2px" }}>Ad Set</span>
            <strong style={{ color: "#111827", fontSize: "1rem", wordBreak: "break-word" }}>{creative.adset_name}</strong>
          </div>
        )}

        {creative.adset_id && (
          <div>
            <span style={{ color: "#64748B", fontSize: "0.78rem", display: "block", marginBottom: "2px" }}>Ad Set ID</span>
            <code style={{ fontSize: "0.85rem", color: "#0A84FF", wordBreak: "break-all", fontWeight: "600" }}>{creative.adset_id}</code>
          </div>
        )}

        {(creative.ad_name || creative.creative_name) && (
          <div style={{ paddingTop: "12px", borderTop: "1px solid #E8EAED" }}>
            <span style={{ color: "#64748B", fontSize: "0.78rem", display: "block", marginBottom: "2px" }}>Ad Name</span>
            <strong style={{ color: "#111827", fontSize: "1rem", wordBreak: "break-word" }}>
              {creative.ad_name || creative.creative_name}
            </strong>
          </div>
        )}

        {creative.ad_id && (
          <div>
            <span style={{ color: "#64748B", fontSize: "0.78rem", display: "block", marginBottom: "2px" }}>Ad ID</span>
            <code style={{ fontSize: "0.85rem", color: "#0A84FF", wordBreak: "break-all", fontWeight: "600" }}>{creative.ad_id}</code>
          </div>
        )}

        <div style={{ paddingTop: "12px", borderTop: "1px solid #E8EAED" }}>
          <span style={{ color: "#64748B", fontSize: "0.78rem", display: "block", marginBottom: "6px" }}>Effective Status</span>
          <StatusBadge status={rawStatus} />
        </div>
      </div>
    </div>
  );
};

export default CampaignAdSetSection;
