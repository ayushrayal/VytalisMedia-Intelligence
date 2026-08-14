import React from "react";
import { formatMetric, getChannelBadgeStyle } from "../utils/attribution.js";
import StatusBadge from "../../meta/components/StatusBadge.jsx";
import Pagination from "../../../components/ui/Pagination.jsx";
import EmptyState from "../../../components/ui/EmptyState.jsx";

/**
 * AttributionOrderTable Component.
 * Detailed order-level attribution data table with pagination controls.
 */
export const AttributionOrderTable = ({
  orders = [],
  pagination = {},
  onPageChange,
  onPageSizeChange,
  onSelectOrder,
  currency = "INR",
}) => {
  if (!Array.isArray(orders) || orders.length === 0) {
    return (
      <div
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: "16px",
          border: "1px solid #E5E7EB",
          padding: "32px 20px",
          textAlign: "center",
        }}
      >
        <EmptyState
          title="No attributed orders found"
          description="Try selecting a different date range or adjusting your search & filters."
        />
      </div>
    );
  }

  return (
    <div
      style={{
        backgroundColor: "#FFFFFF",
        borderRadius: "16px",
        border: "1px solid #E5E7EB",
        boxShadow: "0 1px 3px rgba(15, 23, 42, 0.03)",
        overflow: "hidden",
      }}
    >
      <div style={{ padding: "20px 24px 12px 24px", borderBottom: "1px solid #E5E7EB" }}>
        <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: "#0F172A" }}>
          Attributed Orders
        </h3>
        <p style={{ margin: "2px 0 0 0", fontSize: "13px", color: "#64748B" }}>
          Order-level attribution breakdowns and parameters
        </p>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #E5E7EB", color: "#64748B", backgroundColor: "#FAFCFF" }}>
              <th style={{ padding: "10px 16px", fontWeight: "600" }}>Order ID</th>
              <th style={{ padding: "10px 16px", fontWeight: "600" }}>Date</th>
              <th style={{ padding: "10px 16px", fontWeight: "600" }}>Attribution</th>
              <th style={{ padding: "10px 16px", fontWeight: "600" }}>Source / Medium</th>
              <th style={{ padding: "10px 16px", fontWeight: "600" }}>Campaign</th>
              <th style={{ padding: "10px 16px", fontWeight: "600", textAlign: "right" }}>Net Sales</th>
              <th style={{ padding: "10px 16px", fontWeight: "600", textAlign: "right" }}>Total Price</th>
              <th style={{ padding: "10px 16px", fontWeight: "600", textAlign: "center" }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => {
              const badgeStyle = getChannelBadgeStyle(o.channel);
              const sourceMedium = [o.utmSource, o.utmMedium].filter(Boolean).join(" / ") || "—";
              const formattedDate = o.createdAt
                ? new Date(o.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
                : "—";

              return (
                <tr
                  key={o.orderId}
                  onClick={() => onSelectOrder && onSelectOrder(o)}
                  style={{
                    borderBottom: "1px solid #F1F5F9",
                    cursor: "pointer",
                    transition: "background-color 0.15s ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#F8FAFC")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  <td style={{ padding: "12px 16px", fontWeight: "700", color: "#0A84FF", whiteSpace: "nowrap" }}>
                    #{o.orderId}
                  </td>

                  <td style={{ padding: "12px 16px", color: "#475569", whiteSpace: "nowrap" }}>
                    {formattedDate}
                  </td>

                  <td style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        padding: "3px 8px",
                        borderRadius: "6px",
                        fontSize: "11px",
                        fontWeight: "600",
                        backgroundColor: badgeStyle.bg,
                        border: `1px solid ${badgeStyle.border}`,
                        color: badgeStyle.text,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {o.channel}
                    </span>
                  </td>

                  <td style={{ padding: "12px 16px", color: "#0F172A", fontWeight: "500" }}>
                    {sourceMedium}
                  </td>

                  <td
                    style={{
                      padding: "12px 16px",
                      color: "#475569",
                      maxWidth: "220px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                    title={o.utmCampaign || "—"}
                  >
                    {o.utmCampaign || "—"}
                  </td>

                  <td style={{ padding: "12px 16px", textAlign: "right", fontWeight: "600", color: "#0F172A" }}>
                    {formatMetric(o.netRevenue, "currency", currency)}
                  </td>

                  <td style={{ padding: "12px 16px", textAlign: "right", fontWeight: "600", color: "#0F172A" }}>
                    {formatMetric(o.grossRevenue, "currency", currency)}
                  </td>

                  <td style={{ padding: "12px 16px", textAlign: "center" }}>
                    <StatusBadge status={o.paymentStatus || "unknown"} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {pagination && pagination.totalItems > 0 && (
        <Pagination
          currentPage={pagination.currentPage || 1}
          totalPages={pagination.totalPages || 1}
          pageSize={pagination.limit || 20}
          totalItems={pagination.totalItems || orders.length}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
          pageSizeOptions={[10, 20, 50]}
        />
      )}
    </div>
  );
};

export default AttributionOrderTable;
