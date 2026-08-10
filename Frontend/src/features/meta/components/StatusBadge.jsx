import React from "react";

/**
 * Normalizes raw Meta status strings (case, spaces, underscores).
 */
export const getNormalizedStatus = (rawStatus) => {
  if (!rawStatus) return "UNKNOWN";
  const s = String(rawStatus).trim().toUpperCase().replace(/\s+/g, "_");
  if (s === "ACTIVE" || s === "ENABLED" || s === "CONNECTED") return "ACTIVE";
  if (s === "PAUSED" || s === "DISABLED") return "PAUSED";
  if (s === "ADSET_PAUSED" || s === "AD_SET_PAUSED") return "ADSET_PAUSED";
  if (s === "CAMPAIGN_PAUSED") return "CAMPAIGN_PAUSED";
  if (s.includes("REAUTH") || s.includes("EXPIRED") || s.includes("ERROR")) return "ERROR";
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
    case "ERROR":
      return "Action Required";
    default:
      return normalizedStatus;
  }
};

export const getStatusConfig = (normalizedStatus) => {
  switch (normalizedStatus) {
    case "ACTIVE":
      return { bg: "rgba(22, 163, 74, 0.08)", text: "#16A34A", dot: "#16A34A" };
    case "PAUSED":
    case "ADSET_PAUSED":
      return { bg: "rgba(245, 158, 11, 0.08)", text: "#D97706", dot: "#F59E0B" };
    case "CAMPAIGN_PAUSED":
    case "ERROR":
      return { bg: "rgba(220, 38, 38, 0.08)", text: "#DC2626", dot: "#DC2626" };
    default:
      return { bg: "#F1F5F9", text: "#64748B", dot: "#94A3B8" };
  }
};

/**
 * Reusable StatusBadge component for Meta entities.
 * Displays a subtle tinted background badge with a 6px status dot indicator.
 */
export const StatusBadge = ({ status }) => {
  const normalized = getNormalizedStatus(status);
  const label = getStatusLabel(normalized);
  const config = getStatusConfig(normalized);

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: "3px 9px",
        borderRadius: "999px",
        fontSize: "0.75rem",
        fontWeight: "600",
        whiteSpace: "nowrap",
        backgroundColor: config.bg,
        color: config.text,
      }}
    >
      <span
        style={{
          width: "6px",
          height: "6px",
          borderRadius: "50%",
          backgroundColor: config.dot,
        }}
      />
      {label}
    </span>
  );
};

export default StatusBadge;
