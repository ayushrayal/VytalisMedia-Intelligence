import React from "react";
import { Users, Wallet, UserCheck, UserPlus, Sparkles } from "lucide-react";
import { formatCurrency } from "../../../utils/formatCurrency.js";
import { formatNumber } from "../../../utils/formatNumber.js";
import { formatPercentage } from "../../../utils/formatPercentage.js";

/**
 * AudienceKpiCards Component.
 * Displays 5 top summary KPI cards for Meta Audience Demographics:
 * 1. Total Reach
 * 2. Total Spend
 * 3. Male Audience Share
 * 4. Female Audience Share
 * 5. Top Performing Segment
 */
export const AudienceKpiCards = ({
  totalReach,
  totalSpend,
  maleReach,
  femaleReach,
  topSegment,
  currency = "INR",
}) => {
  const malePercent = totalReach > 0 ? (maleReach / totalReach) * 100 : 0;
  const femalePercent = totalReach > 0 ? (femaleReach / totalReach) * 100 : 0;

  const cards = [
    {
      title: "Total Audience Reach",
      value: formatNumber(totalReach),
      subtitle: "Unique users reached",
      accentColor: "#0A84FF",
      icon: Users,
    },
    {
      title: "Total Demographic Spend",
      value: formatCurrency(totalSpend, currency),
      subtitle: "Demographic ad spend",
      accentColor: "#16A34A",
      icon: Wallet,
    },
    {
      title: "Male Audience",
      value: formatNumber(maleReach),
      subtitle: `${malePercent.toFixed(1)}% of total reach`,
      accentColor: "#0A84FF",
      icon: UserCheck,
    },
    {
      title: "Female Audience",
      value: formatNumber(femaleReach),
      subtitle: `${femalePercent.toFixed(1)}% of total reach`,
      accentColor: "#EC4899",
      icon: UserPlus,
    },
    {
      title: "Top Segment",
      value: topSegment ? `${topSegment.age} · ${topSegment.gender}` : "—",
      subtitle: topSegment ? `Highest CTR (${formatPercentage(topSegment.ctr)})` : "No segment data",
      accentColor: "#8B5CF6",
      icon: Sparkles,
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
              <div style={{ fontSize: "1.45rem", fontWeight: "700", color: "var(--color-text-primary, #0F172A)", letterSpacing: "-0.3px", textTransform: card.title === "Top Segment" ? "capitalize" : "none" }}>
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

export default AudienceKpiCards;
