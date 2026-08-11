import React from "react";
import {
  Wallet,
  Target,
  ShoppingCart,
  TrendingUp,
  Play,
  Clock,
  ArrowRight,
  Image as ImageIcon,
} from "lucide-react";
import StatusBadge from "./StatusBadge.jsx";
import { formatCurrency } from "../../../utils/formatCurrency.js";

/**
 * Helper to accurately detect whether a creative object is a video or an image.
 */
export const isCreativeVideo = (row) => {
  if (!row) return false;

  // 1. Explicit type/media_type field if provided by API/adapter
  const typeStr = String(row.media_type || row.creative_type || row.type || "").toLowerCase();
  if (typeStr === "video") return true;
  if (typeStr === "image" || typeStr === "photo") return false;

  // 2. Presence of video_id or video_url
  if (row.video_id && String(row.video_id).trim() !== "") return true;
  if (row.video_url && String(row.video_url).trim() !== "") return true;

  // 3. Presence of video action metrics (video_play_actions, etc.)
  const hasVideoActions = (actionVal) => {
    if (!actionVal) return false;
    if (typeof actionVal === "number" && actionVal > 0) return true;
    if (typeof actionVal === "string" && !isNaN(Number(actionVal)) && Number(actionVal) > 0) return true;
    if (Array.isArray(actionVal) && actionVal.length > 0) return true;
    if (typeof actionVal === "object" && Object.keys(actionVal).length > 0) return true;
    return false;
  };

  if (
    hasVideoActions(row.video_play_actions) ||
    hasVideoActions(row.video_avg_time_watched_actions) ||
    hasVideoActions(row.video_p25_watched_actions) ||
    hasVideoActions(row.video_p50_watched_actions) ||
    hasVideoActions(row.video_p75_watched_actions) ||
    hasVideoActions(row.video_p95_watched_actions) ||
    hasVideoActions(row.video_p100_watched_actions)
  ) {
    return true;
  }

  // 4. Inspect object_story_spec if available
  if (row.object_story_spec) {
    const specStr = typeof row.object_story_spec === "string" 
      ? row.object_story_spec 
      : JSON.stringify(row.object_story_spec);
    if (specStr.toLowerCase().includes("video")) return true;
  }

  // 5. Ad name or creative name fallback keywords
  const nameStr = String(row.ad_name || row.creative_name || row.name || "").toLowerCase();
  if (
    nameStr.includes("video") ||
    nameStr.includes(".mp4") ||
    nameStr.includes("reels") ||
    nameStr.includes("reel") ||
    nameStr.includes("short")
  ) {
    return true;
  }

  return false;
};

/**
 * CreativeCard Component.
 * Premium B2B SaaS metric card matching Linear / Stripe / Ramp design language.
 */
