import React from "react";
import {
  Wallet,
  Eye,
  ShoppingBag,
  IndianRupee,
  DollarSign,
  Users,
  MousePointer2,
  BarChart3,
  Tag,
  Target,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Megaphone,
  Layers,
  PieChart,
} from "lucide-react";
import { formatCurrency } from "../../utils/formatCurrency.js";
import { formatNumber } from "../../utils/formatNumber.js";
import { formatPercentage } from "../../utils/formatPercentage.js";

/**
 * Format raw date string ("2026-08-11") into short date ("Aug 11").
 */
const formatShortDate = (rawDateStr) => {
  if (!rawDateStr) return "";
  try {
    const parts = String(rawDateStr).trim().split("-");
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(Date.UTC(year, month, day));
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
    }
    const d = new Date(rawDateStr);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    }
    return rawDateStr;
  } catch {
    return rawDateStr;
  }
};

/**
 * Format raw date string ("2026-08-11") into full date ("Aug 11, 2026").
 */
const formatFullDate = (rawDateStr) => {
  if (!rawDateStr) return "";
  try {
    const parts = String(rawDateStr).trim().split("-");
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(Date.UTC(year, month, day));
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
    }
    const d = new Date(rawDateStr);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    }
    return rawDateStr;
  } catch {
    return rawDateStr;
  }
};

/**
 * Mini Sparkline SVG renderer.
 */
