import React, { useEffect, useRef } from "react";
import { formatMetric, getChannelBadgeStyle } from "../utils/attribution.js";
import StatusBadge from "../../meta/components/StatusBadge.jsx";
import { X, ShoppingCart, Tag, ExternalLink, Link2 } from "lucide-react";

/**
 * AttributionOrderDrawer Component.
 * Slide-over drawer displaying detailed order attribution metadata and UTM parameters.
 */
export const AttributionOrderDrawer = ({ order, isOpen, onClose, currency = "INR" }) => {
  const contentRef = useRef(null);

  // ESC key listener & Body scroll lock
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !order) {
    return null;
  }

  const badgeStyle = getChannelBadgeStyle(order.channel);

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(15, 23, 42, 0.35)",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
        display: "flex",
        justifyContent: "flex-end",
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        ref={contentRef}
        style={{
          width: "480px",
          maxWidth: "100%",
          height: "100%",
          backgroundColor: "#FFFFFF",
          boxShadow: "-10px 0 25px -5px rgba(15, 23, 42, 0.1)",
          display: "flex",
          flexDirection: "column",
          position: "relative",
          animation: "slideInRight 0.25s ease-out forwards",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <style>{`
          @keyframes slideInRight {
            from { transform: translateX(100%); }
            to { transform: translateX(0); }
          }
        `}</style>

        {/* Header */}
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid #E5E7EB",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: "#FFFFFF",
            position: "sticky",
            top: 0,
            zIndex: 10,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                backgroundColor: "#F1F5F9",
                color: "#0F172A",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ShoppingCart size={18} strokeWidth={2} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: "#0F172A" }}>
                Order #{order.orderId}
              </h3>
              <span style={{ fontSize: "12px", color: "#64748B" }}>
                {order.createdAt ? new Date(order.createdAt).toLocaleString() : "Date N/A"}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close drawer"
            style={{
              background: "none",
              border: "none",
              color: "#94A3B8",
              cursor: "pointer",
              padding: "6px",
              borderRadius: "6px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "color 0.15s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#0F172A")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#94A3B8")}
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div style={{ padding: "24px", overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Section 1: Financial & Sales Summary */}
          <div
            style={{
              backgroundColor: "#F8FAFC",
              borderRadius: "12px",
              border: "1px solid #E5E7EB",
              padding: "16px",
            }}
          >
            <span style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "#94A3B8", letterSpacing: "0.5px" }}>
              Order Financials
            </span>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginTop: "12px" }}>
              <div>
                <span style={{ fontSize: "12px", color: "#64748B", display: "block" }}>Net Sales</span>
                <span style={{ fontSize: "18px", fontWeight: "700", color: "#0F172A" }}>
                  {formatMetric(order.netRevenue, "currency", currency)}
                </span>
              </div>

              <div>
                <span style={{ fontSize: "12px", color: "#64748B", display: "block" }}>Total Price</span>
                <span style={{ fontSize: "18px", fontWeight: "700", color: "#0F172A" }}>
                  {formatMetric(order.grossRevenue, "currency", currency)}
                </span>
              </div>
            </div>

            <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px solid #E5E7EB", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: "12px", color: "#64748B" }}>Payment Status</span>
              <StatusBadge status={order.paymentStatus || "unknown"} />
            </div>
          </div>

          {/* Section 2: Attribution Channel */}
          <div>
            <h4 style={{ margin: "0 0 12px 0", fontSize: "14px", fontWeight: "700", color: "#0F172A" }}>
              Attribution Classification
            </h4>

            <div
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: "12px",
                border: "1px solid #E5E7EB",
                padding: "16px",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "12px", color: "#64748B" }}>Attribution Channel</span>
                <span
                  style={{
                    padding: "4px 10px",
                    borderRadius: "6px",
                    fontSize: "12px",
                    fontWeight: "600",
                    backgroundColor: badgeStyle.bg,
                    border: `1px solid ${badgeStyle.border}`,
                    color: badgeStyle.text,
                  }}
                >
                  {order.channel}
                </span>
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "12px", color: "#64748B" }}>Top-Level Group</span>
                <span style={{ fontSize: "12px", fontWeight: "600", color: "#0F172A", textTransform: "uppercase" }}>
                  {order.topLevelGroup}
                </span>
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "12px", color: "#64748B" }}>Click ID Present</span>
                <span style={{ fontSize: "12px", fontWeight: "600", color: order.hadClickId ? "#16A34A" : "#64748B" }}>
                  {order.hadClickId ? "Yes" : "No"}
                </span>
              </div>
            </div>
          </div>

          {/* Section 3: UTM Parameters */}
          <div>
            <h4 style={{ margin: "0 0 12px 0", fontSize: "14px", fontWeight: "700", color: "#0F172A" }}>
              UTM & Referrer Parameters
            </h4>

            <div
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: "12px",
                border: "1px solid #E5E7EB",
                padding: "16px",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                fontSize: "13px",
              }}
            >
              {[
                { label: "utm_source:", value: order.utmSource },
                { label: "utm_medium:", value: order.utmMedium },
                { label: "utm_campaign:", value: order.utmCampaign },
                { label: "utm_content:", value: order.utmContent },
                { label: "Referrer Host:", value: order.referrerHost, isBorder: true },
              ].map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    gap: "12px",
                    borderTop: item.isBorder ? "1px solid #F1F5F9" : "none",
                    paddingTop: item.isBorder ? "8px" : 0,
                  }}
                >
                  <span style={{ color: "#64748B", flexShrink: 0, minWidth: "100px" }}>{item.label}</span>
                  <span
                    style={{
                      fontWeight: "600",
                      color: "#0F172A",
                      textAlign: "right",
                      wordBreak: "break-word",
                      overflowWrap: "anywhere",
                      minWidth: 0,
                      flex: 1,
                    }}
                  >
                    {item.value || "—"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttributionOrderDrawer;
