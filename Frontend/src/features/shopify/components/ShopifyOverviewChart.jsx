import React, { useState, useMemo } from "react";
import { formatCurrencyINR } from "../../../utils/formatCurrency.js";
import { formatNumber } from "../../../utils/formatNumber.js";
import { BarChart2, TrendingUp, ShoppingCart, Layers } from "lucide-react";

/**
 * Shopify Overview Trend Chart Component.
 * Interactive trend visualizer for Net Sales, Orders, and Quantity Sold over time.
 */
export const ShopifyOverviewChart = ({ overviewData = [] }) => {
  const [metricMode, setMetricMode] = useState("netSales"); // "netSales" | "orders" | "quantity"
  const [activeHoverIdx, setActiveHoverIdx] = useState(null);

  // Group and sort overview data by date
  const chartData = useMemo(() => {
    if (!Array.isArray(overviewData) || overviewData.length === 0) return [];

    const map = {};
    overviewData.forEach((row) => {
      const dateStr = row.order_created_at
        ? new Date(row.order_created_at).toISOString().split("T")[0]
        : "Unknown Date";

      if (!map[dateStr]) {
        map[dateStr] = {
          date: dateStr,
          netSales: 0,
          grossSales: 0,
          orders: 0,
          quantity: 0,
        };
      }

      map[dateStr].netSales += Number(row.order_net_sales || row.net_sales || 0);
      map[dateStr].grossSales += Number(row.order_gross_sales || row.gross_sales || 0);
      map[dateStr].orders += Number(row.order_count || row.order_total_count || 0);
      map[dateStr].quantity += Number(row.order_quantity || 0);
    });

    return Object.values(map).sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [overviewData]);

  if (chartData.length === 0) return null;

  // Maximum value for scaling bar heights
  const maxVal = Math.max(
    1,
    ...chartData.map((d) => (metricMode === "netSales" ? d.netSales : metricMode === "orders" ? d.orders : d.quantity))
  );

  const getMetricValue = (d) => {
    if (metricMode === "netSales") return d.netSales;
    if (metricMode === "orders") return d.orders;
    return d.quantity;
  };

  const formatMetricVal = (val) => {
    if (metricMode === "netSales") return formatCurrencyINR(val);
    return formatNumber(val);
  };

  const metricColor =
    metricMode === "netSales" ? "#0A84FF" : metricMode === "orders" ? "#2563EB" : "#16A34A";

  return (
    <div
      style={{
        backgroundColor: "#FFFFFF",
        borderRadius: "16px",
        border: "1px solid #E2E8F0",
        padding: "20px 24px",
        boxShadow: "0 1px 3px rgba(15, 23, 42, 0.03)",
      }}
    >
      {/* Header Row & Metric Selector */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "20px",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <BarChart2 size={20} color="#0A84FF" />
          <div>
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: "#0F172A" }}>
              Sales & Order Trend
            </h3>
            <p style={{ margin: "2px 0 0 0", fontSize: "13px", color: "#64748B" }}>
              Daily performance distribution over the selected date range
            </p>
          </div>
        </div>

        {/* Metric Switcher Pills */}
        <div
          style={{
            display: "inline-flex",
            backgroundColor: "#F1F5F9",
            borderRadius: "8px",
            padding: "3px",
            gap: "2px",
          }}
        >
          <button
            type="button"
            onClick={() => setMetricMode("netSales")}
            style={{
              padding: "6px 14px",
              borderRadius: "6px",
              border: "none",
              backgroundColor: metricMode === "netSales" ? "#FFFFFF" : "transparent",
              color: metricMode === "netSales" ? "#0F172A" : "#64748B",
              fontSize: "12px",
              fontWeight: "600",
              cursor: "pointer",
              boxShadow: metricMode === "netSales" ? "0 1px 2px rgba(15, 23, 42, 0.08)" : "none",
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
              transition: "all 0.15s ease",
            }}
          >
            <TrendingUp size={13} color={metricMode === "netSales" ? "#0A84FF" : "#64748B"} />
            Net Sales
          </button>
          <button
            type="button"
            onClick={() => setMetricMode("orders")}
            style={{
              padding: "6px 14px",
              borderRadius: "6px",
              border: "none",
              backgroundColor: metricMode === "orders" ? "#FFFFFF" : "transparent",
              color: metricMode === "orders" ? "#0F172A" : "#64748B",
              fontSize: "12px",
              fontWeight: "600",
              cursor: "pointer",
              boxShadow: metricMode === "orders" ? "0 1px 2px rgba(15, 23, 42, 0.08)" : "none",
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
              transition: "all 0.15s ease",
            }}
          >
            <ShoppingCart size={13} color={metricMode === "orders" ? "#2563EB" : "#64748B"} />
            Orders
          </button>
          <button
            type="button"
            onClick={() => setMetricMode("quantity")}
            style={{
              padding: "6px 14px",
              borderRadius: "6px",
              border: "none",
              backgroundColor: metricMode === "quantity" ? "#FFFFFF" : "transparent",
              color: metricMode === "quantity" ? "#0F172A" : "#64748B",
              fontSize: "12px",
              fontWeight: "600",
              cursor: "pointer",
              boxShadow: metricMode === "quantity" ? "0 1px 2px rgba(15, 23, 42, 0.08)" : "none",
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
              transition: "all 0.15s ease",
            }}
          >
            <Layers size={13} color={metricMode === "quantity" ? "#16A34A" : "#64748B"} />
            Quantity Sold
          </button>
        </div>
      </div>

      {/* Chart Canvas */}
      <div style={{ position: "relative", height: "190px", width: "100%", marginTop: "10px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            height: "150px",
            gap: chartData.length > 20 ? "4px" : "12px",
            justifyContent: "space-between",
          }}
        >
          {chartData.map((d, idx) => {
            const val = getMetricValue(d);
            const heightPct = Math.min(100, Math.max(6, (val / maxVal) * 100));
            const isHovered = activeHoverIdx === idx;

            return (
              <div
                key={d.date || idx}
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  height: "100%",
                  justifyContent: "flex-end",
                  position: "relative",
                  cursor: "pointer",
                }}
                onMouseEnter={() => setActiveHoverIdx(idx)}
                onMouseLeave={() => setActiveHoverIdx(null)}
              >
                {/* Tooltip on Hover */}
                {isHovered && (
                  <div
                    style={{
                      position: "absolute",
                      bottom: "100%",
                      marginBottom: "8px",
                      backgroundColor: "#0F172A",
                      color: "#FFFFFF",
                      padding: "8px 12px",
                      borderRadius: "8px",
                      fontSize: "11px",
                      whiteSpace: "nowrap",
                      zIndex: 10,
                      boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                      pointerEvents: "none",
                    }}
                  >
                    <div style={{ fontWeight: "700", borderBottom: "1px solid #334155", paddingBottom: "4px", marginBottom: "4px" }}>
                      {d.date}
                    </div>
                    <div>Net Sales: {formatCurrencyINR(d.netSales)}</div>
                    <div>Orders: {formatNumber(d.orders)}</div>
                    <div>Qty Sold: {formatNumber(d.quantity)}</div>
                  </div>
                )}

                {/* Vertical Bar */}
                <div
                  style={{
                    width: "100%",
                    maxWidth: "32px",
                    height: `${heightPct}%`,
                    backgroundColor: isHovered ? metricColor : `${metricColor}D0`,
                    borderRadius: "4px 4px 0 0",
                    transition: "all 0.15s ease",
                    transform: isHovered ? "scaleY(1.04)" : "none",
                  }}
                />

                {/* X-Axis Date Label */}
                <span
                  style={{
                    fontSize: "10px",
                    color: isHovered ? "#0F172A" : "#94A3B8",
                    fontWeight: isHovered ? "600" : "500",
                    marginTop: "6px",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    maxWidth: "48px",
                  }}
                >
                  {d.date ? d.date.split("-").slice(1).join("/") : ""}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ShopifyOverviewChart;
