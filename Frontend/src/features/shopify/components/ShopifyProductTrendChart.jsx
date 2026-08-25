import React, { useState } from "react";
import { formatCurrencyINR } from "../../../utils/formatCurrency.js";
import { formatNumber } from "../../../utils/formatNumber.js";
import { TrendingUp, Layers } from "lucide-react";

export const ShopifyProductTrendChart = ({ timeline = [] }) => {
  const [metricMode, setMetricMode] = useState("sales"); // "sales" | "quantity"

  if (!Array.isArray(timeline) || timeline.length === 0) {
    return null;
  }

  const maxVal = Math.max(1, ...timeline.map((t) => (metricMode === "sales" ? t.sales : t.quantity)));

  return (
    <div
      style={{
        backgroundColor: "#FFFFFF",
        borderRadius: "16px",
        border: "1px solid #E2E8F0",
        padding: "20px",
        boxShadow: "0 1px 3px rgba(15,23,42,0.03)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <TrendingUp size={18} color="#0A84FF" />
          <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: "#0F172A" }}>
            Product Sales & Volume Trend
          </h3>
        </div>

        <div style={{ display: "inline-flex", backgroundColor: "#F1F5F9", borderRadius: "8px", padding: "3px", gap: "2px" }}>
          <button
            type="button"
            onClick={() => setMetricMode("sales")}
            style={{
              padding: "4px 12px",
              borderRadius: "6px",
              border: "none",
              backgroundColor: metricMode === "sales" ? "#FFFFFF" : "transparent",
              color: metricMode === "sales" ? "#0F172A" : "#64748B",
              fontSize: "12px",
              fontWeight: "600",
              cursor: "pointer",
              boxShadow: metricMode === "sales" ? "0 1px 2px rgba(15, 23, 42, 0.08)" : "none",
            }}
          >
            Sales Value (₹)
          </button>
          <button
            type="button"
            onClick={() => setMetricMode("quantity")}
            style={{
              padding: "4px 12px",
              borderRadius: "6px",
              border: "none",
              backgroundColor: metricMode === "quantity" ? "#FFFFFF" : "transparent",
              color: metricMode === "quantity" ? "#0F172A" : "#64748B",
              fontSize: "12px",
              fontWeight: "600",
              cursor: "pointer",
              boxShadow: metricMode === "quantity" ? "0 1px 2px rgba(15, 23, 42, 0.08)" : "none",
            }}
          >
            Quantity Sold
          </button>
        </div>
      </div>

      {/* Bar Chart Container */}
      <div style={{ height: "180px", display: "flex", alignItems: "flex-end", gap: "8px", paddingTop: "20px" }}>
        {timeline.map((point, idx) => {
          const val = metricMode === "sales" ? point.sales : point.quantity;
          const heightPct = Math.max(8, (val / maxVal) * 100);
          const formattedVal = metricMode === "sales" ? formatCurrencyINR(val) : formatNumber(val);

          return (
            <div
              key={idx}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                height: "100%",
                justifyContent: "flex-end",
              }}
            >
              <div
                title={`${point.date}: ${formattedVal}`}
                style={{
                  width: "100%",
                  maxWidth: "32px",
                  height: `${heightPct}%`,
                  backgroundColor: metricMode === "sales" ? "#0A84FF" : "#16A34A",
                  borderRadius: "4px 4px 0 0",
                  transition: "height 0.2s ease, backgroundColor 0.15s ease",
                  cursor: "pointer",
                }}
              />
              <span style={{ fontSize: "10px", color: "#64748B", marginTop: "6px", whiteSpace: "nowrap" }}>
                {new Date(point.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ShopifyProductTrendChart;
