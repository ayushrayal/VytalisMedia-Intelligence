import React from "react";
import { UserCheck, UserPlus, TrendingUp, DollarSign, Trophy } from "lucide-react";
import { formatCurrency } from "../../../utils/formatCurrency.js";

/**
 * AudienceKpiCards Component.
 * Dedicated Audience Insight Cards:
 * 1. Total Spend on Male
 * 2. Total Spend on Female
 * 3. Revenue Generated from Male
 * 4. Revenue Generated from Female
 * 5. Best ROAS From Audience
 * 
 * Note: These 5 specialized insight cards are permanent Audience domain metrics
 * and remain independent from generic Customize Fields metric toggles.
 */
export const AudienceKpiCards = ({
  maleSpend = 0,
  femaleSpend = 0,
  maleRevenue = 0,
  femaleRevenue = 0,
  bestRoasSegment = null,
  currency = "INR",
}) => {
  const cards = [
    {
      title: "Total Spend on Male",
      value: formatCurrency(maleSpend, currency),
      subtitle: "Ad spend targeted at male audience",
      accentColor: "#0A84FF",
      icon: UserCheck,
    },
    {
      title: "Total Spend on Female",
      value: formatCurrency(femaleSpend, currency),
      subtitle: "Ad spend targeted at female audience",
      accentColor: "#EC4899",
      icon: UserPlus,
    },
    {
      title: "Revenue Generated from Male",
      value: formatCurrency(maleRevenue, currency),
      subtitle: "Purchase conversion value from males",
      accentColor: "#10B981",
      icon: DollarSign,
    },
    {
      title: "Revenue Generated from Female",
      value: formatCurrency(femaleRevenue, currency),
      subtitle: "Purchase conversion value from females",
      accentColor: "#8B5CF6",
      icon: TrendingUp,
    },
    {
      title: "Best ROAS From Audience",
      value: bestRoasSegment ? `${bestRoasSegment.roas.toFixed(2)}x` : "—",
      subtitle: bestRoasSegment ? `${bestRoasSegment.age} · ${bestRoasSegment.gender}` : "No valid ROAS segment",
      accentColor: "#F59E0B",
      icon: Trophy,
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
              <div
                style={{
                  fontSize: "1.45rem",
                  fontWeight: "700",
                  color: "var(--color-text-primary, #0F172A)",
                  letterSpacing: "-0.3px",
                }}
              >
                {card.value}
              </div>
              <div style={{ fontSize: "0.78rem", color: "var(--color-text-muted, #94A3B8)", marginTop: "4px", textTransform: card.title === "Best ROAS From Audience" ? "capitalize" : "none" }}>
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
