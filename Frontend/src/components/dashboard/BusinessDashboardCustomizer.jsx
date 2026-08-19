import React, { useState, useEffect } from "react";
import { X, GripVertical, ChevronUp, ChevronDown, Check, AlertCircle } from "lucide-react";
import { http } from "../../lib/http.js";
import { getErrorMessage } from "../../utils/error.js";

/**
 * AVAILABLE META METRICS
 */
export const ALL_META_METRICS = [
  { id: "amount-spent", label: "Amount Spent", desc: "Total Meta advertising spend" },
  { id: "impressions", label: "Impressions", desc: "Total ad views" },
  { id: "reach", label: "Reach", desc: "Unique users reached" },
  { id: "purchases", label: "Purchases", desc: "Total purchase conversions" },
  { id: "purchase-value", label: "Purchase Value", desc: "Total purchase revenue" },
  { id: "clicks", label: "Clicks", desc: "Total link clicks" },
  { id: "ctr", label: "CTR", desc: "Click-through rate" },
  { id: "cpm", label: "CPM", desc: "Cost per 1,000 impressions" },
  { id: "cpc", label: "CPC", desc: "Cost per click" },
  { id: "frequency", label: "Frequency", desc: "Average impressions per person" },
  { id: "add-to-cart", label: "Add to Cart", desc: "Total add to cart actions" },
  { id: "checkout-initiated", label: "Checkout Initiated", desc: "Total checkout initiated actions" },
  { id: "purchase-roas", label: "ROAS", desc: "Return on ad spend" },
  { id: "cost-per-purchase", label: "Cost per Purchase", desc: "Average cost per purchase" },
];

/**
 * AVAILABLE SHOPIFY METRICS
 */
export const ALL_SHOPIFY_METRICS = [
  { id: "grossSales", label: "Gross Sales", desc: "Total sales before discounts & returns" },
  { id: "netSales", label: "Net Sales", desc: "Total revenue after discounts" },
  { id: "orders", label: "Total Orders", desc: "Total completed orders" },
  { id: "discounts", label: "Total Discounts", desc: "Total promotional discounts applied" },
  { id: "customers", label: "Total Customers", desc: "Total unique customers" },
  { id: "aov", label: "Average Order Value", desc: "Average revenue per order" },
  { id: "prepaid", label: "Prepaid Orders", desc: "Orders paid online via prepaid methods" },
  { id: "cod", label: "COD Orders", desc: "Cash on delivery orders" },
  { id: "cancelled", label: "Cancelled Orders", desc: "Total cancelled or refunded orders" },
];

/**
 * BusinessDashboardCustomizer Drawer Component.
 * Right-side drawer interface allowing users to choose & reorder up to 5 Meta & 5 Shopify KPI cards.
 */
