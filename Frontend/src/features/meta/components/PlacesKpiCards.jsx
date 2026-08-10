import React from "react";
import { formatCurrency } from "../../../utils/formatCurrency.js";
import { formatNumber } from "../../../utils/formatNumber.js";
import { formatPercentage } from "../../../utils/formatPercentage.js";

/**
 * PlacesKpiCards Component.
 * Displays 5 top summary KPI cards for Meta Geographic Metrics:
 * 1. Total Spend
 * 2. Total Reach
 * 3. Total Impressions
 * 4. Total Clicks
 * 5. Overall Weighted CTR
 */
export const PlacesKpiCards = ({
  totalSpend = 0,
  totalReach = 0,
  totalImpressions = 0,
  totalClicks = 0,
  currency = "INR",
}) => {
  const overallCtr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;

  const cards = [
    {
      title: "Total Geographic Spend",
      value: formatCurrency(totalSpend, currency),
      subtitle: "Regional ad spend sum",
      accentColor: "#16A34A",
      icon: "💳",
    },
    {
      title: "Total Reach",
      value: formatNumber(totalReach),
      subtitle: "Unique users reached",
      accentColor: "#0A84FF",
      icon: "📍",
    },
    {
      title: "Total Impressions",
      value: formatNumber(totalImpressions),
      subtitle: "Ad impressions count",
      accentColor: "#8B5CF6",
      icon: "👁️",
    },
    {
      title: "Total Clicks",
      value: formatNumber(totalClicks),
      subtitle: "User clicks count",
      accentColor: "#EC4899",
      icon: "👆",
    },
    {
      title: "Overall CTR",
      value: formatPercentage(overallCtr),
      subtitle: "Weighted clicks / impressions",
      accentColor: "#0A84FF",
      icon: "🎯",
    },
  ];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: "16px",
      }}
    >
      {cards.map((card, idx) => (
        <div
          key={idx}
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: "var(--radius-card, 16px)",
            border: "1px solid var(--color-border, #E8EAED)",
            padding: "18px 20px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            boxShadow: "var(--shadow-subtle, 0 2px 8px rgba(15, 23, 42, 0.04))",
            transition: "transform 0.15s ease, box-shadow 0.15s ease",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
            <span style={{ fontSize: "0.82rem", fontWeight: "600", color: "var(--color-text-secondary, #64748B)" }}>
              {card.title}
            </span>
            <span style={{ fontSize: "1.2rem" }}>{card.icon}</span>
          </div>

          <div>
            <div style={{ fontSize: "1.45rem", fontWeight: "750", color: "var(--color-text-primary, #111827)", letterSpacing: "-0.3px" }}>
              {card.value}
            </div>
            <div style={{ fontSize: "0.78rem", color: "var(--color-text-muted, #94A3B8)", marginTop: "4px" }}>
              {card.subtitle}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default PlacesKpiCards;
