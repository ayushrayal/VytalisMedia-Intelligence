import React, { useState, useEffect, useRef } from "react";
import { getCampaignDetails } from "../services/meta.api.js";
import StatusBadge from "./StatusBadge.jsx";
import Skeleton from "../../../components/ui/Skeleton.jsx";
import ErrorState from "../../../components/ui/ErrorState.jsx";
import Button from "../../../components/ui/Button.jsx";
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
 * CampaignDetailsDrawer Component.
 * Production-ready right-side drawer for Meta Campaign details with 3 tabs:
 * 1. AD SETS
 * 2. CREATIVES
 * 3. PERFORMANCE
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
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("adsets"); // "adsets" | "creatives" | "performance"
  const [showAllAdSets, setShowAllAdSets] = useState(false);
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
      setShowAllAdSets(false);
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

  if (!isOpen) return null;

  const campaign = data?.campaign || {};
  const adSets = data?.adSets || [];
  const creatives = data?.creatives || [];
  const performance = data?.performance || {};
  const currency = campaign.currency || performance.currency || "INR";

  const displayedAdSets = showAllAdSets ? adSets : adSets.slice(0, 10);

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
      {/* Semi-transparent Backdrop */}
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
          maxWidth: "780px",
          height: "100vh",
          backgroundColor: "#FFFFFF",
          borderLeft: "1px solid var(--color-border, #E8EAED)",
          boxShadow: "-10px 0 30px rgba(15, 23, 42, 0.1)",
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
            padding: "20px 24px",
            borderBottom: "1px solid var(--color-border, #E8EAED)",
            backgroundColor: "#FFFFFF",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "16px",
            position: "sticky",
            top: 0,
            zIndex: 10,
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
                <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", marginBottom: "6px" }}>
                  <h3
                    style={{
                      margin: 0,
                      fontSize: "1.25rem",
                      fontWeight: "700",
                      color: "var(--color-text-primary, #111827)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {campaign.name || "Campaign Details"}
                  </h3>
                  <StatusBadge status={campaign.status || "ACTIVE"} />
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap", fontSize: "0.85rem", color: "var(--color-text-secondary, #64748B)" }}>
                  {campaign.objective && (
                    <span>
                      <strong>Objective:</strong> {campaign.objective}
                    </span>
                  )}
                  <span>
                    <strong>Campaign ID:</strong> {campaign.id || campaignId}
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
              border: "1px solid var(--color-border, #E8EAED)",
              backgroundColor: "var(--color-surface, #F7F9FC)",
              color: "var(--color-text-secondary, #64748B)",
              fontSize: "1.2rem",
              fontWeight: "bold",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.15s ease",
            }}
          >
            ×
          </button>
        </div>

        {/* STICKY TAB NAVIGATION */}
        <div
          style={{
            display: "flex",
            borderBottom: "1px solid var(--color-border, #E8EAED)",
            backgroundColor: "#FFFFFF",
            padding: "0 24px",
            position: "sticky",
            top: "85px",
            zIndex: 9,
          }}
        >
          {[
            { id: "adsets", label: `Ad Sets ${adSets.length ? `(${adSets.length})` : ""}` },
            { id: "creatives", label: `Creatives ${creatives.length ? `(${creatives.length})` : ""}` },
            { id: "performance", label: "Performance" },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: "14px 20px",
                  border: "none",
                  borderBottom: isActive ? "2px solid #0A84FF" : "2px solid transparent",
                  backgroundColor: isActive ? "rgba(10, 132, 255, 0.04)" : "transparent",
                  color: isActive ? "#0A84FF" : "var(--color-text-secondary, #64748B)",
                  fontWeight: isActive ? "700" : "500",
                  fontSize: "0.9rem",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  outline: "none",
                }}
              >
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
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: "20px",
          }}
        >
          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <Skeleton height="140px" />
              <Skeleton height="200px" />
            </div>
          ) : error ? (
            <ErrorState message="Unable to load campaign details" onRetry={fetchDetails} />
          ) : (
            <>
              {/* TAB 1: AD SETS */}
              {activeTab === "adsets" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <h4 style={{ margin: 0, fontSize: "1.05rem", fontWeight: "700", color: "var(--color-text-primary, #111827)" }}>
                      Ad Sets ({adSets.length})
                    </h4>
                  </div>

                  {adSets.length === 0 ? (
                    <div
                      style={{
                        padding: "40px 20px",
                        textAlign: "center",
                        backgroundColor: "var(--color-surface, #F7F9FC)",
                        borderRadius: "12px",
                        border: "1px solid var(--color-border, #E8EAED)",
                        color: "var(--color-text-secondary, #64748B)",
                      }}
                    >
                      No ad sets found for this campaign.
                    </div>
                  ) : (
                    <div
                      style={{
                        backgroundColor: "#FFFFFF",
                        borderRadius: "14px",
                        border: "1px solid var(--color-border, #E8EAED)",
                        overflow: "hidden",
                        boxShadow: "var(--shadow-subtle, 0 2px 8px rgba(15, 23, 42, 0.04))",
                      }}
                    >
                      <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
                          <thead>
                            <tr style={{ borderBottom: "1px solid var(--color-border, #E8EAED)", backgroundColor: "var(--color-surface, #F7F9FC)", color: "var(--color-text-secondary, #64748B)", textAlign: "left" }}>
                              <th style={{ padding: "12px 16px" }}>Ad Set Name</th>
                              <th style={{ padding: "12px 16px" }}>Status</th>
                              <th style={{ padding: "12px 16px", textAlign: "right" }}>Spend</th>
                              <th style={{ padding: "12px 16px", textAlign: "right" }}>Impressions</th>
                              <th style={{ padding: "12px 16px", textAlign: "right" }}>Reach</th>
                              <th style={{ padding: "12px 16px", textAlign: "right" }}>Clicks</th>
                              <th style={{ padding: "12px 16px", textAlign: "right" }}>CTR</th>
                              <th style={{ padding: "12px 16px", textAlign: "right" }}>CPC</th>
                            </tr>
                          </thead>
                          <tbody>
                            {displayedAdSets.map((adset, idx) => (
                              <tr key={adset.id || idx} style={{ borderBottom: "1px solid var(--color-border, #E8EAED)" }}>
                                <td style={{ padding: "12px 16px", fontWeight: "600", color: "var(--color-text-primary, #111827)" }}>
                                  {adset.name}
                                  {adset.id && (
                                    <span style={{ display: "block", fontSize: "0.75rem", fontWeight: "normal", color: "var(--color-text-muted, #94A3B8)" }}>
                                      ID: {adset.id}
                                    </span>
                                  )}
                                </td>
                                <td style={{ padding: "12px 16px" }}>
                                  <StatusBadge status={adset.status} />
                                </td>
                                <td style={{ padding: "12px 16px", fontWeight: "600", textAlign: "right" }}>
                                  {formatMetric(adset.spend, "currency", currency)}
                                </td>
                                <td style={{ padding: "12px 16px", textAlign: "right" }}>
                                  {formatMetric(adset.impressions, "number")}
                                </td>
                                <td style={{ padding: "12px 16px", textAlign: "right" }}>
                                  {formatMetric(adset.reach, "number")}
                                </td>
                                <td style={{ padding: "12px 16px", textAlign: "right" }}>
                                  {formatMetric(adset.clicks, "number")}
                                </td>
                                <td style={{ padding: "12px 16px", fontWeight: "600", textAlign: "right" }}>
                                  {formatMetric(adset.ctr, "percentage")}
                                </td>
                                <td style={{ padding: "12px 16px", fontWeight: "600", textAlign: "right" }}>
                                  {formatMetric(adset.cpc, "currency", currency)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {adSets.length > 10 && !showAllAdSets && (
                        <div style={{ padding: "12px 16px", textAlign: "center", backgroundColor: "var(--color-surface, #F7F9FC)", borderTop: "1px solid var(--color-border, #E8EAED)" }}>
                          <Button variant="outline" onClick={() => setShowAllAdSets(true)}>
                            View All Ad Sets ({adSets.length}) →
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: CREATIVES */}
              {activeTab === "creatives" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <h4 style={{ margin: 0, fontSize: "1.05rem", fontWeight: "700", color: "var(--color-text-primary, #111827)" }}>
                      Creatives ({creatives.length})
                    </h4>
                  </div>

                  {creatives.length === 0 ? (
                    <div
                      style={{
                        padding: "40px 20px",
                        textAlign: "center",
                        backgroundColor: "var(--color-surface, #F7F9FC)",
                        borderRadius: "12px",
                        border: "1px solid var(--color-border, #E8EAED)",
                        color: "var(--color-text-secondary, #64748B)",
                      }}
                    >
                      No creatives found for this campaign.
                    </div>
                  ) : (
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                        gap: "16px",
                      }}
                    >
                      {creatives.map((cr, idx) => {
                        const mediaUrl = cr.image_url || cr.thumbnail_url;
                        const isVideo = Boolean(
                          cr.video_id ||
                            cr.video_play_actions ||
                            cr.video_avg_time_watched_actions ||
                            (cr.ad_name && cr.ad_name.toLowerCase().includes("video"))
                        );

                        return (
                          <div
                            key={cr.id || idx}
                            onClick={() => onSelectCreative && onSelectCreative(cr)}
                            style={{
                              backgroundColor: "#FFFFFF",
                              borderRadius: "14px",
                              border: "1px solid var(--color-border, #E8EAED)",
                              overflow: "hidden",
                              display: "flex",
                              flexDirection: "column",
                              boxShadow: "var(--shadow-subtle, 0 2px 8px rgba(15, 23, 42, 0.04))",
                              cursor: "pointer",
                              transition: "transform 0.15s ease, box-shadow 0.15s ease",
                            }}
                          >
                            {/* Media Preview Box */}
                            <div style={{ position: "relative", width: "100%", height: "140px", backgroundColor: "#F1F5F9" }}>
                              {mediaUrl ? (
                                <img
                                  src={mediaUrl}
                                  alt={cr.ad_name || "Creative"}
                                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                  onError={(e) => {
                                    e.target.style.display = "none";
                                  }}
                                />
                              ) : (
                                <div
                                  style={{
                                    width: "100%",
                                    height: "100%",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: "var(--color-text-muted, #94A3B8)",
                                    fontSize: "0.85rem",
                                    fontWeight: "600",
                                    background: "linear-gradient(135deg, #F7F9FC, #EAF3FF)",
                                  }}
                                >
                                  🎨 Media Preview
                                </div>
                              )}

                              {/* Video Play Indicator */}
                              {isVideo && (
                                <div
                                  style={{
                                    position: "absolute",
                                    inset: 0,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    backgroundColor: "rgba(15, 23, 42, 0.3)",
                                  }}
                                >
                                  <div
                                    style={{
                                      width: "36px",
                                      height: "36px",
                                      borderRadius: "50%",
                                      backgroundColor: "rgba(255, 255, 255, 0.9)",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      color: "#0A84FF",
                                      fontSize: "1rem",
                                      fontWeight: "bold",
                                      paddingLeft: "2px",
                                      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)",
                                    }}
                                  >
                                    ▶
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Creative Information */}
                            <div style={{ padding: "14px", display: "flex", flexDirection: "column", gap: "8px", flex: 1 }}>
                              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "6px" }}>
                                <h5
                                  style={{
                                    margin: 0,
                                    fontSize: "0.9rem",
                                    fontWeight: "700",
                                    color: "var(--color-text-primary, #111827)",
                                    lineHeight: "1.3",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    display: "-webkit-box",
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: "vertical",
                                  }}
                                >
                                  {cr.ad_name || "Unnamed Creative"}
                                </h5>
                                <StatusBadge status={cr.effective_status} />
                              </div>

                              <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted, #94A3B8)" }}>
                                ID: {cr.ad_id || cr.id}
                              </div>

                              {/* KPI Grid */}
                              <div
                                style={{
                                  display: "grid",
                                  gridTemplateColumns: "1fr 1fr",
                                  gap: "8px",
                                  marginTop: "4px",
                                  padding: "10px",
                                  borderRadius: "10px",
                                  backgroundColor: "var(--color-surface, #F7F9FC)",
                                  fontSize: "0.8rem",
                                }}
                              >
                                <div>
                                  <span style={{ color: "var(--color-text-muted, #94A3B8)", fontSize: "0.7rem", display: "block" }}>Spend</span>
                                  <strong style={{ color: "var(--color-text-primary, #111827)" }}>{formatMetric(cr.spend, "currency", currency)}</strong>
                                </div>
                                <div>
                                  <span style={{ color: "var(--color-text-muted, #94A3B8)", fontSize: "0.7rem", display: "block" }}>Clicks</span>
                                  <strong style={{ color: "var(--color-text-primary, #111827)" }}>{formatMetric(cr.clicks, "number")}</strong>
                                </div>
                                <div>
                                  <span style={{ color: "var(--color-text-muted, #94A3B8)", fontSize: "0.7rem", display: "block" }}>CTR</span>
                                  <strong style={{ color: "var(--color-text-primary, #111827)" }}>{formatMetric(cr.ctr, "percentage")}</strong>
                                </div>
                                <div>
                                  <span style={{ color: "var(--color-text-muted, #94A3B8)", fontSize: "0.7rem", display: "block" }}>CPC</span>
                                  <strong style={{ color: "var(--color-text-primary, #111827)" }}>{formatMetric(cr.cpc, "currency", currency)}</strong>
                                </div>
                              </div>

                              {/* External Permalink Links */}
                              {(cr.facebook_permalink_url || cr.instagram_permalink_url) && (
                                <div
                                  style={{
                                    display: "flex",
                                    gap: "8px",
                                    marginTop: "4px",
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {cr.facebook_permalink_url && (
                                    <a
                                      href={cr.facebook_permalink_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      style={{
                                        fontSize: "0.72rem",
                                        color: "#0A84FF",
                                        textDecoration: "none",
                                        fontWeight: "600",
                                      }}
                                    >
                                      Facebook ↗
                                    </a>
                                  )}
                                  {cr.instagram_permalink_url && (
                                    <a
                                      href={cr.instagram_permalink_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      style={{
                                        fontSize: "0.72rem",
                                        color: "#E1306C",
                                        textDecoration: "none",
                                        fontWeight: "600",
                                      }}
                                    >
                                      Instagram ↗
                                    </a>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: PERFORMANCE */}
              {activeTab === "performance" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                  {/* Compact Campaign Summary */}
                  <div
                    style={{
                      padding: "18px",
                      borderRadius: "14px",
                      backgroundColor: "var(--color-surface, #F7F9FC)",
                      border: "1px solid var(--color-border, #E8EAED)",
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                      gap: "14px",
                    }}
                  >
                    <div>
                      <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted, #94A3B8)", display: "block" }}>Campaign Name</span>
                      <strong style={{ fontSize: "0.9rem", color: "var(--color-text-primary, #111827)" }}>{campaign.name || "—"}</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted, #94A3B8)", display: "block" }}>Objective</span>
                      <strong style={{ fontSize: "0.9rem", color: "var(--color-text-primary, #111827)" }}>{campaign.objective || "—"}</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted, #94A3B8)", display: "block" }}>Ad Sets</span>
                      <strong style={{ fontSize: "0.9rem", color: "var(--color-text-primary, #111827)" }}>{adSets.length}</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted, #94A3B8)", display: "block" }}>Creatives</span>
                      <strong style={{ fontSize: "0.9rem", color: "var(--color-text-primary, #111827)" }}>{creatives.length}</strong>
                    </div>
                  </div>

                  {/* 2-Column KPI Grid */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
                    {/* Spend & Impressions */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", padding: "16px", borderRadius: "14px", border: "1px solid var(--color-border, #E8EAED)", backgroundColor: "#FFFFFF" }}>
                      <div>
                        <span style={{ fontSize: "0.78rem", color: "var(--color-text-muted, #94A3B8)", display: "block" }}>Total Spend</span>
                        <strong style={{ fontSize: "1.15rem", color: "var(--color-text-primary, #111827)", fontWeight: "700" }}>
                          {formatMetric(performance.spend, "currency", currency)}
                        </strong>
                      </div>
                      <div>
                        <span style={{ fontSize: "0.78rem", color: "var(--color-text-muted, #94A3B8)", display: "block" }}>Impressions</span>
                        <strong style={{ fontSize: "1.15rem", color: "var(--color-text-primary, #111827)", fontWeight: "700" }}>
                          {formatMetric(performance.impressions, "number")}
                        </strong>
                      </div>
                    </div>

                    {/* Reach & Clicks */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", padding: "16px", borderRadius: "14px", border: "1px solid var(--color-border, #E8EAED)", backgroundColor: "#FFFFFF" }}>
                      <div>
                        <span style={{ fontSize: "0.78rem", color: "var(--color-text-muted, #94A3B8)", display: "block" }}>Reach</span>
                        <strong style={{ fontSize: "1.15rem", color: "var(--color-text-primary, #111827)", fontWeight: "700" }}>
                          {formatMetric(performance.reach, "number")}
                        </strong>
                      </div>
                      <div>
                        <span style={{ fontSize: "0.78rem", color: "var(--color-text-muted, #94A3B8)", display: "block" }}>Clicks</span>
                        <strong style={{ fontSize: "1.15rem", color: "var(--color-text-primary, #111827)", fontWeight: "700" }}>
                          {formatMetric(performance.clicks, "number")}
                        </strong>
                      </div>
                    </div>

                    {/* CTR & CPC */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", padding: "16px", borderRadius: "14px", border: "1px solid var(--color-border, #E8EAED)", backgroundColor: "#FFFFFF" }}>
                      <div>
                        <span style={{ fontSize: "0.78rem", color: "var(--color-text-muted, #94A3B8)", display: "block" }}>CTR</span>
                        <strong style={{ fontSize: "1.15rem", color: "#0A84FF", fontWeight: "700" }}>
                          {formatMetric(performance.ctr, "percentage")}
                        </strong>
                      </div>
                      <div>
                        <span style={{ fontSize: "0.78rem", color: "var(--color-text-muted, #94A3B8)", display: "block" }}>CPC</span>
                        <strong style={{ fontSize: "1.15rem", color: "var(--color-text-primary, #111827)", fontWeight: "700" }}>
                          {formatMetric(performance.cpc, "currency", currency)}
                        </strong>
                      </div>
                    </div>

                    {/* CPM & Frequency */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", padding: "16px", borderRadius: "14px", border: "1px solid var(--color-border, #E8EAED)", backgroundColor: "#FFFFFF" }}>
                      <div>
                        <span style={{ fontSize: "0.78rem", color: "var(--color-text-muted, #94A3B8)", display: "block" }}>CPM</span>
                        <strong style={{ fontSize: "1.15rem", color: "var(--color-text-primary, #111827)", fontWeight: "700" }}>
                          {formatMetric(performance.cpm, "currency", currency)}
                        </strong>
                      </div>
                      <div>
                        <span style={{ fontSize: "0.78rem", color: "var(--color-text-muted, #94A3B8)", display: "block" }}>Frequency</span>
                        <strong style={{ fontSize: "1.15rem", color: "var(--color-text-primary, #111827)", fontWeight: "700" }}>
                          {formatMetric(performance.frequency, "decimal")}
                        </strong>
                      </div>
                    </div>

                    {/* Purchases & Purchase Value */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", padding: "16px", borderRadius: "14px", border: "1px solid var(--color-border, #E8EAED)", backgroundColor: "#FFFFFF" }}>
                      <div>
                        <span style={{ fontSize: "0.78rem", color: "var(--color-text-muted, #94A3B8)", display: "block" }}>Purchases</span>
                        <strong style={{ fontSize: "1.15rem", color: "var(--color-text-primary, #111827)", fontWeight: "700" }}>
                          {formatMetric(performance.purchases, "number")}
                        </strong>
                      </div>
                      <div>
                        <span style={{ fontSize: "0.78rem", color: "var(--color-text-muted, #94A3B8)", display: "block" }}>Purchase Value</span>
                        <strong style={{ fontSize: "1.15rem", color: "var(--color-text-primary, #111827)", fontWeight: "700" }}>
                          {formatMetric(performance.purchase_conversion_value, "currency", currency)}
                        </strong>
                      </div>
                    </div>

                    {/* Cost Per Result & Purchase ROAS */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", padding: "16px", borderRadius: "14px", border: "1px solid var(--color-border, #E8EAED)", backgroundColor: "#FFFFFF" }}>
                      <div>
                        <span style={{ fontSize: "0.78rem", color: "var(--color-text-muted, #94A3B8)", display: "block" }}>Cost Per Result</span>
                        <strong style={{ fontSize: "1.15rem", color: "var(--color-text-primary, #111827)", fontWeight: "700" }}>
                          {formatMetric(performance.cost_per_result, "currency", currency)}
                        </strong>
                      </div>
                      <div>
                        <span style={{ fontSize: "0.78rem", color: "var(--color-text-muted, #94A3B8)", display: "block" }}>Purchase ROAS</span>
                        <strong style={{ fontSize: "1.15rem", color: "#16A34A", fontWeight: "700" }}>
                          {formatMetric(performance.purchase_roas, "roas")}
                        </strong>
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

export default CampaignDetailsDrawer;
