import React from "react";
import { formatMetric, getChannelBadgeStyle } from "../utils/attribution.js";

/**
 * AttributionChannelTable Component.
 * Renders analytical breakdown table for all 7 raw attribution channels.
 */
export const AttributionChannelTable = ({ channels = [], currency = "INR" }) => {
  if (!Array.isArray(channels) || channels.length === 0) {
    return null;
  }

  return (
    <div
      style={{
        backgroundColor: "#FFFFFF",
        borderRadius: "16px",
        border: "1px solid #E5E7EB",
        padding: "20px 24px",
        marginBottom: "24px",
        boxShadow: "0 1px 3px rgba(15, 23, 42, 0.03)",
      }}
    >
      <div style={{ marginBottom: "16px" }}>
        <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: "#0F172A" }}>
          Attribution Breakdown
        </h3>
        <p style={{ margin: "2px 0 0 0", fontSize: "13px", color: "#64748B" }}>
          Detailed performance breakdown across all 7 attribution channels
        </p>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #E5E7EB", color: "#64748B" }}>
              <th style={{ padding: "10px 12px", fontWeight: "600" }}>Channel</th>
              <th style={{ padding: "10px 12px", fontWeight: "600", textAlign: "right" }}>Orders</th>
              <th style={{ padding: "10px 12px", fontWeight: "600", textAlign: "right" }}>Order %</th>
              <th style={{ padding: "10px 12px", fontWeight: "600", textAlign: "right" }}>Net Revenue</th>
              <th style={{ padding: "10px 12px", fontWeight: "600", textAlign: "right" }}>Revenue %</th>
              <th style={{ padding: "10px 12px", fontWeight: "600", textAlign: "right" }}>Avg Order Value</th>
            </tr>
          </thead>
          <tbody>
            {channels.map((ch, idx) => {
              const orders = ch.orderCount ?? 0;
              const netRev = ch.netRevenue ?? ch.grossRevenue ?? 0;
              const orderPct = ch.percentageOfOrders ?? 0;
              const revPct = ch.percentageOfNetRevenue ?? ch.percentageOfRevenue ?? 0;

              const aov = orders > 0 ? netRev / orders : null;
              const badgeStyle = getChannelBadgeStyle(ch.channel);

              return (
                <tr
                  key={ch.channel || idx}
                  style={{
                    borderBottom: idx === channels.length - 1 ? "none" : "1px solid #F1F5F9",
                    transition: "background-color 0.15s ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#F8FAFC")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  <td style={{ padding: "12px" }}>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        padding: "3px 10px",
                        borderRadius: "6px",
                        fontSize: "12px",
                        fontWeight: "600",
                        backgroundColor: badgeStyle.bg,
                        border: `1px solid ${badgeStyle.border}`,
                        color: badgeStyle.text,
                      }}
                    >
                      {ch.channel}
                    </span>
                  </td>

                  <td style={{ padding: "12px", textAlign: "right", fontWeight: "600", color: "#0F172A" }}>
                    {formatMetric(orders, "number")}
                  </td>

                  <td style={{ padding: "12px", textAlign: "right", color: "#64748B" }}>
                    {formatMetric(orderPct, "percentage")}
                  </td>

                  <td style={{ padding: "12px", textAlign: "right", fontWeight: "600", color: "#0F172A" }}>
                    {formatMetric(netRev, "currency", currency)}
                  </td>

                  <td style={{ padding: "12px", textAlign: "right", color: "#64748B" }}>
                    {formatMetric(revPct, "percentage")}
                  </td>

                  <td style={{ padding: "12px", textAlign: "right", fontWeight: "500", color: "#0F172A" }}>
                    {formatMetric(aov, "currency", currency)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AttributionChannelTable;
