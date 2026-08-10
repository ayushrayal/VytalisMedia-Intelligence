import React from "react";

/**
 * Normalizes raw Meta status strings (case, spaces, underscores).
 */
export const getNormalizedStatus = (rawStatus) => {
  if (!rawStatus) return "UNKNOWN";
  const s = String(rawStatus).trim().toUpperCase().replace(/\s+/g, "_");
  if (s === "ACTIVE" || s === "ENABLED") return "ACTIVE";
  if (s === "PAUSED" || s === "DISABLED") return "PAUSED";
  if (s === "ADSET_PAUSED" || s === "AD_SET_PAUSED") return "ADSET_PAUSED";
  if (s === "CAMPAIGN_PAUSED") return "CAMPAIGN_PAUSED";
  if (s.includes("PAUSED")) return "PAUSED";
  return s;
};

export const getStatusLabel = (normalizedStatus) => {
  switch (normalizedStatus) {
    case "ACTIVE":
      return "Active";
    case "PAUSED":
      return "Paused";
    case "ADSET_PAUSED":
      return "Ad Set Paused";
    case "CAMPAIGN_PAUSED":
      return "Campaign Paused";
    default:
      return normalizedStatus;
  }
};

export const getStatusStyles = (normalizedStatus) => {
  switch (normalizedStatus) {
    case "ACTIVE":
      return { backgroundColor: "#DCFCE7", color: "#16A34A" };
    case "PAUSED":
    case "ADSET_PAUSED":
      return { backgroundColor: "#FEF3C7", color: "#F59E0B" };
    case "CAMPAIGN_PAUSED":
      return { backgroundColor: "#FEE2E2", color: "#E5484D" };
    default:
      return { backgroundColor: "#F1F5F9", color: "#64748B" };
  }
};

/**
 * Reusable StatusBadge component for Meta entities.
 * Semantic status colors:
 * ACTIVE: #DCFCE7 bg, #16A34A text
 * PAUSED / ADSET_PAUSED: #FEF3C7 bg, #F59E0B text
 * CAMPAIGN_PAUSED: #FEE2E2 bg, #E5484D text
 * Unknown: #F1F5F9 bg, #64748B text
 */
export const StatusBadge = ({ status }) => {
  const normalized = getNormalizedStatus(status);
  const label = getStatusLabel(normalized);
  const styles = getStatusStyles(normalized);

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "5px 10px",
        borderRadius: "999px",
        fontSize: "12px",
        fontWeight: "600",
        whiteSpace: "nowrap",
        ...styles,
      }}
    >
      {label}
    </span>
  );
};

export default StatusBadge;