export const BusinessDashboardCustomizer = ({
  isOpen,
  onClose,
  initialMeta = [],
  initialShopify = [],
  onSave,
}) => {
  const [selectedMeta, setSelectedMeta] = useState([]);
  const [selectedShopify, setSelectedShopify] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Sync state when drawer opens or initial props change
  useEffect(() => {
    if (isOpen) {
      const metaList = Array.isArray(initialMeta) && initialMeta.length > 0
        ? initialMeta.slice(0, 5)
        : ["amount-spent", "impressions", "purchases", "purchase-value", "reach"];

      const shopifyList = Array.isArray(initialShopify) && initialShopify.length > 0
        ? initialShopify.slice(0, 5)
        : ["grossSales", "netSales", "orders", "discounts", "customers"];

      setSelectedMeta(metaList);
      setSelectedShopify(shopifyList);
      setErrorMessage("");
    }
  }, [isOpen, initialMeta, initialShopify]);

  if (!isOpen) return null;

  // Toggle Selection Handlers
  const toggleMetaMetric = (id) => {
    setErrorMessage("");
    if (selectedMeta.includes(id)) {
      if (selectedMeta.length <= 1) {
        setErrorMessage("Select at least one Meta metric.");
        return;
      }
      setSelectedMeta((prev) => prev.filter((m) => m !== id));
    } else {
      if (selectedMeta.length >= 5) {
        setErrorMessage("Maximum 5 Meta metrics selected.");
        return;
      }
      setSelectedMeta((prev) => [...prev, id]);
    }
  };

  const toggleShopifyMetric = (id) => {
    setErrorMessage("");
    if (selectedShopify.includes(id)) {
      if (selectedShopify.length <= 1) {
        setErrorMessage("Select at least one Shopify metric.");
        return;
      }
      setSelectedShopify((prev) => prev.filter((s) => s !== id));
    } else {
      if (selectedShopify.length >= 5) {
        setErrorMessage("Maximum 5 Shopify metrics selected.");
        return;
      }
      setSelectedShopify((prev) => [...prev, id]);
    }
  };

  // Reorder Handlers (Move Up / Move Down)
  const moveMetaMetric = (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= selectedMeta.length) return;
    const updated = [...selectedMeta];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    setSelectedMeta(updated);
  };

  const moveShopifyMetric = (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= selectedShopify.length) return;
    const updated = [...selectedShopify];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    setSelectedShopify(updated);
  };

  // Save Handler
  const handleSave = async () => {
    if (isSaving) return;

    if (selectedMeta.length === 0) {
      setErrorMessage("Select at least one Meta metric.");
      return;
    }
    if (selectedMeta.length > 5) {
      setErrorMessage("Maximum 5 Meta metrics selected.");
      return;
    }
    if (selectedShopify.length === 0) {
      setErrorMessage("Select at least one Shopify metric.");
      return;
    }
    if (selectedShopify.length > 5) {
      setErrorMessage("Maximum 5 Shopify metrics selected.");
      return;
    }

    try {
      setIsSaving(true);
      setErrorMessage("");

      // 1. Persist preferences to Backend User Profile API
      await http.put("/profile/kpi-preferences", {
        meta: selectedMeta,
        shopify: selectedShopify,
      });

      // 2. Persist to LocalStorage for instant cross-component synchronization
      localStorage.setItem(
        "vytalis_meta_dashboard_layout",
        JSON.stringify({
          orderedWidgetIds: selectedMeta,
          visibleWidgetIds: selectedMeta,
        })
      );

      const shopifyCardConfig = selectedShopify.map((id, index) => ({
        id,
        label: ALL_SHOPIFY_METRICS.find((m) => m.id === id)?.label || id,
        visible: true,
        order: index + 1,
      }));
      localStorage.setItem("vytalis_shopify_card_config", JSON.stringify(shopifyCardConfig));

      // 3. Update dashboard state & dispatch storage event
      if (onSave) {
        onSave({ meta: selectedMeta, shopify: selectedShopify });
      }
      window.dispatchEvent(new Event("storage"));

      // 4. Close drawer on successful save ONLY
      onClose();
    } catch (err) {
      console.error("[KPI Preference Save Failure]:", err);
      setErrorMessage(getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

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
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <aside
        style={{
          width: "440px",
          maxWidth: "100%",
          height: "100vh",
          backgroundColor: "#FFFFFF",
          borderLeft: "1px solid #E8EAED",
          display: "flex",
          flexDirection: "column",
          boxShadow: "-10px 0 25px rgba(15, 23, 42, 0.08)",
        }}
      >
        {/* DRAWER HEADER */}
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid #E8EAED",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            backgroundColor: "#FFFFFF",
          }}
        >
          <div>
            <h2
              style={{
                margin: "0 0 4px 0",
                fontSize: "18px",
                fontWeight: "700",
                color: "#0F2742",
                letterSpacing: "-0.3px",
              }}
            >
              Customize Dashboard
            </h2>
            <p style={{ margin: 0, fontSize: "13px", color: "#60758F" }}>
              Choose which metrics appear on your dashboard.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "#64748B",
              cursor: "pointer",
              padding: "4px",
              borderRadius: "6px",
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* DRAWER BODY (SCROLLABLE) */}
        <div
          style={{
            flex: 1,
            padding: "20px 24px",
            overflowY: "auto",
            backgroundColor: "#F7F9FC",
            display: "flex",
            flexDirection: "column",
            gap: "24px",
          }}
        >
          {errorMessage && (
            <div
              style={{
                padding: "10px 14px",
                backgroundColor: "rgba(229, 72, 77, 0.10)",
                border: "1px solid rgba(229, 72, 77, 0.25)",
                borderRadius: "10px",
                color: "#E5484D",
                fontSize: "13px",
                fontWeight: "500",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <AlertCircle size={16} />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* ========================================== */}
          {/* SECTION 1: META METRICS */}
          {/* ========================================== */}
          <div
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "14px",
              border: "1px solid #E8EAED",
              padding: "20px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "14px",
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: "14px", fontWeight: "700", color: "#0F2742", letterSpacing: "0.5px" }}>
                  META
                </h3>
                <span style={{ fontSize: "12px", color: "#60758F" }}>Choose up to 5 metrics</span>
              </div>
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: "700",
                  color: selectedMeta.length === 5 ? "#0A84FF" : "#64748B",
                  backgroundColor: selectedMeta.length === 5 ? "rgba(10, 132, 255, 0.1)" : "#F1F5F9",
                  padding: "3px 8px",
                  borderRadius: "6px",
                }}
              >
                Selected: {selectedMeta.length} / 5
              </span>
            </div>

            {/* Selected Meta Metrics (Order) */}
            <div style={{ marginBottom: "16px" }}>
              <span style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "#60758F", display: "block", marginBottom: "8px" }}>
                Selected Order on Dashboard
              </span>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {selectedMeta.map((id, idx) => {
                  const metaObj = ALL_META_METRICS.find((m) => m.id === id) || { label: id, desc: "" };
                  return (
                    <div
                      key={id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "8px 12px",
                        backgroundColor: "rgba(10, 132, 255, 0.05)",
                        border: "1px solid rgba(10, 132, 255, 0.2)",
                        borderRadius: "8px",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
                          <button
                            type="button"
                            onClick={() => moveMetaMetric(idx, -1)}
                            disabled={idx === 0}
                            style={{ background: "none", border: "none", color: idx === 0 ? "#CBD5E1" : "#64748B", cursor: idx === 0 ? "default" : "pointer", padding: 0 }}
                          >
                            <ChevronUp size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveMetaMetric(idx, 1)}
                            disabled={idx === selectedMeta.length - 1}
                            style={{ background: "none", border: "none", color: idx === selectedMeta.length - 1 ? "#CBD5E1" : "#64748B", cursor: idx === selectedMeta.length - 1 ? "default" : "pointer", padding: 0 }}
                          >
                            <ChevronDown size={14} />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => toggleMetaMetric(id)}
                          style={{
                            width: "18px",
                            height: "18px",
                            borderRadius: "4px",
                            backgroundColor: "#0A84FF",
                            color: "#FFFFFF",
                            border: "none",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                          }}
                        >
                          <Check size={12} strokeWidth={3} />
                        </button>

                        <div>
                          <span style={{ fontSize: "13px", fontWeight: "600", color: "#0F2742", display: "block" }}>
                            {metaObj.label}
                          </span>
                          {metaObj.desc && (
                            <span style={{ fontSize: "11px", color: "#60758F" }}>{metaObj.desc}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Unselected Available Meta Metrics */}
            <div>
              <span style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "#60758F", display: "block", marginBottom: "8px" }}>
                Available Metrics
              </span>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px", maxHeight: "200px", overflowY: "auto" }}>
                {ALL_META_METRICS.filter((m) => !selectedMeta.includes(m.id)).map((metaObj) => {
                  const isMaxedOut = selectedMeta.length >= 5;
                  return (
                    <div
                      key={metaObj.id}
                      onClick={() => !isMaxedOut && toggleMetaMetric(metaObj.id)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        padding: "8px 12px",
                        borderRadius: "8px",
                        backgroundColor: "#FFFFFF",
                        border: "1px solid #E8EAED",
                        cursor: isMaxedOut ? "not-allowed" : "pointer",
                        opacity: isMaxedOut ? 0.6 : 1,
                        transition: "all 0.15s ease",
                      }}
                    >
                      <div
                        style={{
                          width: "18px",
                          height: "18px",
                          borderRadius: "4px",
                          border: "1.5px solid #CBD5E1",
                          backgroundColor: "#FFFFFF",
                          flexShrink: 0,
                        }}
                      />
                      <div>
                        <span style={{ fontSize: "13px", fontWeight: "500", color: "#0F2742", display: "block" }}>
                          {metaObj.label}
                        </span>
                        {metaObj.desc && (
                          <span style={{ fontSize: "11px", color: "#60758F" }}>{metaObj.desc}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ========================================== */}
          {/* SECTION 2: SHOPIFY METRICS */}
          {/* ========================================== */}
          <div
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "14px",
              border: "1px solid #E8EAED",
              padding: "20px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "14px",
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: "14px", fontWeight: "700", color: "#0F2742", letterSpacing: "0.5px" }}>
                  SHOPIFY
                </h3>
                <span style={{ fontSize: "12px", color: "#60758F" }}>Choose up to 5 metrics</span>
              </div>
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: "700",
                  color: selectedShopify.length === 5 ? "#0A84FF" : "#64748B",
                  backgroundColor: selectedShopify.length === 5 ? "rgba(10, 132, 255, 0.1)" : "#F1F5F9",
                  padding: "3px 8px",
                  borderRadius: "6px",
                }}
              >
                Selected: {selectedShopify.length} / 5
              </span>
            </div>

            {/* Selected Shopify Metrics (Order) */}
            <div style={{ marginBottom: "16px" }}>
              <span style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "#60758F", display: "block", marginBottom: "8px" }}>
                Selected Order on Dashboard
              </span>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {selectedShopify.map((id, idx) => {
                  const shopifyObj = ALL_SHOPIFY_METRICS.find((m) => m.id === id) || { label: id, desc: "" };
                  return (
                    <div
                      key={id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "8px 12px",
                        backgroundColor: "rgba(10, 132, 255, 0.05)",
                        border: "1px solid rgba(10, 132, 255, 0.2)",
                        borderRadius: "8px",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
                          <button
                            type="button"
                            onClick={() => moveShopifyMetric(idx, -1)}
                            disabled={idx === 0}
                            style={{ background: "none", border: "none", color: idx === 0 ? "#CBD5E1" : "#64748B", cursor: idx === 0 ? "default" : "pointer", padding: 0 }}
                          >
                            <ChevronUp size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveShopifyMetric(idx, 1)}
                            disabled={idx === selectedShopify.length - 1}
                            style={{ background: "none", border: "none", color: idx === selectedShopify.length - 1 ? "#CBD5E1" : "#64748B", cursor: idx === selectedShopify.length - 1 ? "default" : "pointer", padding: 0 }}
                          >
                            <ChevronDown size={14} />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => toggleShopifyMetric(id)}
                          style={{
                            width: "18px",
                            height: "18px",
                            borderRadius: "4px",
                            backgroundColor: "#0A84FF",
                            color: "#FFFFFF",
                            border: "none",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                          }}
                        >
                          <Check size={12} strokeWidth={3} />
                        </button>

                        <div>
                          <span style={{ fontSize: "13px", fontWeight: "600", color: "#0F2742", display: "block" }}>
                            {shopifyObj.label}
                          </span>
                          {shopifyObj.desc && (
                            <span style={{ fontSize: "11px", color: "#60758F" }}>{shopifyObj.desc}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Unselected Available Shopify Metrics */}
            <div>
              <span style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "#60758F", display: "block", marginBottom: "8px" }}>
                Available Metrics
              </span>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px", maxHeight: "200px", overflowY: "auto" }}>
                {ALL_SHOPIFY_METRICS.filter((m) => !selectedShopify.includes(m.id)).map((shopifyObj) => {
                  const isMaxedOut = selectedShopify.length >= 5;
                  return (
                    <div
                      key={shopifyObj.id}
                      onClick={() => !isMaxedOut && toggleShopifyMetric(shopifyObj.id)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        padding: "8px 12px",
                        borderRadius: "8px",
                        backgroundColor: "#FFFFFF",
                        border: "1px solid #E8EAED",
                        cursor: isMaxedOut ? "not-allowed" : "pointer",
                        opacity: isMaxedOut ? 0.6 : 1,
                        transition: "all 0.15s ease",
                      }}
                    >
                      <div
                        style={{
                          width: "18px",
                          height: "18px",
                          borderRadius: "4px",
                          border: "1.5px solid #CBD5E1",
                          backgroundColor: "#FFFFFF",
                          flexShrink: 0,
                        }}
                      />
                      <div>
                        <span style={{ fontSize: "13px", fontWeight: "500", color: "#0F2742", display: "block" }}>
                          {shopifyObj.label}
                        </span>
                        {shopifyObj.desc && (
                          <span style={{ fontSize: "11px", color: "#60758F" }}>{shopifyObj.desc}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* DRAWER FOOTER (STICKY) */}
        <div
          style={{
            padding: "16px 24px",
            borderTop: "1px solid #E8EAED",
            backgroundColor: "#FFFFFF",
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: "12px",
          }}
        >
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            style={{
              height: "40px",
              padding: "0 16px",
              borderRadius: "8px",
              backgroundColor: "#FFFFFF",
              border: "1px solid #E8EAED",
              color: "#334155",
              fontSize: "13.5px",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            style={{
              height: "40px",
              padding: "0 20px",
              borderRadius: "8px",
              backgroundColor: "#0A84FF",
              border: "none",
              color: "#FFFFFF",
              fontSize: "13.5px",
              fontWeight: "600",
              cursor: isSaving ? "wait" : "pointer",
              opacity: isSaving ? 0.7 : 1,
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              boxShadow: "0 2px 6px rgba(10, 132, 255, 0.25)",
            }}
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </aside>
    </div>
  );
};

export default BusinessDashboardCustomizer;