const MiniSparkline = ({ data = [], color = "#0A84FF", width = 64, height = 24 }) => {
  if (!data || data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data
    .map((val, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((val - min) / range) * (height - 4) - 2;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg width={width} height={height} style={{ overflow: "visible" }}>
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
};

/**
 * Individual Dashboard Widget Component.
 * Renders KPI cards, Charts, Tables, and Breakdowns according to widget configuration.
 */
export const DashboardWidget = ({
  widget,
  totals,
  overallCostPerResult,
  overallPurchaseRoas,
  avgCtr,
  avgCpc,
  sparklines,
  trendChanges,
  trendPoints,
  maxTrendVal,
  trendMetric,
  setTrendMetric,
  hoveredPointIndex,
  setHoveredPointIndex,
  visibleLabelIndices,
  topCampaigns,
  topAdsets,
  placementsBreakdown,
  placementColors,
  navigate,
}) => {
  const IconComp = widget.icon;

  // 1. METRIC TYPE WIDGETS
  if (widget.type === "metric") {
    let rawVal = null;
    let formattedVal = "—";
    let changeVal = null;
    let sparklineData = [];
    let sparklineColor = "#0A84FF";

    switch (widget.id) {
      case "amount-spent":
        rawVal = totals.spend;
        formattedVal = formatCurrency(totals.spend, totals.currency);
        changeVal = trendChanges.spend;
        sparklineData = sparklines.spends;
        sparklineColor = "#0A84FF";
        break;
      case "impressions":
        rawVal = totals.impressions;
        formattedVal = formatNumber(totals.impressions);
        changeVal = trendChanges.impressions;
        sparklineData = sparklines.imps;
        sparklineColor = "#6366F1";
        break;
      case "purchases":
        rawVal = totals.purchases;
        formattedVal = formatNumber(totals.purchases);
        changeVal = trendChanges.purchases;
        sparklineData = sparklines.purchs;
        sparklineColor = "#16A34A";
        break;
      case "purchase-value":
        rawVal = totals.purchaseValue;
        formattedVal = formatCurrency(totals.purchaseValue, totals.currency);
        changeVal = trendChanges.value;
        sparklineData = sparklines.vals;
        sparklineColor = "#16A34A";
        break;
      case "reach":
        rawVal = totals.reach;
        formattedVal = formatNumber(totals.reach);
        changeVal = trendChanges.reach;
        sparklineData = sparklines.reach;
        sparklineColor = "#0A84FF";
        break;
      case "clicks":
        rawVal = totals.clicks;
        formattedVal = formatNumber(totals.clicks);
        changeVal = trendChanges.clicks;
        sparklineData = sparklines.clicks;
        sparklineColor = "#EC4899";
        break;
      case "ctr":
        rawVal = avgCtr;
        formattedVal = formatPercentage(avgCtr);
        sparklineColor = "#0A84FF";
        break;
      case "cpc":
        rawVal = avgCpc;
        formattedVal = formatCurrency(avgCpc, totals.currency);
        sparklineColor = "#8B5CF6";
        break;
      case "cost-per-purchase":
        rawVal = overallCostPerResult;
        formattedVal = overallCostPerResult !== null ? formatCurrency(overallCostPerResult, totals.currency) : "—";
        sparklineColor = "#0A84FF";
        break;
      case "purchase-roas":
        rawVal = overallPurchaseRoas;
        formattedVal = overallPurchaseRoas !== null ? `${overallPurchaseRoas.toFixed(2)}x` : "—";
        sparklineColor = "#16A34A";
        break;
      case "add-to-cart":
        rawVal = totals.addToCart;
        formattedVal = totals.addToCart !== null && totals.addToCart !== undefined ? formatNumber(totals.addToCart) : "—";
        sparklineColor = "#16A34A";
        break;
      case "checkout-initiated":
        rawVal = totals.checkoutInitiated;
        formattedVal = totals.checkoutInitiated !== null && totals.checkoutInitiated !== undefined ? formatNumber(totals.checkoutInitiated) : "—";
        sparklineColor = "#6366F1";
        break;
      case "unique-outbound-ctr":
        rawVal = totals.uniqueOutboundCtr;
        formattedVal = totals.uniqueOutboundCtr !== null && totals.uniqueOutboundCtr !== undefined ? formatPercentage(totals.uniqueOutboundCtr) : "—";
        sparklineColor = "#0A84FF";
        break;
      case "cpm":
        rawVal = totals.cpm;
        formattedVal = totals.cpm !== null && totals.cpm !== undefined ? formatCurrency(totals.cpm, totals.currency) : "—";
        sparklineColor = "#8B5CF6";
        break;
      default:
        break;
    }

    return (
      <div
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: "12px",
          border: "1px solid #E5E7EB",
          padding: "20px",
          boxShadow: "0 1px 3px rgba(15, 23, 42, 0.03)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          gap: "14px",
          height: "100%",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "34px",
              height: "34px",
              borderRadius: "50%",
              backgroundColor: "#F8FAFC",
              border: "1px solid #F1F5F9",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#0F172A",
              flexShrink: 0,
            }}
          >
            {IconComp ? <IconComp size={18} strokeWidth={2} /> : <Wallet size={18} />}
          </div>
          <span style={{ fontSize: "13px", fontWeight: "600", color: "#64748B" }}>
            {widget.title}
          </span>
        </div>

        <div>
          <div style={{ fontSize: "28px", fontWeight: "700", color: "#0F172A", letterSpacing: "-0.5px", lineHeight: 1.1 }}>
            {formattedVal}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
          {changeVal !== null && changeVal !== undefined ? (
            <span
              style={{
                fontSize: "12px",
                fontWeight: "600",
                color: changeVal >= 0 ? "#16A34A" : "#DC2626",
                display: "inline-flex",
                alignItems: "center",
                gap: "3px",
              }}
            >
              {changeVal >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
              {Math.abs(changeVal)}% vs prev period
            </span>
          ) : (
            <span style={{ fontSize: "12px", color: "#94A3B8" }}>—</span>
          )}
          <MiniSparkline data={sparklineData} color={sparklineColor} />
        </div>
      </div>
    );
  }

  // 2. PERFORMANCE TREND CHART WIDGET
  if (widget.id === "performance-trend") {
    return (
      <div
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: "12px",
          border: "1px solid #E5E7EB",
          padding: "24px",
          display: "flex",
          flexDirection: "column",
          gap: "20px",
          boxShadow: "0 1px 3px rgba(15, 23, 42, 0.03)",
          overflow: "hidden",
        }}
      >
        {/* Header & Segmented Selector */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "14px" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "700", color: "#0F172A", letterSpacing: "-0.3px" }}>
              Performance Trend
            </h3>
            <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "#64748B" }}>
              Daily performance across selected date range
            </p>
          </div>

          <div style={{ display: "flex", backgroundColor: "#F1F5F9", borderRadius: "8px", padding: "3px", border: "1px solid #E5E7EB", gap: "2px" }}>
            {[
              { id: "spend", label: "Spend" },
              { id: "value", label: "Purchase Value" },
              { id: "purchases", label: "Purchases" },
            ].map((m) => {
              const active = trendMetric === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setTrendMetric(m.id)}
                  style={{
                    padding: "5px 12px",
                    border: "none",
                    borderRadius: "6px",
                    backgroundColor: active ? "#FFFFFF" : "transparent",
                    color: active ? "#0A84FF" : "#64748B",
                    fontWeight: active ? "600" : "500",
                    fontSize: "13px",
                    cursor: "pointer",
                    boxShadow: active ? "0 1px 2px rgba(15, 23, 42, 0.05)" : "none",
                    transition: "all 0.15s ease",
                    outline: "none",
                  }}
                >
                  {m.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* SVG Canvas */}
        {trendPoints.length === 0 ? (
          <div style={{ padding: "40px 0", textAlign: "center", color: "#94A3B8", fontSize: "14px" }}>
            No trend data points available.
          </div>
        ) : (
          <div style={{ width: "100%" }}>
            <div style={{ position: "relative", width: "100%", height: "200px" }}>
              <svg width="100%" height="100%" viewBox="0 0 800 160" preserveAspectRatio="none" style={{ overflow: "visible" }}>
                <defs>
                  <linearGradient id="widgetTrendGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0A84FF" stopOpacity="0.08" />
                    <stop offset="100%" stopColor="#0A84FF" stopOpacity="0.00" />
                  </linearGradient>
                </defs>

                <line x1="0" y1="20" x2="800" y2="20" stroke="#F1F5F9" strokeDasharray="4 4" />
                <line x1="0" y1="65" x2="800" y2="65" stroke="#F1F5F9" strokeDasharray="4 4" />
                <line x1="0" y1="110" x2="800" y2="110" stroke="#F1F5F9" strokeDasharray="4 4" />
                <line x1="0" y1="155" x2="800" y2="155" stroke="#F1F5F9" strokeDasharray="4 4" />

                {(() => {
                  const width = 800;
                  const height = 155;
                  const topPadding = 20;
                  const count = trendPoints.length;

                  const coords = trendPoints.map((pt, idx) => {
                    const x = count === 1 ? width / 2 : (idx / (count - 1)) * width;
                    const y = height - (pt.value / maxTrendVal) * (height - topPadding) + topPadding;
                    return { x, y, pt };
                  });

                  const lineString = coords.map((c, i) => `${i === 0 ? "M" : "L"} ${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(" ");
                  const areaString = `${lineString} L ${coords[coords.length - 1].x.toFixed(1)},${height} L ${coords[0].x.toFixed(1)},${height} Z`;

                  return (
                    <g>
                      <path d={areaString} fill="url(#widgetTrendGrad)" />
                      <path d={lineString} fill="none" stroke="#0A84FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

                      {coords.map((c, idx) => (
                        <g key={idx} onMouseEnter={() => setHoveredPointIndex(idx)} onMouseLeave={() => setHoveredPointIndex(null)}>
                          <circle
                            cx={c.x}
                            cy={c.y}
                            r={hoveredPointIndex === idx ? "5.5" : "3.5"}
                            fill="#FFFFFF"
                            stroke="#0A84FF"
                            strokeWidth={hoveredPointIndex === idx ? "2.5" : "2"}
                            style={{ cursor: "pointer", transition: "r 0.15s ease" }}
                          />
                        </g>
                      ))}
                    </g>
                  );
                })()}
              </svg>

              {hoveredPointIndex !== null && trendPoints[hoveredPointIndex] && (
                <div
                  style={{
                    position: "absolute",
                    top: "-48px",
                    left: `${Math.min(88, Math.max(12, (hoveredPointIndex / (trendPoints.length - 1 || 1)) * 100))}%`,
                    transform: "translateX(-50%)",
                    backgroundColor: "#FFFFFF",
                    border: "1px solid #E5E7EB",
                    borderRadius: "8px",
                    padding: "8px 12px",
                    boxShadow: "0 4px 12px rgba(15, 23, 42, 0.08)",
                    pointerEvents: "none",
                    zIndex: 10,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                    gap: "3px",
                    whiteSpace: "nowrap",
                  }}
                >
                  <span style={{ fontSize: "11px", color: "#64748B", fontWeight: "600" }}>
                    {formatFullDate(trendPoints[hoveredPointIndex].date)}
                  </span>
                  <div style={{ display: "flex", gap: "12px", fontSize: "12px" }}>
                    <span style={{ color: "#64748B" }}>
                      Spend: <strong style={{ color: "#0F172A" }}>{formatCurrency(trendPoints[hoveredPointIndex].row.spend, totals.currency)}</strong>
                    </span>
                    <span style={{ color: "#64748B" }}>
                      Purchases: <strong style={{ color: "#0F172A" }}>{formatNumber(trendPoints[hoveredPointIndex].row.purchases ?? trendPoints[hoveredPointIndex].row.actions_omni_purchase ?? 0)}</strong>
                    </span>
                    <span style={{ color: "#64748B" }}>
                      Value: <strong style={{ color: "#16A34A" }}>{formatCurrency(trendPoints[hoveredPointIndex].row.purchase_conversion_value ?? trendPoints[hoveredPointIndex].row.action_values_omni_purchase ?? 0, totals.currency)}</strong>
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* X-Axis Date Labels (Strictly INSIDE card) */}
            <div
              style={{
                position: "relative",
                width: "100%",
                height: "18px",
                marginTop: "16px",
                fontSize: "12px",
                color: "#64748B",
              }}
            >
              {visibleLabelIndices.map((idx) => {
                const p = trendPoints[idx];
                if (!p) return null;
                const pct = trendPoints.length > 1 ? (idx / (trendPoints.length - 1)) * 100 : 50;

                let transform = "translateX(-50%)";
                if (pct === 0) transform = "translateX(0%)";
                else if (pct === 100) transform = "translateX(-100%)";

                const isHovered = hoveredPointIndex === idx;

                return (
                  <span
                    key={idx}
                    style={{
                      position: "absolute",
                      left: `${pct}%`,
                      transform,
                      whiteSpace: "nowrap",
                      fontSize: "12px",
                      fontWeight: isHovered ? "700" : "500",
                      color: isHovered ? "#0A84FF" : "#64748B",
                      lineHeight: 1,
                      userSelect: "none",
                      transition: "color 0.15s ease",
                    }}
                  >
                    {formatShortDate(p.date)}
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  // 3. TOP CAMPAIGNS WIDGET
  if (widget.id === "top-campaigns") {
    return (
      <div
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: "12px",
          border: "1px solid #E5E7EB",
          padding: "20px",
          boxShadow: "0 1px 3px rgba(15, 23, 42, 0.03)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          gap: "16px",
          height: "100%",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Megaphone size={16} color="#0A84FF" />
              <h4 style={{ margin: 0, fontSize: "15px", fontWeight: "650", color: "#0F172A" }}>
                Top Campaigns
              </h4>
            </div>
            <button
              type="button"
              onClick={() => navigate("/meta/campaigns")}
              style={{
                background: "none",
                border: "none",
                color: "#0A84FF",
                fontSize: "13px",
                fontWeight: "600",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                padding: 0,
              }}
            >
              View all <ArrowRight size={13} />
            </button>
          </div>

          {topCampaigns.length === 0 ? (
            <div style={{ padding: "20px 0", fontSize: "13px", color: "#94A3B8", textAlign: "center" }}>
              No campaigns data available.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {topCampaigns.map((camp, idx) => {
                const name = camp.campaign || camp.campaign_name || "Unnamed Campaign";
                const spend = Number(camp.spend || 0);
                const purchases = Number(camp.purchases ?? camp.actions_omni_purchase ?? 0);

                return (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "8px 10px",
                      borderRadius: "6px",
                      backgroundColor: "#F8FAFC",
                      fontSize: "13px",
                      gap: "12px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", overflow: "hidden" }}>
                      <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#16A34A", flexShrink: 0 }} />
                      <span
                        title={name}
                        style={{
                          fontWeight: "600",
                          color: "#0F172A",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {name}
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", flexShrink: 0 }}>
                      <span style={{ fontWeight: "600", color: "#0F172A" }}>
                        {formatCurrency(spend, totals.currency)}
                      </span>
                      <span style={{ fontSize: "12px", color: "#64748B", minWidth: "24px", textAlign: "right" }}>
                        {formatNumber(purchases)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // 4. TOP AD SETS WIDGET
  if (widget.id === "top-adsets") {
    return (
      <div
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: "12px",
          border: "1px solid #E5E7EB",
          padding: "20px",
          boxShadow: "0 1px 3px rgba(15, 23, 42, 0.03)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          gap: "16px",
          height: "100%",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Layers size={16} color="#0A84FF" />
              <h4 style={{ margin: 0, fontSize: "15px", fontWeight: "650", color: "#0F172A" }}>
                Top Ad Sets
              </h4>
            </div>
            <button
              type="button"
              onClick={() => navigate("/meta/adsets")}
              style={{
                background: "none",
                border: "none",
                color: "#0A84FF",
                fontSize: "13px",
                fontWeight: "600",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                padding: 0,
              }}
            >
              View all <ArrowRight size={13} />
            </button>
          </div>

          {topAdsets.length === 0 ? (
            <div style={{ padding: "20px 0", fontSize: "13px", color: "#94A3B8", textAlign: "center" }}>
              No ad sets data available.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {topAdsets.map((adset, idx) => {
                const name = adset.adset_name || adset.adset || "Unnamed Ad Set";
                const spend = Number(adset.spend || 0);
                const purchases = Number(adset.purchases ?? adset.actions_omni_purchase ?? 0);

                return (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "8px 10px",
                      borderRadius: "6px",
                      backgroundColor: "#F8FAFC",
                      fontSize: "13px",
                      gap: "12px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", overflow: "hidden" }}>
                      <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#0A84FF", flexShrink: 0 }} />
                      <span
                        title={name}
                        style={{
                          fontWeight: "600",
                          color: "#0F172A",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {name}
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", flexShrink: 0 }}>
                      <span style={{ fontWeight: "600", color: "#0F172A" }}>
                        {formatCurrency(spend, totals.currency)}
                      </span>
                      <span style={{ fontSize: "12px", color: "#64748B", minWidth: "24px", textAlign: "right" }}>
                        {formatNumber(purchases)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // 5. PLACEMENTS BREAKDOWN WIDGET
  if (widget.id === "placements-breakdown") {
    return (
      <div
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: "12px",
          border: "1px solid #E5E7EB",
          padding: "20px",
          boxShadow: "0 1px 3px rgba(15, 23, 42, 0.03)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          gap: "16px",
          height: "100%",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
            <PieChart size={16} color="#0A84FF" />
            <h4 style={{ margin: 0, fontSize: "15px", fontWeight: "650", color: "#0F172A" }}>
              Placements Breakdown
            </h4>
          </div>

          {placementsBreakdown.length === 0 ? (
            <div style={{ padding: "20px 0", fontSize: "13px", color: "#94A3B8", textAlign: "center" }}>
              No placements breakdown data available.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {/* SVG Donut Chart */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="110" height="110" viewBox="0 0 100 100">
                  {(() => {
                    let cumulativeAngle = 0;
                    return placementsBreakdown.map((item, idx) => {
                      const color = placementColors[idx % placementColors.length];
                      const sliceAngle = (item.pct / 100) * 360;
                      const startAngle = cumulativeAngle;
                      const endAngle = cumulativeAngle + sliceAngle;
                      cumulativeAngle += sliceAngle;

                      const x1 = 50 + 40 * Math.cos((Math.PI * (startAngle - 90)) / 180);
                      const y1 = 50 + 40 * Math.sin((Math.PI * (startAngle - 90)) / 180);
                      const x2 = 50 + 40 * Math.cos((Math.PI * (endAngle - 90)) / 180);
                      const y2 = 50 + 40 * Math.sin((Math.PI * (endAngle - 90)) / 180);

                      const largeArcFlag = sliceAngle > 180 ? 1 : 0;
                      const pathData = `M 50 50 L ${x1.toFixed(2)} ${y1.toFixed(2)} A 40 40 0 ${largeArcFlag} 1 ${x2.toFixed(2)} ${y2.toFixed(2)} Z`;

                      return <path key={idx} d={pathData} fill={color} stroke="#FFFFFF" strokeWidth="2" />;
                    });
                  })()}
                  <circle cx="50" cy="50" r="24" fill="#FFFFFF" />
                </svg>
              </div>

              {/* Legend */}
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {placementsBreakdown.map((item, idx) => {
                  const color = placementColors[idx % placementColors.length];
                  return (
                    <div key={idx} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "12px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: color, flexShrink: 0 }} />
                        <span style={{ fontWeight: "500", color: "#0F172A" }}>{item.name}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ color: "#64748B" }}>{item.pct.toFixed(1)}%</span>
                        <span style={{ fontWeight: "600", color: "#0F172A" }}>{formatCurrency(item.spend, totals.currency)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
};

export default DashboardWidget;
