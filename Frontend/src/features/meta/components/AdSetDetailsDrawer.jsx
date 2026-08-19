import React, { useState, useEffect, useRef, useMemo } from "react";
import { getCreatives } from "../services/meta.api.js";
import StatusBadge, { getNormalizedStatus } from "./StatusBadge.jsx";
import CreativeCard from "./CreativeCard.jsx";
import Skeleton from "../../../components/ui/Skeleton.jsx";
import ContextualLoader, { usePageLoading } from "../../../components/ui/ContextualLoader.jsx";
import ErrorState from "../../../components/ui/ErrorState.jsx";
import { X, Image as ImageIcon, BarChart3, Layers } from "lucide-react";
import { formatCurrency } from "../../../utils/formatCurrency.js";
import { formatNumber } from "../../../utils/formatNumber.js";
import { formatPercentage } from "../../../utils/formatPercentage.js";
import { getErrorMessage } from "../../../utils/error.js";
import { getCreativePreferences } from "../../../utils/creativePreferences.js";
import { checkIsSingleDay, aggregateCreativesData } from "../utils/creativeAggregator.js";

/**
 * Metric Formatter displaying '—' for unavailable (null/undefined) metrics.
 */
const formatMetric = (val, type, currency = "INR") => {
  if (val === null || val === undefined || val === "" || isNaN(Number(val))) {
    return "—";
  }
  const num = Number(val);
  switch (type) {
    case "currency":
      return formatCurrency(num, currency);
    case "percentage":
      return formatPercentage(num);
    case "roas":
      return `${num.toFixed(2)}x`;
    case "number":
      return formatNumber(num);
    case "decimal":
      return num.toFixed(2);
    default:
      return num.toLocaleString();
  }
};

/**
 * AdSetDetailsDrawer Component.
 * Right-side detail drawer for Meta Ad Set drill-down showing creatives belonging to the Ad Set.
 * 
 * Features:
 * - Header: [Ad Set Name] [Status Badge], Campaign Name, Ad Set ID
 * - Tabs: Creatives (N) | Performance
 * - Reuses existing getCreatives(dateParams) API and filters strictly by adset_id
 * - Reuses aggregateCreativesData to deduplicate/aggregate multi-day records without metric loss
 * - Reuses exact CreativeCard component with saved user KPI card preferences
 * - Handles loading skeleton and proper empty state
 */
