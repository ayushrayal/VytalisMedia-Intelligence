import React, { useState, useEffect, useRef, useMemo } from "react";
import { getCampaignDetails } from "../services/meta.api.js";
import StatusBadge from "./StatusBadge.jsx";
import AdSetAccordionList from "./AdSetAccordionList.jsx";
import Skeleton from "../../../components/ui/Skeleton.jsx";
import ContextualLoader, { usePageLoading } from "../../../components/ui/ContextualLoader.jsx";
import ErrorState from "../../../components/ui/ErrorState.jsx";
import { X, Image as ImageIcon, Layers, BarChart3, ChevronRight } from "lucide-react";
import { formatCurrency } from "../../../utils/formatCurrency.js";
import { formatNumber } from "../../../utils/formatNumber.js";
import { formatPercentage } from "../../../utils/formatPercentage.js";
import { getErrorMessage } from "../../../utils/error.js";

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
 * Normalizes effective status string to determine if creative is 'active' or 'inactive'.
 */
const normalizeCreativeStatus = (cr) => {
  const raw = (cr.effective_status || cr.status || cr.creative_status || "").toString().toLowerCase();
  return raw === "active" ? "active" : "inactive";
};

/**
 * CampaignDetailsDrawer Component.
 * Vytalis Intelligence Light-Theme Drawer for Meta Campaign details.
 * Features:
 * - Clean Light Theme design system (#FFFFFF, #F8FAFC, #E5EAF0)
 * - Single-open expandable Ad Set accordion list (<AdSetAccordionList />) starting collapsed
 * - Creatives tab with segmented [All | Active | Inactive] status filter
 * - Single-open parent-controlled creative expansion state
 * - 2-column compact light creative cards triggering existing CreativeDetailsDrawer
 * - Light theme Campaign Performance overview grid
 */