export const CreativeCard = ({ creative, onClick }) => {
  if (!creative) return null;

  const currency = creative.currency || "INR";
  const imageUrl = creative.thumbnail_url || creative.image_url;
  const rawStatus = creative.effective_status || creative.ad_effective_status || creative.ad_status || creative.status || creative.adset_status || creative.campaign_status || "ACTIVE";
  const isVideo = isCreativeVideo(creative);

  const adTitle = creative.ad_name || creative.creative_name || creative.name || "Unnamed Creative";
  const campaignName = creative.campaign || creative.campaign_name || "—";

  const spend = creative.spend;
  const costPerResult = creative.cost_per_result;
  const purchaseValue = creative.purchase_conversion_value;
  const purchaseRoas = creative.purchase_roas;

  const formatMetricValue = (val, type) => {
    if (val === null || val === undefined || val === "" || isNaN(Number(val))) {
      return "—";
    }
    const num = Number(val);
    if (type === "currency") return formatCurrency(num, currency);
    if (type === "roas") return `${num.toFixed(2)}x`;
    return num.toLocaleString();
  };

  return (
    <div
      onClick={onClick}
      style={{
        backgroundColor: "#FFFFFF",
        borderRadius: "16px",
        border: "1px solid #E5E7EB",
        boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        cursor: "pointer",
        transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.borderColor = "#0A84FF";
        e.currentTarget.style.boxShadow = "0 6px 12px rgba(15, 23, 42, 0.06)";
        const img = e.currentTarget.querySelector(".creative-media-img");
        if (img) img.style.transform = "scale(1.02)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.borderColor = "#E5E7EB";
        e.currentTarget.style.boxShadow = "0 1px 3px rgba(15, 23, 42, 0.04)";
        const img = e.currentTarget.querySelector(".creative-media-img");
        if (img) img.style.transform = "scale(1)";
      }}
    >
      {/* 1. CREATIVE MEDIA HEADER */}
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "170px",
          backgroundColor: "#F1F5F9",
          overflow: "hidden",
        }}
      >
        {imageUrl ? (
          <img
            className="creative-media-img"
            src={imageUrl}
            alt={adTitle}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              transition: "transform 0.25s ease",
            }}
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
              color: "#64748B",
              fontSize: "0.85rem",
              fontWeight: "600",
              gap: "8px",
            }}
          >
            <ImageIcon size={20} color="#94A3B8" />
            <span>Creative Asset</span>
          </div>
        )}
      </div>

      {/* CARD BODY */}
      <div
        style={{
          padding: "14px",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          flex: 1,
          justifyContent: "space-between",
        }}
      >
        {/* 2. TITLE, STATUS & CAMPAIGN CONTEXT */}
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px" }}>
            <h3
              title={adTitle}
              style={{
                margin: 0,
                fontSize: "13.5px",
                fontWeight: "600",
                color: "#0F172A",
                lineHeight: "1.25",
                letterSpacing: "-0.1px",
                overflow: "hidden",
                textOverflow: "ellipsis",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
              }}
            >
              {adTitle}
            </h3>
            <div style={{ flexShrink: 0, marginTop: "1px" }}>
              <StatusBadge status={rawStatus} />
            </div>
          </div>

          <div
            title={`Campaign: ${campaignName}`}
            style={{
              fontSize: "11.5px",
              color: "#64748B",
              fontWeight: "500",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            <strong>Campaign:</strong> {campaignName}
          </div>
        </div>

        {/* 3. FOUR PRIMARY PERFORMANCE METRICS (2 x 2 GRID) */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "8px",
          }}
        >
          {/* Amount Spent */}
          <div
            style={{
              backgroundColor: "#F8FAFC",
              border: "1px solid #F1F5F9",
              borderRadius: "8px",
              padding: "8px 10px",
              display: "flex",
              flexDirection: "column",
              gap: "3px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              <div
                style={{
                  width: "20px",
                  height: "20px",
                  borderRadius: "50%",
                  backgroundColor: "rgba(10, 132, 255, 0.08)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#0A84FF",
                  flexShrink: 0,
                }}
              >
                <Wallet size={11} strokeWidth={2.2} />
              </div>
              <span style={{ fontSize: "10.5px", fontWeight: "500", color: "#64748B" }}>
                Amount Spent
              </span>
            </div>
            <div style={{ fontSize: "15px", fontWeight: "700", color: "#0F172A", letterSpacing: "-0.2px", lineHeight: "1.1" }}>
              {formatMetricValue(spend, "currency")}
            </div>
          </div>

          {/* Cost per Result */}
          <div
            style={{
              backgroundColor: "#F8FAFC",
              border: "1px solid #F1F5F9",
              borderRadius: "8px",
              padding: "8px 10px",
              display: "flex",
              flexDirection: "column",
              gap: "3px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              <div
                style={{
                  width: "20px",
                  height: "20px",
                  borderRadius: "50%",
                  backgroundColor: "rgba(22, 163, 74, 0.08)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#16A34A",
                  flexShrink: 0,
                }}
              >
                <Target size={11} strokeWidth={2.2} />
              </div>
              <span style={{ fontSize: "10.5px", fontWeight: "500", color: "#64748B" }}>
                Cost / Result
              </span>
            </div>
            <div style={{ fontSize: "15px", fontWeight: "700", color: "#0F172A", letterSpacing: "-0.2px", lineHeight: "1.1" }}>
              {formatMetricValue(costPerResult, "currency")}
            </div>
          </div>

          {/* Purchase Value */}
          <div
            style={{
              backgroundColor: "#F8FAFC",
              border: "1px solid #F1F5F9",
              borderRadius: "8px",
              padding: "8px 10px",
              display: "flex",
              flexDirection: "column",
              gap: "3px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              <div
                style={{
                  width: "20px",
                  height: "20px",
                  borderRadius: "50%",
                  backgroundColor: "rgba(245, 158, 11, 0.10)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#D97706",
                  flexShrink: 0,
                }}
              >
                <ShoppingCart size={11} strokeWidth={2.2} />
              </div>
              <span style={{ fontSize: "10.5px", fontWeight: "500", color: "#64748B" }}>
                Purchase Value
              </span>
            </div>
            <div style={{ fontSize: "15px", fontWeight: "700", color: "#0F172A", letterSpacing: "-0.2px", lineHeight: "1.1" }}>
              {formatMetricValue(purchaseValue, "currency")}
            </div>
          </div>

          {/* Purchase ROAS */}
          <div
            style={{
              backgroundColor: "#F8FAFC",
              border: "1px solid #F1F5F9",
              borderRadius: "8px",
              padding: "8px 10px",
              display: "flex",
              flexDirection: "column",
              gap: "3px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              <div
                style={{
                  width: "20px",
                  height: "20px",
                  borderRadius: "50%",
                  backgroundColor: "rgba(124, 58, 237, 0.08)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#7C3AED",
                  flexShrink: 0,
                }}
              >
                <TrendingUp size={11} strokeWidth={2.2} />
              </div>
              <span style={{ fontSize: "10.5px", fontWeight: "500", color: "#64748B" }}>
                Purchase ROAS
              </span>
            </div>
            <div style={{ fontSize: "15px", fontWeight: "700", color: "#16A34A", letterSpacing: "-0.2px", lineHeight: "1.1" }}>
              {formatMetricValue(purchaseRoas, "roas")}
            </div>
          </div>
        </div>

        {/* 4. CARD FOOTER */}
        <div
          style={{
            borderTop: "1px solid #F1F5F9",
            paddingTop: "8px",
            marginTop: "auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: "11px",
            color: "#94A3B8",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <Clock size={11} color="#94A3B8" />
            <span>{creative.date ? `Updated ${creative.date}` : "Updated"}</span>
          </div>

          <div
            style={{
              fontSize: "11px",
              fontWeight: "600",
              color: "#0A84FF",
              display: "flex",
              alignItems: "center",
              gap: "2px",
            }}
          >
            <span>View Details</span>
            <ArrowRight size={11} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreativeCard;
