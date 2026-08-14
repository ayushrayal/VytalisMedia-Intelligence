import React from "react";
import { formatMetric, GROUP_COLORS } from "../utils/attribution.js";
import { Megaphone, Search, Layers } from "lucide-react";

const GROUP_CONFIGS = {
  meta: {
    title: "META",
    subtitle: "Meta Ads (Facebook & Instagram)",
    icon: Megaphone,
    color: GROUP_COLORS.meta,
  },
  google: {
    title: "GOOGLE",
    subtitle: "Google Ads (PMax, Search, Display)",
    icon: Search,
    color: GROUP_COLORS.google,
  },
  not_attribution: {
    title: "NOT ATTRIBUTION",
    subtitle: "Organic, CRM, AI Referral & Unattributed",
    icon: Layers,
    color: GROUP_COLORS.not_attribution,
  },
};

/**
 * Single Attribution Group Card Component.
 */

export const AttributionGroupCard = ({ groupKey, data = {}, currency = "INR" }) => {
  const config = GROUP_CONFIGS[groupKey] || {
    title: (groupKey || "").toUpperCase(),
    subtitle: "Attribution Group",
    icon: Layers,
    color: GROUP_COLORS.not_attribution,
  };

  const IconComponent = config.icon;
  const theme = config.color;

  const orders = data.orders ?? 0;
  const netRevenue = data.netRevenue ?? data.grossRevenue ?? 0;
  const orderPct = data.percentageOfOrders ?? 0;
  const revenuePct = data.percentageOfNetRevenue ?? data.percentageOfRevenue ?? 0;

  return (
    <div
      style={{
        backgroundColor: "#FFFFFF",
        borderRadius: "16px",
        border: "1px solid #E5E7EB",
        padding: "24px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        boxShadow: "0 1px 3px rgba(15, 23, 42, 0.03)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Top Accent Strip */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "4px",
          backgroundColor: theme.primary,
        }}
      />

      {/* Header Row: Title & Icon Pill */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "20px" }}>
        <div>
          <span
            style={{
              fontSize: "11px",
              fontWeight: "700",
              letterSpacing: "1px",
              color: theme.primary,
              textTransform: "uppercase",
              display: "block",
              marginBottom: "2px",
            }}
          >
            {config.title}
          </span>
          <span style={{ fontSize: "12px", color: "#64748B", fontWeight: "500" }}>
            {config.subtitle}
          </span>
        </div>

        <div
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "10px",
            backgroundColor: theme.bg,
            color: theme.primary,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <IconComponent size={18} strokeWidth={2.2} />
        </div>
      </div>

      {/* Core Metrics: Orders & Revenue */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
        <div>
          <span style={{ fontSize: "11px", color: "#94A3B8", fontWeight: "600", textTransform: "uppercase" }}>
            Orders
          </span>
          <div style={{ fontSize: "24px", fontWeight: "700", color: "#0F172A", lineHeight: 1.2, marginTop: "2px" }}>
            {formatMetric(orders, "number")}
          </div>
          <span style={{ fontSize: "12px", fontWeight: "600", color: theme.primary, marginTop: "2px", display: "block" }}>
            {formatMetric(orderPct, "percentage")} of Orders
          </span>
        </div>

        <div>
          <span style={{ fontSize: "11px", color: "#94A3B8", fontWeight: "600", textTransform: "uppercase" }}>
            Net Revenue
          </span>
          <div style={{ fontSize: "24px", fontWeight: "700", color: "#0F172A", lineHeight: 1.2, marginTop: "2px" }}>
            {formatMetric(netRevenue, "currency", currency)}
          </div>
          <span style={{ fontSize: "12px", fontWeight: "600", color: theme.primary, marginTop: "2px", display: "block" }}>
            {formatMetric(revenuePct, "percentage")} of Revenue
          </span>
        </div>
      </div>

      {/* Visual Share Bar Indicator */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#64748B", marginBottom: "6px" }}>
          <span>Share Indicator</span>
          <span>{orderPct.toFixed(1)}% Orders / {revenuePct.toFixed(1)}% Rev</span>
        </div>
        <div style={{ width: "100%", height: "6px", backgroundColor: "#F1F5F9", borderRadius: "3px", overflow: "hidden" }}>
          <div
            style={{
              width: `${Math.min(100, Math.max(0, orderPct))}%`,
              height: "100%",
              backgroundColor: theme.primary,
              borderRadius: "3px",
              transition: "width 0.4s ease",
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default AttributionGroupCard;
