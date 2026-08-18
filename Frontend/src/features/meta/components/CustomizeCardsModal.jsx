import React, { useState, useEffect } from "react";
import { X, Check, RotateCcw, Sliders, Info, Sparkles, Video, Image as ImageIcon, ExternalLink } from "lucide-react";
import {
  CREATIVE_PRIMARY_KPIS,
  CREATIVE_VIDEO_KPIS,
  DEFAULT_CREATIVE_CARD_PREFERENCES,
  PRIMARY_KPI_LIMIT,
  VIDEO_KPI_LIMIT,
  ALL_CREATIVE_KPIS_MAP,
  formatKpiDisplayValue,
} from "../config/creativeKpis.config.js";

const MOCK_PREVIEW_CREATIVE = {
  ad_name: "VM | 001 | Winning Founder's Video",
  campaign: "VM | Phoolwari | CBO",
  effective_status: "ACTIVE",
  media_type: "VIDEO",
  video_id: "3613053185502158",
  thumbnail_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
  facebook_permalink_url: "https://facebook.com",
  instagram_permalink_url: "https://instagram.com",
  spend: 18841.5,
  purchases: 10,
  purchase_conversion_value: 31000,
  purchase_roas: 1.58,
  cost_per_result: 1884.15,
  ctr: 2.19,
  cpc: 15.01,
  cpm: 329.0,
  impressions: 57268,
  reach: 38830,
  frequency: 1.47,
  clicks: 1255,
  link_clicks: 840,
  actions_add_to_cart: 42,
  actions_initiate_checkout: 18,
  actions_video_view: 6012,
  video_thruplay_watched_actions_video_view: 1204,
  hook_rate: 9.07,
  hold_rate: 19.93,
  video_avg_time_watched_actions_video_view: 3.2,
};

