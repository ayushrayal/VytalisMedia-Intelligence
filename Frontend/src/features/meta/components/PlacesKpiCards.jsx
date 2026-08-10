import React from "react";
import { Wallet, MapPin, Eye, MousePointer2, Target } from "lucide-react";
import { formatCurrency } from "../../../utils/formatCurrency.js";
import { formatNumber } from "../../../utils/formatNumber.js";
import { formatPercentage } from "../../../utils/formatPercentage.js";

/**
 * PlacesKpiCards Component.
 * Displays 5 top summary KPI cards for Meta Geographic Metrics with Lucide icons:
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
      icon: Wallet,
    },
    {
      title: "Total Reach",
      value: formatNumber(totalReach),
      subtitle: "Unique users reached",
      accentColor: "#0A84FF",
      icon: MapPin,
    },
    {
      title: "Total Impressions",
      value: formatNumber(totalImpressions),
      subtitle: "Ad impressions count",
      accentColor: "#8B5CF6",
      icon: Eye,
    },
    {
      title: "Total Clicks",
      value: formatNumber(totalClicks),
      subtitle: "User clicks count",
      accentColor: "#EC4899",
      icon: MousePointer2,
    },
    {
      title: "Overall CTR",
      value: formatPercentage(overallCtr),
      subtitle: "Weighted clicks / impressions",
      accentColor: "#0A84FF",
      icon: Target,
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
      {cards.map((card, idx) => {
        const IconComponent = card.icon;
        return (
          <div
            key={idx}
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "var(--radius-card, 12px)",
              border: "1px solid var(--color-border, #E5E7EB)",
              padding: "18px 20px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              boxShadow: "var(--shadow-subtle, 0 1px 3px rgba(15, 23, 42, 0.03))",
              transition: "transform 0.15s ease, box-shadow 0.15s ease",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
              <span style={{ fontSize: "0.825rem", fontWeight: "600", color: "var(--color-text-secondary, #64748B)" }}>
                {card.title}
              </span>
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "8px",
                  backgroundColor: `${card.accentColor}12`,
                  color: card.accentColor,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <IconComponent size={18} strokeWidth={2} />
              </div>
            </div>

            <div>
              <div style={{ fontSize: "1.45rem", fontWeight: "700", color: "var(--color-text-primary, #0F172A)", letterSpacing: "-0.3px" }}>
                {card.value}
              </div>
              <div style={{ fontSize: "0.78rem", color: "var(--color-text-muted, #94A3B8)", marginTop: "4px" }}>
                {card.subtitle}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default PlacesKpiCards;
