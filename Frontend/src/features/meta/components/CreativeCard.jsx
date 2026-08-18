import React from "react";
import StatusBadge from "./StatusBadge.jsx";
import {
  ALL_CREATIVE_KPIS_MAP,
  DEFAULT_CREATIVE_CARD_PREFERENCES,
  formatKpiDisplayValue,
} from "../config/creativeKpis.config.js";
import { getActionValue } from "../utils/actionParser.js";
import {
  Wallet,
  ShoppingCart,
  TrendingUp,
  Clock,
  ArrowRight,
  Video,
  Image as ImageIcon,
  Play,
  ExternalLink,
} from "lucide-react";

/**
 * Helper to accurately detect whether a creative object is a video or an image.
 * Uses explicit media_type, video_id (top-level or nested in object_story_spec), video_url, or spec structure.
 */
export const isCreativeVideo = (row) => {
  if (!row) return false;

  // 1. Explicit type/media_type field if provided by API/adapter
  const typeStr = String(row.media_type || row.creative_type || row.type || "").toUpperCase();
  if (typeStr === "VIDEO" || typeStr === "VIDEO_INLINE") return true;
  if (typeStr === "IMAGE" || typeStr === "PHOTO" || typeStr === "STATIC") return false;

  // 2. Top-level video_id metadata
  const vId = row.video_id || row.videoId;
  if (
    vId !== null &&
    vId !== undefined &&
    String(vId).trim() !== "" &&
    String(vId) !== "null" &&
    String(vId) !== "undefined" &&
    String(vId) !== "0"
  ) {
    return true;
  }

  // 3. Nested video_id in object_story_spec.video_data.video_id
  const spec = row.object_story_spec;
  if (spec) {
    if (typeof spec === "object") {
      const specVideoId = spec.video_data?.video_id || spec.video_id;
      if (
        specVideoId !== null &&
        specVideoId !== undefined &&
        String(specVideoId).trim() !== "" &&
        String(specVideoId) !== "null" &&
        String(specVideoId) !== "undefined" &&
        String(specVideoId) !== "0"
      ) {
        return true;
      }
    } else if (typeof spec === "string") {
      if (spec.includes('"video_data"') || spec.includes('"video_id"')) {
        return true;
      }
    }
  }

  // 4. Presence of video_url
  const vUrl = row.video_url || row.videoUrl;
  if (vUrl !== null && vUrl !== undefined && String(vUrl).trim() !== "" && String(vUrl) !== "null" && String(vUrl) !== "undefined") {
    return true;
  }

  // 5. Explicit title/name keywords
  const nameStr = String(row.ad_name || row.creative_name || row.name || "").toLowerCase();
  if (nameStr.includes("static") || nameStr.includes("image") || nameStr.includes("photo") || nameStr.includes("banner")) {
    return false;
  }

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

export const getCreativeType = (creative) => {
  return isCreativeVideo(creative) ? "Video Creative" : "Image Creative";
};

export const getHookRate = (creative) => {
  if (!creative) return null;
  if (creative.hook_rate !== undefined && creative.hook_rate !== null) {
    const num = Number(creative.hook_rate);
    return isNaN(num) ? null : num;
  }
  const v3sec = getActionValue(
    creative.actions_video_view ?? creative.video_3_sec_watched_actions ?? creative.video_3_sec_views
  );
  const imp = getActionValue(creative.impressions);
  if (v3sec > 0 && imp > 0) {
    return (v3sec / imp) * 100;
  }
  return null;
};

export const getHoldRate = (creative) => {
  if (!creative) return null;
  if (creative.hold_rate !== undefined && creative.hold_rate !== null) {
    const num = Number(creative.hold_rate);
    return isNaN(num) ? null : num;
  }
  const v3sec = getActionValue(
    creative.actions_video_view ?? creative.video_3_sec_watched_actions ?? creative.video_3_sec_views
  );
  const thruplay = getActionValue(
    creative.video_thruplay_watched_actions_video_view ?? creative.video_thruplay_watched_actions ?? creative.thruplay
  );

  if (thruplay > 0 && v3sec > 0) {
    return (thruplay / v3sec) * 100;
  }
  return null;
};

const isValidUrl = (url) => {
  if (!url || typeof url !== "string") return false;
  const str = url.trim();
  return str !== "" && str !== "null" && str !== "undefined" && (str.startsWith("http://") || str.startsWith("https://") || str.startsWith("fb://") || str.startsWith("instagram://"));
};

/**
 * CreativeCard Component.
 */
export const CreativeCard = ({ creative, onClick, preferences, variant = "default" }) => {
  if (!creative) return null;

  const isVideo = isCreativeVideo(creative);
  const imageUrl = creative.thumbnail_url || creative.image_url;
  const adTitle = creative.ad_name || creative.creative_name || creative.name || "Unnamed Creative";
  const campaignName = creative.campaign || creative.campaign_name || "Campaign";

  const rawStatus =
    creative.effective_status || creative.ad_status || creative.status || "ACTIVE";

  const currency = creative.currency || "INR";

  // Selected KPI definitions
  const activePrimaryKeys = preferences?.primaryMetrics && preferences.primaryMetrics.length > 0
    ? preferences.primaryMetrics
    : DEFAULT_CREATIVE_CARD_PREFERENCES.primaryMetrics;

  const activeVideoKeys = preferences?.videoMetrics && preferences.videoMetrics.length > 0
    ? preferences.videoMetrics
    : DEFAULT_CREATIVE_CARD_PREFERENCES.videoMetrics;

  const primaryKpiDefs = activePrimaryKeys
    .map((key) => ALL_CREATIVE_KPIS_MAP[key])
    .filter(Boolean);

  const videoKpiDefs = activeVideoKeys
    .map((key) => ALL_CREATIVE_KPIS_MAP[key])
    .filter(Boolean);

  const showFbPref = preferences?.showFacebookLink !== undefined ? Boolean(preferences.showFacebookLink) : DEFAULT_CREATIVE_CARD_PREFERENCES.showFacebookLink;
  const showIgPref = preferences?.showInstagramLink !== undefined ? Boolean(preferences.showInstagramLink) : DEFAULT_CREATIVE_CARD_PREFERENCES.showInstagramLink;
  const showHookHoldPref = preferences?.showHookHoldRates !== undefined ? Boolean(preferences.showHookHoldRates) : DEFAULT_CREATIVE_CARD_PREFERENCES.showHookHoldRates;

  const fbUrl = showFbPref && isValidUrl(creative.facebook_permalink_url) ? creative.facebook_permalink_url.trim() : null;
  const igUrl = showIgPref && isValidUrl(creative.instagram_permalink_url) ? creative.instagram_permalink_url.trim() : null;

  // Contextual hover styles based on page variant
  const getHoverStyles = () => {
    if (variant === "winning") {
      return {
        borderColor: "rgba(34, 197, 94, 0.4)",
        boxShadow: "0 8px 28px rgba(34, 197, 94, 0.20), 0 0 0 1px rgba(34, 197, 94, 0.18)",
      };
    }
    if (variant === "poor") {
      return {
        borderColor: "rgba(239, 68, 68, 0.4)",
        boxShadow: "0 8px 28px rgba(239, 68, 68, 0.20), 0 0 0 1px rgba(239, 68, 68, 0.18)",
      };
    }
    return {
      borderColor: "#0A84FF",
      boxShadow: "0 6px 12px rgba(15, 23, 42, 0.06)",
    };
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
        transition: "box-shadow 180ms ease, transform 180ms ease, border-color 180ms ease",
      }}
      onMouseEnter={(e) => {
        const hoverStyles = getHoverStyles();
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.borderColor = hoverStyles.borderColor;
        e.currentTarget.style.boxShadow = hoverStyles.boxShadow;
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
      {/* 1. CREATIVE MEDIA HEADER WITH TYPE BADGE */}
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

        {/* Media Type Badge Overlay */}
        <div
          style={{
            position: "absolute",
            top: "10px",
            right: "10px",
            fontSize: "0.68rem",
            fontWeight: "600",
            padding: "3px 8px",
            borderRadius: "999px",
            backgroundColor: isVideo ? "rgba(10, 132, 255, 0.9)" : "rgba(15, 23, 42, 0.75)",
            color: "#FFFFFF",
            backdropFilter: "blur(4px)",
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.15)",
          }}
        >
          {isVideo ? (
            <>
              <Video size={11} color="#FFFFFF" /> Video Creative
            </>
          ) : (
            <>
              <ImageIcon size={11} color="#FFFFFF" /> Image Creative
            </>
          )}
        </div>

        {/* Play Icon Overlay for Videos */}
        {isVideo && (
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "42px",
              height: "42px",
              borderRadius: "50%",
              backgroundColor: "rgba(10, 132, 255, 0.9)",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.25)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#FFFFFF",
              pointerEvents: "none",
              backdropFilter: "blur(4px)",
            }}
          >
            <Play size={18} fill="#FFFFFF" style={{ marginLeft: "2px" }} />
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

        {/* 3. DYNAMIC PRIMARY PERFORMANCE METRICS (2-COLUMN GRID) */}
        {primaryKpiDefs.length > 0 && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: primaryKpiDefs.length === 1 ? "1fr" : "1fr 1fr",
              gap: "8px",
            }}
          >
            {primaryKpiDefs.map((kpiDef) => {
              const formattedVal = formatKpiDisplayValue(kpiDef, creative, currency);
              return (
                <div
                  key={kpiDef.id}
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
                  <span style={{ fontSize: "11px", color: "#64748B", fontWeight: "500" }}>
                    {kpiDef.label}
                  </span>
                  <div style={{ fontSize: "13px", fontWeight: "700", color: "#0F172A" }}>
                    {formattedVal}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 4. DYNAMIC VIDEO METRICS ROW (ONLY for Video Creatives & when enabled) */}
        {isVideo && showHookHoldPref && videoKpiDefs.length > 0 && (
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
            {videoKpiDefs.map((kpiDef) => {
              const formattedVal = formatKpiDisplayValue(kpiDef, creative, currency);
              return (
                <div key={kpiDef.id} style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                  <span style={{ color: "#64748B", fontWeight: "500" }}>{kpiDef.label}:</span>
                  <strong style={{ color: "#8B5CF6", fontWeight: "700" }}>
                    {formattedVal}
                  </strong>
                </div>
              );
            })}
          </div>
        )}

        {/* Platform Social Links Row (View on Facebook / View on Instagram) */}
        {(fbUrl || igUrl) && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              paddingTop: "2px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {fbUrl && (
              <a
                href={fbUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontSize: "11px",
                  fontWeight: "600",
                  color: "#0A84FF",
                  textDecoration: "none",
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
              </a>
            )}

            {igUrl && (
              <a
                href={igUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontSize: "11px",
                  fontWeight: "600",
                  color: "#EC4899",
                  textDecoration: "none",
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
              </a>
            )}
          </div>
        )}

        {/* 5. CARD FOOTER */}
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
            <span>{creative.date ? (creative.date.includes("–") || creative.date.includes("- ") ? creative.date : `Updated ${creative.date}`) : "Updated"}</span>
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