export const AdSetDetailsDrawer = ({
  adset = null,
  isOpen = false,
  onClose,
  dateParams = {},
  onSelectCreative,
  spendFilter = "all",
  statusFilter = "all",
}) => {
  const [rawCreatives, setRawCreatives] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isDisplayLoading, handleComplete } = usePageLoading(loading);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("creatives"); // "creatives" | "performance"

  // User Creative Card Preferences for custom KPI cards
  const [cardPreferences, setCardPreferences] = useState(() => getCreativePreferences());

  const contentRef = useRef(null);

  const targetAdSetId = adset ? String(adset.adset_id || adset.id || "").trim() : "";
  const adsetName = adset ? adset.adset_name || adset.name || "Ad Set Details" : "Ad Set Details";
  const campaignName = adset ? adset.campaign || adset.campaign_name || "—" : "—";
  const adsetStatus = adset ? adset.effective_status || adset.adset_status || adset.status || "ACTIVE" : "ACTIVE";
  const currency = adset?.currency || "INR";

  // Fetch all creatives from existing getCreatives API when drawer opens
  const fetchCreativesData = async () => {
    if (!isOpen || !adset) return;
    try {
      setLoading(true);
      setError(null);
      const res = await getCreatives(dateParams);
      if (res && res.data) {
        const dataArr = Array.isArray(res.data) ? res.data : [];
        // Verification log as required: log raw response sample
        if (dataArr.length > 0) {
          console.log("[AdSetDetailsDrawer] getCreatives response item sample:", {
            ad_id: dataArr[0].ad_id || dataArr[0].creative_id || dataArr[0].id,
            adset_id: dataArr[0].adset_id,
            adset_name: dataArr[0].adset_name,
            campaign_id: dataArr[0].campaign_id,
            campaign_name: dataArr[0].campaign_name,
          });
        }
        setRawCreatives(dataArr);
      } else {
        setRawCreatives([]);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && adset) {
      setActiveTab("creatives");
      setCardPreferences(getCreativePreferences());
      fetchCreativesData();
    }
  }, [isOpen, adset, dateParams]);

  // Scroll content area to top on tab change
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
  }, [activeTab]);

  // ESC Key listener & Body Scroll Lock
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

  // 1. Determine if single day range
  const isSingleDay = useMemo(() => {
    return checkIsSingleDay(dateParams, rawCreatives);
  }, [dateParams, rawCreatives]);

  // 2. Aggregate raw creatives multi-day dataset using creative identity
  const aggregatedCreatives = useMemo(() => {
    return aggregateCreativesData(rawCreatives, isSingleDay);
  }, [rawCreatives, isSingleDay]);

  // 3. Filter creatives strictly by adset_id
  const adsetCreatives = useMemo(() => {
    if (!targetAdSetId) return [];
    return aggregatedCreatives.filter((cr) => {
      const crAdsetId = String(cr.adset_id || cr.adsetId || "").trim();
      return crAdsetId === targetAdSetId;
    });
  }, [aggregatedCreatives, targetAdSetId]);

  // 4. Apply current spend and status filters
  const filteredCreatives = useMemo(() => {
    return adsetCreatives.filter((row) => {
      const numericSpend = Number(row.spend || 0);
      const matchesSpend = spendFilter === "all" || numericSpend >= Number(spendFilter);

      const rawStatus = row.effective_status || row.ad_effective_status || row.ad_status || row.status || "ACTIVE";
      let matchesStatus = true;
      if (statusFilter !== "all") {
        const normStatus = getNormalizedStatus(rawStatus);
        matchesStatus = normStatus === statusFilter;
      }

      return matchesSpend && matchesStatus;
    });
  }, [adsetCreatives, spendFilter, statusFilter]);

  if (!isOpen || !adset) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Ad Set Details"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1000,
        display: "flex",
        justifyContent: "flex-end",
      }}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(15, 23, 42, 0.35)",
          backdropFilter: "blur(3px)",
          transition: "opacity 0.2s ease",
        }}
      />

      {/* Drawer Shell */}
      <aside
        style={{
          position: "relative",
          zIndex: 1001,
          width: "100%",
          maxWidth: "880px",
          height: "100vh",
          backgroundColor: "#FFFFFF",
          color: "#0F172A",
          borderLeft: "1px solid #E5EAF0",
          boxShadow: "0 10px 30px rgba(15, 23, 42, 0.1)",
          display: "flex",
          flexDirection: "column",
          borderRadius: "16px 0 0 16px",
          overflow: "hidden",
          animation: "slideInRight 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        {/* STICKY HEADER */}
        <div
          style={{
            padding: "18px 24px",
            borderBottom: "1px solid #E5EAF0",
            backgroundColor: "#FFFFFF",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "16px",
            flexShrink: 0,
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", marginBottom: "4px" }}>
              <h3
                style={{
                  margin: 0,
                  fontSize: "18px",
                  fontWeight: "650",
                  color: "#0F172A",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {adsetName}
              </h3>
              <StatusBadge status={adsetStatus} />
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap", fontSize: "12px", color: "#64748B" }}>
              <span>
                <strong style={{ color: "#0F172A" }}>Campaign:</strong> {campaignName}
              </span>
              <span>
                <strong style={{ color: "#0F172A" }}>Ad Set ID:</strong> {targetAdSetId}
              </span>
            </div>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            aria-label="Close drawer"
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              border: "1px solid #E5EAF0",
              backgroundColor: "#FFFFFF",
              color: "#64748B",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.15s ease",
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#F1F5F9";
              e.currentTarget.style.color = "#0F172A";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#FFFFFF";
              e.currentTarget.style.color = "#64748B";
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* STICKY TAB NAVIGATION */}
        <div
          style={{
            display: "flex",
            borderBottom: "1px solid #E5EAF0",
            backgroundColor: "#FFFFFF",
            padding: "0 24px",
            flexShrink: 0,
          }}
        >
          {[
            { id: "creatives", label: `Creatives (${loading ? "…" : filteredCreatives.length})`, icon: ImageIcon },
            { id: "performance", label: "Performance", icon: BarChart3 },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            const TabIcon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: "12px 18px",
                  border: "none",
                  borderBottom: isActive ? "2px solid #1683FF" : "2px solid transparent",
                  backgroundColor: "transparent",
                  color: isActive ? "#1683FF" : "#64748B",
                  fontWeight: isActive ? "650" : "500",
                  fontSize: "13px",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  outline: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <TabIcon size={15} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* SCROLLABLE CONTENT AREA */}
        <div
          ref={contentRef}
          style={{
            flex: 1,
            padding: "24px",
            backgroundColor: "#F8FAFC",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: "20px",
          }}
        >
          {isDisplayLoading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <ContextualLoader isLoading={loading} onComplete={handleComplete} label="Loading Ad Set Details" minHeight="auto" />
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "16px" }}>
                <Skeleton height="320px" />
                <Skeleton height="320px" />
                <Skeleton height="320px" />
              </div>
            </div>
          ) : error ? (
            <ErrorState message="Unable to load creatives for this Ad Set" onRetry={fetchCreativesData} />
          ) : (
            <>
              {/* TAB 1: CREATIVES SECTION */}
              {activeTab === "creatives" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <h4 style={{ margin: 0, fontSize: "15px", fontWeight: "700", color: "#0F172A" }}>
                      Creatives ({filteredCreatives.length})
                    </h4>
                  </div>

                  {filteredCreatives.length === 0 ? (
                    <div
                      style={{
                        padding: "48px 24px",
                        textAlign: "center",
                        backgroundColor: "#FFFFFF",
                        borderRadius: "12px",
                        border: "1px dashed #E5EAF0",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "10px",
                      }}
                    >
                      <div
                        style={{
                          width: "44px",
                          height: "44px",
                          borderRadius: "10px",
                          backgroundColor: "#F1F5F9",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#64748B",
                        }}
                      >
                        <ImageIcon size={22} />
                      </div>
                      <strong style={{ fontSize: "15px", color: "#0F172A", fontWeight: "650" }}>
                        No creatives found
                      </strong>
                      <p style={{ margin: 0, fontSize: "13px", color: "#64748B", maxWidth: "400px", lineHeight: "1.4" }}>
                        This Ad Set currently has no creatives available for the selected date range and filters.
                      </p>
                    </div>
                  ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "16px" }}>
                      {filteredCreatives.map((cr, idx) => {
                        const creativeKey = `adset-creative-${cr.ad_id || cr.creative_id || cr.id || idx}-${idx}`;
                        return (
                          <CreativeCard
                            key={creativeKey}
                            creative={cr}
                            preferences={cardPreferences}
                            onClick={() => {
                              if (onSelectCreative) onSelectCreative(cr);
                            }}
                          />
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: AD SET PERFORMANCE METRICS */}
              {activeTab === "performance" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                  {/* Ad Set Context Card */}
                  <div
                    style={{
                      padding: "16px",
                      borderRadius: "12px",
                      backgroundColor: "#FFFFFF",
                      border: "1px solid #E5EAF0",
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                      gap: "14px",
                    }}
                  >
                    <div>
                      <span style={{ fontSize: "11px", color: "#64748B", display: "block" }}>Ad Set Name</span>
                      <strong style={{ fontSize: "13.5px", color: "#0F172A" }}>{adsetName}</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: "11px", color: "#64748B", display: "block" }}>Campaign</span>
                      <strong style={{ fontSize: "13.5px", color: "#0F172A" }}>{campaignName}</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: "11px", color: "#64748B", display: "block" }}>Status</span>
                      <StatusBadge status={adsetStatus} />
                    </div>
                    <div>
                      <span style={{ fontSize: "11px", color: "#64748B", display: "block" }}>Creatives</span>
                      <strong style={{ fontSize: "13.5px", color: "#0F172A" }}>{adsetCreatives.length}</strong>
                    </div>
                  </div>

                  {/* 2-Column KPI Grid */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "14px" }}>
                    {/* Spend & Cost Per Result */}
                    <div style={kpiCardStyle}>
                      <div>
                        <span style={kpiLabelStyle}>Amount Spent</span>
                        <strong style={kpiValueStyle}>{formatMetric(adset.spend, "currency", currency)}</strong>
                      </div>
                      <div>
                        <span style={kpiLabelStyle}>Cost / Result</span>
                        <strong style={kpiValueStyle}>{formatMetric(adset.cost_per_result, "currency", currency)}</strong>
                      </div>
                    </div>

                    {/* Purchases & Purchase Value */}
                    <div style={kpiCardStyle}>
                      <div>
                        <span style={kpiLabelStyle}>Purchases</span>
                        <strong style={kpiValueStyle}>{formatMetric(adset.purchases, "number")}</strong>
                      </div>
                      <div>
                        <span style={kpiLabelStyle}>Purchase Value</span>
                        <strong style={kpiValueStyle}>{formatMetric(adset.purchase_conversion_value, "currency", currency)}</strong>
                      </div>
                    </div>

                    {/* Purchase ROAS & Impressions */}
                    <div style={kpiCardStyle}>
                      <div>
                        <span style={kpiLabelStyle}>Purchase ROAS</span>
                        <strong style={{ ...kpiValueStyle, color: "#16A34A" }}>
                          {formatMetric(adset.purchase_roas ?? adset.roas, "roas")}
                        </strong>
                      </div>
                      <div>
                        <span style={kpiLabelStyle}>Impressions</span>
                        <strong style={kpiValueStyle}>{formatMetric(adset.impressions, "number")}</strong>
                      </div>
                    </div>

                    {/* Reach & Clicks */}
                    <div style={kpiCardStyle}>
                      <div>
                        <span style={kpiLabelStyle}>Reach</span>
                        <strong style={kpiValueStyle}>{formatMetric(adset.reach, "number")}</strong>
                      </div>
                      <div>
                        <span style={kpiLabelStyle}>Clicks</span>
                        <strong style={kpiValueStyle}>{formatMetric(adset.clicks, "number")}</strong>
                      </div>
                    </div>

                    {/* Add to Cart & Checkout Initiated */}
                    <div style={kpiCardStyle}>
                      <div>
                        <span style={kpiLabelStyle}>Add to Cart</span>
                        <strong style={kpiValueStyle}>{formatMetric(adset.actions_add_to_cart ?? adset.add_to_cart, "number")}</strong>
                      </div>
                      <div>
                        <span style={kpiLabelStyle}>Checkout Initiated</span>
                        <strong style={kpiValueStyle}>{formatMetric(adset.actions_initiate_checkout ?? adset.initiate_checkout, "number")}</strong>
                      </div>
                    </div>

                    {/* CTR & Unique Outbound CTR */}
                    <div style={kpiCardStyle}>
                      <div>
                        <span style={kpiLabelStyle}>CTR</span>
                        <strong style={{ ...kpiValueStyle, color: "#1683FF" }}>{formatMetric(adset.ctr, "percentage")}</strong>
                      </div>
                      <div>
                        <span style={kpiLabelStyle}>Unique Outbound CTR</span>
                        <strong style={{ ...kpiValueStyle, color: "#1683FF" }}>
                          {formatMetric(adset.unique_outbound_clicks_ctr_outbound_click ?? adset.unique_outbound_clicks_ctr, "percentage")}
                        </strong>
                      </div>
                    </div>

                    {/* CPC & CPM */}
                    <div style={kpiCardStyle}>
                      <div>
                        <span style={kpiLabelStyle}>CPC</span>
                        <strong style={kpiValueStyle}>{formatMetric(adset.cpc, "currency", currency)}</strong>
                      </div>
                      <div>
                        <span style={kpiLabelStyle}>CPM</span>
                        <strong style={kpiValueStyle}>{formatMetric(adset.cpm, "currency", currency)}</strong>
                      </div>
                    </div>

                    {/* Frequency */}
                    <div style={kpiCardStyle}>
                      <div>
                        <span style={kpiLabelStyle}>Frequency</span>
                        <strong style={kpiValueStyle}>{formatMetric(adset.frequency, "decimal")}</strong>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </aside>
    </div>
  );
};

const kpiCardStyle = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "12px",
  padding: "16px",
  borderRadius: "12px",
  border: "1px solid #E5EAF0",
  backgroundColor: "#FFFFFF",
};

const kpiLabelStyle = {
  fontSize: "11px",
  color: "#64748B",
  display: "block",
  marginBottom: "2px",
};

const kpiValueStyle = {
  fontSize: "16px",
  color: "#0F172A",
  fontWeight: "700",
};

export default AdSetDetailsDrawer;