export const CampaignDetailsDrawer = ({
  campaignId,
  isOpen,
  onClose,
  dateParams = {},
  onSelectCreative,
}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { isDisplayLoading, handleComplete } = usePageLoading(loading);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("adsets"); // "adsets" | "creatives" | "performance"

  // Creatives Tab State: Status Filter & Single-Open Expansion
  const [creativeStatusFilter, setCreativeStatusFilter] = useState("all"); // "all" | "active" | "inactive"
  const [expandedCreativeId, setExpandedCreativeId] = useState(null);

  const contentRef = useRef(null);

  // Fetch campaign details on drawer open or campaignId / dateParams change
  const fetchDetails = async () => {
    if (!campaignId) return;
    try {
      setLoading(true);
      setError(null);
      const res = await getCampaignDetails(campaignId, dateParams);
      if (res && res.data) {
        setData(res.data);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && campaignId) {
      setActiveTab("adsets");
      setCreativeStatusFilter("all");
      setExpandedCreativeId(null);
      fetchDetails();
    }
  }, [isOpen, campaignId, dateParams]);

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

  const campaign = data?.campaign || {};
  const adSets = data?.adSets || [];
  const creatives = data?.creatives || [];
  const performance = data?.performance || {};
  const currency = campaign.currency || performance.currency || "INR";

  // Filtered creatives list based on selected status filter
  const filteredCreatives = useMemo(() => {
    if (creativeStatusFilter === "all") return creatives;
    return creatives.filter((cr) => {
      const status = normalizeCreativeStatus(cr);
      if (creativeStatusFilter === "active") return status === "active";
      if (creativeStatusFilter === "inactive") return status !== "active";
      return true;
    });
  }, [creatives, creativeStatusFilter]);

  // Auto-collapse expanded creative if it disappears from filtered results
  useEffect(() => {
    if (
      expandedCreativeId &&
      !filteredCreatives.some((cr) => (cr.ad_id || cr.id) === expandedCreativeId)
    ) {
      setExpandedCreativeId(null);
    }
  }, [filteredCreatives, expandedCreativeId]);

  const handleCreativeToggle = (id) => {
    setExpandedCreativeId((currentId) => (currentId === id ? null : id));
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Campaign Details"
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
      {/* Light Backdrop */}
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
            {loading ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <Skeleton height="24px" width="70%" />
                <Skeleton height="16px" width="40%" />
              </div>
            ) : (
              <>
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
                    {campaign.name || "Campaign Details"}
                  </h3>
                  <StatusBadge status={campaign.status || "ACTIVE"} />
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap", fontSize: "12px", color: "#64748B" }}>
                  {campaign.objective && (
                    <span>
                      <strong style={{ color: "#0F172A" }}>Objective:</strong> {campaign.objective}
                    </span>
                  )}
                  <span>
                    <strong style={{ color: "#0F172A" }}>Campaign ID:</strong> {campaign.id || campaignId}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* X Close Button */}
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
            { id: "adsets", label: `Ad Sets ${adSets.length ? `(${adSets.length})` : ""}`, icon: Layers },
            { id: "creatives", label: `Creatives ${creatives.length ? `(${creatives.length})` : ""}`, icon: ImageIcon },
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
              <ContextualLoader isLoading={loading} onComplete={handleComplete} label="Loading Campaign Details" minHeight="auto" />
              <Skeleton height="100px" />
              <Skeleton height="180px" />
            </div>
          ) : error ? (
            <ErrorState message="Unable to load campaign details" onRetry={fetchDetails} />
          ) : (
            <>
              {/* TAB 1: AD SETS (SINGLE-OPEN LIGHT ACCORDION LIST) */}
              {activeTab === "adsets" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <h4 style={{ margin: 0, fontSize: "15px", fontWeight: "700", color: "#0F172A" }}>
                      Ad Sets ({adSets.length})
                    </h4>
                  </div>

                  <AdSetAccordionList adSets={adSets} currency={currency} />
                </div>
              )}

              {/* TAB 2: CREATIVES LIST WITH STATUS FILTER */}
              {activeTab === "creatives" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {/* Top Bar: Title & Compact Status Filter */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
                    <h4 style={{ margin: 0, fontSize: "15px", fontWeight: "700", color: "#0F172A" }}>
                      Campaign Ad Creatives ({filteredCreatives.length})
                    </h4>

                    {/* Segmented Status Control [ All | Active | Inactive ] */}
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontSize: "12px", color: "#64748B", fontWeight: "500" }}>Status:</span>
                      <div style={{ display: "inline-flex", backgroundColor: "#E2E8F0", borderRadius: "8px", padding: "2px" }}>
                        {[
                          { key: "all", label: "All" },
                          { key: "active", label: "Active" },
                          { key: "inactive", label: "Inactive" },
                        ].map((filterOpt) => {
                          const isSelected = creativeStatusFilter === filterOpt.key;
                          return (
                            <button
                              key={filterOpt.key}
                              type="button"
                              onClick={() => setCreativeStatusFilter(filterOpt.key)}
                              style={{
                                padding: "4px 10px",
                                borderRadius: "6px",
                                border: "none",
                                backgroundColor: isSelected ? "#FFFFFF" : "transparent",
                                color: isSelected ? "#1683FF" : "#64748B",
                                fontSize: "12px",
                                fontWeight: isSelected ? "600" : "500",
                                boxShadow: isSelected ? "0 1px 2px rgba(15, 23, 42, 0.08)" : "none",
                                cursor: "pointer",
                                transition: "all 0.15s ease",
                              }}
                            >
                              {filterOpt.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {filteredCreatives.length === 0 ? (
                    <div
                      style={{
                        padding: "32px",
                        textAlign: "center",
                        backgroundColor: "#FFFFFF",
                        borderRadius: "12px",
                        border: "1px dashed #E5EAF0",
                        color: "#64748B",
                        fontSize: "13px",
                      }}
                    >
                      No creative assets match the selected status filter.
                    </div>
                  ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "14px" }}>
                      {filteredCreatives.map((cr, idx) => {
                        const creativeId = cr.ad_id || cr.id || `cr-${idx}`;
                        const reactKey = `${cr.ad_id || cr.id || "cr"}-${cr.date || ""}-${idx}`;
                        const isExpanded = expandedCreativeId === creativeId;
                        const img = cr.thumbnail_url || cr.image_url;

                        return (
                          <div
                            key={reactKey}
                            style={{
                              backgroundColor: "#FFFFFF",
                              borderRadius: "12px",
                              border: isExpanded ? "1px solid #1683FF" : "1px solid #E5EAF0",
                              overflow: "hidden",
                              display: "flex",
                              flexDirection: "column",
                              boxShadow: isExpanded ? "0 4px 12px rgba(22, 131, 255, 0.12)" : "0 1px 3px rgba(15, 23, 42, 0.03)",
                              transition: "all 0.15s ease",
                            }}
                          >
                            {/* Card Media Header */}
                            <div
                              onClick={() => handleCreativeToggle(creativeId)}
                              style={{ cursor: "pointer", position: "relative" }}
                            >
                              {img ? (
                                <img src={img} alt={cr.ad_name || "Creative"} style={{ width: "100%", height: "130px", objectFit: "cover" }} />
                              ) : (
                                <div
                                  style={{
                                    width: "100%",
                                    height: "120px",
                                    backgroundColor: "#F1F5F9",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: "#64748B",
                                    fontSize: "12px",
                                    gap: "6px",
                                  }}
                                >
                                  <ImageIcon size={16} />
                                  Asset Preview
                                </div>
                              )}
                            </div>

                            {/* Card Info Body */}
                            <div style={{ padding: "14px", display: "flex", flexDirection: "column", gap: "10px", flex: 1 }}>
                              <div
                                onClick={() => handleCreativeToggle(creativeId)}
                                style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px", cursor: "pointer" }}
                              >
                                <span
                                  style={{
                                    fontWeight: "600",
                                    fontSize: "13.5px",
                                    color: "#0F172A",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                    flex: 1,
                                  }}
                                  title={cr.ad_name || "Unnamed Creative"}
                                >
                                  {cr.ad_name || "Unnamed Creative"}
                                </span>
                                <StatusBadge status={cr.effective_status} />
                              </div>

                              <div
                                style={{
                                  display: "grid",
                                  gridTemplateColumns: "1fr 1fr",
                                  gap: "8px",
                                  padding: "10px",
                                  borderRadius: "8px",
                                  backgroundColor: "#F7F9FC",
                                  border: "1px solid #E7ECF2",
                                }}
                              >
                                <div>
                                  <span style={{ color: "#718096", fontSize: "11px", display: "block" }}>Spend</span>
                                  <strong style={{ color: "#0F172A", fontSize: "13.5px" }}>{formatMetric(cr.spend, "currency", currency)}</strong>
                                </div>
                                <div>
                                  <span style={{ color: "#718096", fontSize: "11px", display: "block" }}>Cost / Result</span>
                                  <strong style={{ color: "#0F172A", fontSize: "13.5px" }}>{formatMetric(cr.cost_per_result, "currency", currency)}</strong>
                                </div>
                                <div>
                                  <span style={{ color: "#718096", fontSize: "11px", display: "block" }}>Purchase Value</span>
                                  <strong style={{ color: "#0F172A", fontSize: "13.5px" }}>{formatMetric(cr.purchase_conversion_value, "currency", currency)}</strong>
                                </div>
                                <div>
                                  <span style={{ color: "#718096", fontSize: "11px", display: "block" }}>ROAS</span>
                                  <strong style={{ color: "#16A34A", fontSize: "13.5px" }}>{formatMetric(cr.purchase_roas, "roas")}</strong>
                                </div>
                              </div>

                              {/* View Details button opens existing Creative Details Drawer */}
                              <div
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (onSelectCreative) onSelectCreative(cr);
                                }}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "flex-end",
                                  color: "#1683FF",
                                  fontSize: "12px",
                                  fontWeight: "600",
                                  gap: "2px",
                                  marginTop: "auto",
                                  cursor: "pointer",
                                  paddingTop: "4px",
                                }}
                              >
                                <span>View Details</span>
                                <ChevronRight size={14} />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: CAMPAIGN PERFORMANCE METRICS */}
              {activeTab === "performance" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                  {/* Campaign Metadata Header Card */}
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
                      <span style={{ fontSize: "11px", color: "#64748B", display: "block" }}>Campaign Name</span>
                      <strong style={{ fontSize: "13.5px", color: "#0F172A" }}>{campaign.name || "—"}</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: "11px", color: "#64748B", display: "block" }}>Objective</span>
                      <strong style={{ fontSize: "13.5px", color: "#0F172A" }}>{campaign.objective || "—"}</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: "11px", color: "#64748B", display: "block" }}>Ad Sets</span>
                      <strong style={{ fontSize: "13.5px", color: "#0F172A" }}>{adSets.length}</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: "11px", color: "#64748B", display: "block" }}>Creatives</span>
                      <strong style={{ fontSize: "13.5px", color: "#0F172A" }}>{creatives.length}</strong>
                    </div>
                  </div>

                  {/* 2-Column KPI Grid */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "14px" }}>
                    {/* Spend & Impressions */}
                    <div style={kpiCardStyle}>
                      <div>
                        <span style={kpiLabelStyle}>Total Spend</span>
                        <strong style={kpiValueStyle}>{formatMetric(performance.spend, "currency", currency)}</strong>
                      </div>
                      <div>
                        <span style={kpiLabelStyle}>Impressions</span>
                        <strong style={kpiValueStyle}>{formatMetric(performance.impressions, "number")}</strong>
                      </div>
                    </div>

                    {/* Add to Cart & Checkout Initiated */}
                    <div style={kpiCardStyle}>
                      <div>
                        <span style={kpiLabelStyle}>Add to Cart</span>
                        <strong style={kpiValueStyle}>{formatMetric(performance.actions_add_to_cart, "number")}</strong>
                      </div>
                      <div>
                        <span style={kpiLabelStyle}>Checkout Initiated</span>
                        <strong style={kpiValueStyle}>{formatMetric(performance.actions_initiate_checkout, "number")}</strong>
                      </div>
                    </div>

                    {/* Reach & Clicks */}
                    <div style={kpiCardStyle}>
                      <div>
                        <span style={kpiLabelStyle}>Reach</span>
                        <strong style={kpiValueStyle}>{formatMetric(performance.reach, "number")}</strong>
                      </div>
                      <div>
                        <span style={kpiLabelStyle}>Clicks</span>
                        <strong style={kpiValueStyle}>{formatMetric(performance.clicks, "number")}</strong>
                      </div>
                    </div>

                    {/* CTR & Unique Outbound CTR */}
                    <div style={kpiCardStyle}>
                      <div>
                        <span style={kpiLabelStyle}>CTR</span>
                        <strong style={{ ...kpiValueStyle, color: "#1683FF" }}>{formatMetric(performance.ctr, "percentage")}</strong>
                      </div>
                      <div>
                        <span style={kpiLabelStyle}>Unique Outbound CTR</span>
                        <strong style={{ ...kpiValueStyle, color: "#1683FF" }}>
                          {formatMetric(performance.unique_outbound_clicks_ctr_outbound_click, "percentage")}
                        </strong>
                      </div>
                    </div>

                    {/* CPC & CPM */}
                    <div style={kpiCardStyle}>
                      <div>
                        <span style={kpiLabelStyle}>CPC</span>
                        <strong style={kpiValueStyle}>{formatMetric(performance.cpc, "currency", currency)}</strong>
                      </div>
                      <div>
                        <span style={kpiLabelStyle}>CPM</span>
                        <strong style={kpiValueStyle}>{formatMetric(performance.cpm, "currency", currency)}</strong>
                      </div>
                    </div>

                    {/* Frequency & Purchases */}
                    <div style={kpiCardStyle}>
                      <div>
                        <span style={kpiLabelStyle}>Frequency</span>
                        <strong style={kpiValueStyle}>{formatMetric(performance.frequency, "decimal")}</strong>
                      </div>
                      <div>
                        <span style={kpiLabelStyle}>Purchases</span>
                        <strong style={kpiValueStyle}>{formatMetric(performance.purchases, "number")}</strong>
                      </div>
                    </div>

                    {/* Purchase Value & Purchase ROAS */}
                    <div style={kpiCardStyle}>
                      <div>
                        <span style={kpiLabelStyle}>Purchase Value</span>
                        <strong style={kpiValueStyle}>{formatMetric(performance.purchase_conversion_value, "currency", currency)}</strong>
                      </div>
                      <div>
                        <span style={kpiLabelStyle}>Purchase ROAS</span>
                        <strong style={{ ...kpiValueStyle, color: "#16A34A" }}>{formatMetric(performance.purchase_roas, "roas")}</strong>
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

export default CampaignDetailsDrawer;