export const CustomizeCardsModal = ({ isOpen, onClose, currentPreferences, onSave }) => {
  const [draftPrimary, setDraftPrimary] = useState(
    currentPreferences?.primaryMetrics || DEFAULT_CREATIVE_CARD_PREFERENCES.primaryMetrics
  );
  const [draftVideo, setDraftVideo] = useState(
    currentPreferences?.videoMetrics || DEFAULT_CREATIVE_CARD_PREFERENCES.videoMetrics
  );
  const [draftShowFb, setDraftShowFb] = useState(
    currentPreferences?.showFacebookLink ?? DEFAULT_CREATIVE_CARD_PREFERENCES.showFacebookLink
  );
  const [draftShowIg, setDraftShowIg] = useState(
    currentPreferences?.showInstagramLink ?? DEFAULT_CREATIVE_CARD_PREFERENCES.showInstagramLink
  );
  const [draftShowHookHold, setDraftShowHookHold] = useState(
    currentPreferences?.showHookHoldRates ?? DEFAULT_CREATIVE_CARD_PREFERENCES.showHookHoldRates
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setDraftPrimary(currentPreferences?.primaryMetrics || DEFAULT_CREATIVE_CARD_PREFERENCES.primaryMetrics);
      setDraftVideo(currentPreferences?.videoMetrics || DEFAULT_CREATIVE_CARD_PREFERENCES.videoMetrics);
      setDraftShowFb(currentPreferences?.showFacebookLink ?? DEFAULT_CREATIVE_CARD_PREFERENCES.showFacebookLink);
      setDraftShowIg(currentPreferences?.showInstagramLink ?? DEFAULT_CREATIVE_CARD_PREFERENCES.showInstagramLink);
      setDraftShowHookHold(currentPreferences?.showHookHoldRates ?? DEFAULT_CREATIVE_CARD_PREFERENCES.showHookHoldRates);
    }
  }, [isOpen, currentPreferences]);

  if (!isOpen) return null;

  const togglePrimary = (id) => {
    if (draftPrimary.includes(id)) {
      setDraftPrimary(draftPrimary.filter((item) => item !== id));
    } else {
      if (draftPrimary.length < PRIMARY_KPI_LIMIT) {
        setDraftPrimary([...draftPrimary, id]);
      }
    }
  };

  const toggleVideo = (id) => {
    if (draftVideo.includes(id)) {
      setDraftVideo(draftVideo.filter((item) => item !== id));
    } else {
      if (draftVideo.length < VIDEO_KPI_LIMIT) {
        setDraftVideo([...draftVideo, id]);
      }
    }
  };

  const handleReset = () => {
    setDraftPrimary(DEFAULT_CREATIVE_CARD_PREFERENCES.primaryMetrics);
    setDraftVideo(DEFAULT_CREATIVE_CARD_PREFERENCES.videoMetrics);
    setDraftShowFb(DEFAULT_CREATIVE_CARD_PREFERENCES.showFacebookLink);
    setDraftShowIg(DEFAULT_CREATIVE_CARD_PREFERENCES.showInstagramLink);
    setDraftShowHookHold(DEFAULT_CREATIVE_CARD_PREFERENCES.showHookHoldRates);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({
        primaryMetrics: draftPrimary,
        videoMetrics: draftVideo,
        showFacebookLink: draftShowFb,
        showInstagramLink: draftShowIg,
        showHookHoldRates: draftShowHookHold,
      });
      onClose();
    } catch (err) {
      console.error("Save preferences failed:", err);
    } finally {
      setSaving(false);
    }
  };

  const isPrimaryLimitReached = draftPrimary.length >= PRIMARY_KPI_LIMIT;
  const isVideoLimitReached = draftVideo.length >= VIDEO_KPI_LIMIT;
  const socialEnabledCount = (draftShowFb ? 1 : 0) + (draftShowIg ? 1 : 0);

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(15, 23, 42, 0.45)",
          backdropFilter: "blur(4px)",
        }}
      />

      {/* Modal Shell */}
      <div
        style={{
          position: "relative",
          zIndex: 1101,
          width: "100%",
          maxWidth: "840px",
          maxHeight: "90vh",
          backgroundColor: "#FFFFFF",
          borderRadius: "16px",
          border: "1px solid var(--color-border, #E5E7EB)",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "18px 24px",
            borderBottom: "1px solid #E5E7EB",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: "#FFFFFF",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                backgroundColor: "rgba(10, 132, 255, 0.1)",
                color: "#0A84FF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Sliders size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: "700", color: "#0F172A" }}>
                Customize Card KPIs & Display
              </h3>
              <p style={{ margin: 0, fontSize: "0.8rem", color: "#64748B" }}>
                Select up to 4 primary KPIs, 2 video metrics, and card display preferences.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              border: "1px solid #E5E7EB",
              backgroundColor: "#FFFFFF",
              color: "#64748B",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div
          style={{
            flex: 1,
            padding: "24px",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: "24px",
          }}
        >
          {/* LIVE PREVIEW BANNER */}
          <div
            style={{
              backgroundColor: "#F8FAFC",
              border: "1px solid #E2E8F0",
              borderRadius: "12px",
              padding: "16px",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <Sparkles size={16} color="#0A84FF" />
                <span style={{ fontSize: "0.85rem", fontWeight: "700", color: "#0F172A" }}>
                  Live Card Preview
                </span>
              </div>
              <span style={{ fontSize: "0.75rem", color: "#64748B" }}>
                Updates dynamically with your selections
              </span>
            </div>

            {/* Mock Live Preview Card */}
            <div
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: "12px",
                border: "1px solid #E5E7EB",
                padding: "12px",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: "600", fontSize: "0.85rem", color: "#0F172A" }}>
                  {MOCK_PREVIEW_CREATIVE.ad_name}
                </span>
                <span style={{ fontSize: "0.7rem", backgroundColor: "rgba(10, 132, 255, 0.1)", color: "#0A84FF", padding: "2px 8px", borderRadius: "999px", fontWeight: "600" }}>
                  Video Creative
                </span>
              </div>

              {/* Dynamic 2-column Grid of Primary Selections */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: draftPrimary.length === 1 ? "1fr" : "1fr 1fr",
                  gap: "8px",
                }}
              >
                {draftPrimary.map((kpiId) => {
                  const kpiDef = ALL_CREATIVE_KPIS_MAP[kpiId];
                  if (!kpiDef) return null;
                  return (
                    <div
                      key={kpiId}
                      style={{
                        backgroundColor: "#F8FAFC",
                        border: "1px solid #F1F5F9",
                        borderRadius: "8px",
                        padding: "6px 10px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "2px",
                      }}
                    >
                      <span style={{ fontSize: "11px", color: "#64748B", fontWeight: "500" }}>
                        {kpiDef.label}
                      </span>
                      <strong style={{ fontSize: "12.5px", color: "#0F172A", fontWeight: "700" }}>
                        {formatKpiDisplayValue(kpiDef, MOCK_PREVIEW_CREATIVE)}
                      </strong>
                    </div>
                  );
                })}
              </div>

              {/* Dynamic Video Metrics Selections */}
              {draftVideo.length > 0 && (
                <div
                  style={{
                    backgroundColor: "#F8FAFC",
                    border: "1px solid #F1F5F9",
                    borderRadius: "8px",
                    padding: "6px 10px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    fontSize: "11px",
                  }}
                >
                  {draftVideo.map((kpiId) => {
                    const kpiDef = ALL_CREATIVE_KPIS_MAP[kpiId];
                    if (!kpiDef) return null;
                    return (
                      <div key={kpiId} style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                        <span style={{ color: "#64748B", fontWeight: "500" }}>{kpiDef.label}:</span>
                        <strong style={{ color: "#8B5CF6", fontWeight: "700" }}>
                          {formatKpiDisplayValue(kpiDef, MOCK_PREVIEW_CREATIVE)}
                        </strong>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Live Preview of Hook & Hold Rate Row */}
              {draftShowHookHold && (
                <div
                  style={{
                    backgroundColor: "#F8FAFC",
                    border: "1px solid #F1F5F9",
                    borderRadius: "8px",
                    padding: "6px 10px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    fontSize: "11px",
                  }}
                >
                  <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                    <span style={{ color: "#64748B", fontWeight: "500" }}>Hook:</span>
                    <strong style={{ color: "#8B5CF6", fontWeight: "700" }}>9.07%</strong>
                  </div>
                  <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                    <span style={{ color: "#64748B", fontWeight: "500" }}>Hold:</span>
                    <strong style={{ color: "#EC4899", fontWeight: "700" }}>19.93%</strong>
                  </div>
                </div>
              )}

              {/* Dynamic Social Links Preview */}
              {(draftShowFb || draftShowIg) && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    paddingTop: "2px",
                  }}
                >
                  {draftShowFb && (
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: "600",
                        color: "#0A84FF",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "3px",
                        padding: "3px 8px",
                        borderRadius: "6px",
                        backgroundColor: "rgba(10, 132, 255, 0.08)",
                      }}
                    >
                      View on Facebook
                      <ExternalLink size={10} />
                    </span>
                  )}

                  {draftShowIg && (
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: "600",
                        color: "#EC4899",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "3px",
                        padding: "3px 8px",
                        borderRadius: "6px",
                        backgroundColor: "rgba(236, 72, 153, 0.08)",
                      }}
                    >
                      View on Instagram
                      <ExternalLink size={10} />
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 1. PRIMARY KPIS SECTION */}
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <h4 style={{ margin: 0, fontSize: "0.9rem", fontWeight: "700", color: "#0F172A" }}>
                  Primary KPIs
                </h4>
                <span
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: "600",
                    padding: "2px 8px",
                    borderRadius: "999px",
                    backgroundColor: isPrimaryLimitReached ? "rgba(239, 68, 68, 0.1)" : "rgba(10, 132, 255, 0.1)",
                    color: isPrimaryLimitReached ? "#EF4444" : "#0A84FF",
                  }}
                >
                  {draftPrimary.length} / {PRIMARY_KPI_LIMIT} Selected
                </span>
              </div>

              {isPrimaryLimitReached && (
                <span style={{ fontSize: "0.75rem", color: "#64748B", display: "flex", alignItems: "center", gap: "4px" }}>
                  <Info size={12} color="#EF4444" /> Maximum {PRIMARY_KPI_LIMIT} primary KPIs selected
                </span>
              )}
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
                gap: "10px",
              }}
            >
              {CREATIVE_PRIMARY_KPIS.map((kpi) => {
                const isSelected = draftPrimary.includes(kpi.id);
                const isDisabled = !isSelected && isPrimaryLimitReached;

                return (
                  <button
                    key={kpi.id}
                    type="button"
                    onClick={() => togglePrimary(kpi.id)}
                    disabled={isDisabled}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px 14px",
                      borderRadius: "10px",
                      border: isSelected
                        ? "1.5px solid #0A84FF"
                        : "1px solid var(--color-border, #E5E7EB)",
                      backgroundColor: isSelected ? "rgba(10, 132, 255, 0.04)" : "#FFFFFF",
                      cursor: isDisabled ? "not-allowed" : "pointer",
                      opacity: isDisabled ? 0.45 : 1,
                      transition: "all 0.15s ease",
                      textAlign: "left",
                    }}
                  >
                    <span style={{ fontSize: "0.825rem", fontWeight: isSelected ? "600" : "500", color: isSelected ? "#0A84FF" : "#334155" }}>
                      {kpi.label}
                    </span>

                    <div
                      style={{
                        width: "18px",
                        height: "18px",
                        borderRadius: "4px",
                        border: isSelected ? "1.5px solid #0A84FF" : "1px solid #CBD5E1",
                        backgroundColor: isSelected ? "#0A84FF" : "transparent",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#FFFFFF",
                      }}
                    >
                      {isSelected && <Check size={12} strokeWidth={3} />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. VIDEO METRICS SECTION */}
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <h4 style={{ margin: 0, fontSize: "0.9rem", fontWeight: "700", color: "#0F172A" }}>
                  Video Metrics
                </h4>
                <span
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: "600",
                    padding: "2px 8px",
                    borderRadius: "999px",
                    backgroundColor: isVideoLimitReached ? "rgba(239, 68, 68, 0.1)" : "rgba(139, 92, 246, 0.1)",
                    color: isVideoLimitReached ? "#EF4444" : "#8B5CF6",
                  }}
                >
                  {draftVideo.length} / {VIDEO_KPI_LIMIT} Selected
                </span>
              </div>

              {isVideoLimitReached && (
                <span style={{ fontSize: "0.75rem", color: "#64748B", display: "flex", alignItems: "center", gap: "4px" }}>
                  <Info size={12} color="#EF4444" /> Maximum {VIDEO_KPI_LIMIT} video metrics selected
                </span>
              )}
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
                gap: "10px",
              }}
            >
              {CREATIVE_VIDEO_KPIS.map((kpi) => {
                const isSelected = draftVideo.includes(kpi.id);
                const isDisabled = !isSelected && isVideoLimitReached;

                return (
                  <button
                    key={kpi.id}
                    type="button"
                    onClick={() => toggleVideo(kpi.id)}
                    disabled={isDisabled}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px 14px",
                      borderRadius: "10px",
                      border: isSelected
                        ? "1.5px solid #8B5CF6"
                        : "1px solid var(--color-border, #E5E7EB)",
                      backgroundColor: isSelected ? "rgba(139, 92, 246, 0.04)" : "#FFFFFF",
                      cursor: isDisabled ? "not-allowed" : "pointer",
                      opacity: isDisabled ? 0.45 : 1,
                      transition: "all 0.15s ease",
                      textAlign: "left",
                    }}
                  >
                    <span style={{ fontSize: "0.825rem", fontWeight: isSelected ? "600" : "500", color: isSelected ? "#8B5CF6" : "#334155" }}>
                      {kpi.label}
                    </span>

                    <div
                      style={{
                        width: "18px",
                        height: "18px",
                        borderRadius: "4px",
                        border: isSelected ? "1.5px solid #8B5CF6" : "1px solid #CBD5E1",
                        backgroundColor: isSelected ? "#8B5CF6" : "transparent",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#FFFFFF",
                      }}
                    >
                      {isSelected && <Check size={12} strokeWidth={3} />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. VIDEO ENGAGEMENT SECTION */}
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
              <h4 style={{ margin: 0, fontSize: "0.9rem", fontWeight: "700", color: "#0F172A" }}>
                Video Engagement
              </h4>
              <span
                style={{
                  fontSize: "0.75rem",
                  fontWeight: "600",
                  padding: "2px 8px",
                  borderRadius: "999px",
                  backgroundColor: draftShowHookHold ? "rgba(139, 92, 246, 0.1)" : "var(--color-surface-subtle, #F1F5F9)",
                  color: draftShowHookHold ? "#8B5CF6" : "#64748B",
                }}
              >
                {draftShowHookHold ? "Enabled" : "Disabled"}
              </span>
            </div>
            <p style={{ margin: "0 0 10px 0", fontSize: "0.775rem", color: "#64748B" }}>
              Show Hook Rate and Hold Rate below the creative card KPIs.
            </p>

            <button
              type="button"
              onClick={() => setDraftShowHookHold(!draftShowHookHold)}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 14px",
                borderRadius: "10px",
                border: draftShowHookHold
                  ? "1.5px solid #8B5CF6"
                  : "1px solid var(--color-border, #E5E7EB)",
                backgroundColor: draftShowHookHold ? "rgba(139, 92, 246, 0.04)" : "#FFFFFF",
                cursor: "pointer",
                transition: "all 0.15s ease",
                textAlign: "left",
              }}
            >
              <span style={{ fontSize: "0.825rem", fontWeight: draftShowHookHold ? "600" : "500", color: draftShowHookHold ? "#8B5CF6" : "#334155" }}>
                Show Hook & Hold Rates
              </span>

              <div
                style={{
                  width: "18px",
                  height: "18px",
                  borderRadius: "4px",
                  border: draftShowHookHold ? "1.5px solid #8B5CF6" : "1px solid #CBD5E1",
                  backgroundColor: draftShowHookHold ? "#8B5CF6" : "transparent",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#FFFFFF",
                }}
              >
                {draftShowHookHold && <Check size={12} strokeWidth={3} />}
              </div>
            </button>
          </div>

          {/* 4. SOCIAL LINKS SECTION */}
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <h4 style={{ margin: 0, fontSize: "0.9rem", fontWeight: "700", color: "#0F172A" }}>
                  Social Links
                </h4>
                <span
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: "600",
                    padding: "2px 8px",
                    borderRadius: "999px",
                    backgroundColor: "rgba(16, 185, 129, 0.1)",
                    color: "#10B981",
                  }}
                >
                  {socialEnabledCount} / 2 Enabled
                </span>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                gap: "10px",
              }}
            >
              {/* Facebook Link Toggle */}
              <button
                type="button"
                onClick={() => setDraftShowFb(!draftShowFb)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 14px",
                  borderRadius: "10px",
                  border: draftShowFb
                    ? "1.5px solid #0A84FF"
                    : "1px solid var(--color-border, #E5E7EB)",
                  backgroundColor: draftShowFb ? "rgba(10, 132, 255, 0.04)" : "#FFFFFF",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  textAlign: "left",
                }}
              >
                <span style={{ fontSize: "0.825rem", fontWeight: draftShowFb ? "600" : "500", color: draftShowFb ? "#0A84FF" : "#334155" }}>
                  Facebook Link
                </span>

                <div
                  style={{
                    width: "18px",
                    height: "18px",
                    borderRadius: "4px",
                    border: draftShowFb ? "1.5px solid #0A84FF" : "1px solid #CBD5E1",
                    backgroundColor: draftShowFb ? "#0A84FF" : "transparent",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#FFFFFF",
                  }}
                >
                  {draftShowFb && <Check size={12} strokeWidth={3} />}
                </div>
              </button>

              {/* Instagram Link Toggle */}
              <button
                type="button"
                onClick={() => setDraftShowIg(!draftShowIg)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 14px",
                  borderRadius: "10px",
                  border: draftShowIg
                    ? "1.5px solid #EC4899"
                    : "1px solid var(--color-border, #E5E7EB)",
                  backgroundColor: draftShowIg ? "rgba(236, 72, 153, 0.04)" : "#FFFFFF",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  textAlign: "left",
                }}
              >
                <span style={{ fontSize: "0.825rem", fontWeight: draftShowIg ? "600" : "500", color: draftShowIg ? "#EC4899" : "#334155" }}>
                  Instagram Link
                </span>

                <div
                  style={{
                    width: "18px",
                    height: "18px",
                    borderRadius: "4px",
                    border: draftShowIg ? "1.5px solid #EC4899" : "1px solid #CBD5E1",
                    backgroundColor: draftShowIg ? "#EC4899" : "transparent",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#FFFFFF",
                  }}
                >
                  {draftShowIg && <Check size={12} strokeWidth={3} />}
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: "16px 24px",
            borderTop: "1px solid #E5E7EB",
            backgroundColor: "#FFFFFF",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <button
            type="button"
            onClick={handleReset}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 14px",
              borderRadius: "8px",
              border: "1px solid #E5E7EB",
              backgroundColor: "#FFFFFF",
              color: "#64748B",
              fontSize: "0.825rem",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            <RotateCcw size={14} />
            Reset to Default
          </button>

          <div style={{ display: "flex", gap: "10px" }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "8px 16px",
                borderRadius: "8px",
                border: "1px solid #E5E7EB",
                backgroundColor: "#FFFFFF",
                color: "#0F172A",
                fontSize: "0.825rem",
                fontWeight: "600",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={saving || draftPrimary.length === 0}
              style={{
                padding: "8px 20px",
                borderRadius: "8px",
                backgroundColor: "#0A84FF",
                color: "#FFFFFF",
                fontSize: "0.825rem",
                fontWeight: "600",
                border: "none",
                cursor: saving || draftPrimary.length === 0 ? "not-allowed" : "pointer",
                opacity: saving || draftPrimary.length === 0 ? 0.6 : 1,
                boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
              }}
            >
              {saving ? "Saving..." : "Save Preferences"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomizeCardsModal;
