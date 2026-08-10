import React from "react";

/**
 * CreativePreviewSection component for Creative Preview tab.
 * Renders thumbnail_url / image_url as the primary visual preview poster.
 * Overlays a centered play icon for video creatives.
 * Renders clean 'Watch on Facebook →' and 'Watch on Instagram →' links for social permalinks.
 * Completely eliminates broken social iframe errors ("This Facebook post is no longer available").
 */
export const CreativePreviewSection = ({ creative }) => {
  const fbPermalink = creative.facebook_permalink_url;
  const igPermalink = creative.instagram_permalink_url;
  const imageUrl = creative.image_url;
  const thumbnailUrl = creative.thumbnail_url;

  // Video creative detection based on video analytics actions
  const isVideoCreative = Boolean(
    creative.video_play_actions ||
      creative.video_p25_watched_actions ||
      creative.video_p50_watched_actions ||
      creative.video_p75_watched_actions ||
      creative.video_p95_watched_actions ||
      creative.video_p100_watched_actions ||
      creative.video_avg_time_watched_actions ||
      creative.video_views
  );

  const displayImage = imageUrl || thumbnailUrl;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Section Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h4 style={{ margin: 0, fontSize: "0.95rem", fontWeight: "700", color: "var(--color-text-primary, #111827)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
          Creative Preview
        </h4>
        <span
          style={{
            fontSize: "0.75rem",
            padding: "3px 10px",
            borderRadius: "999px",
            backgroundColor: "var(--color-surface, #F7F9FC)",
            border: "1px solid #E8EAED",
            color: "#64748B",
            fontWeight: "600",
          }}
        >
          {isVideoCreative ? "📹 Video Creative" : "🖼️ Image Creative"}
        </span>
      </div>

      {/* Primary Preview Card */}
      <div
        style={{
          width: "100%",
          borderRadius: "12px",
          border: "1px solid var(--color-border, #E8EAED)",
          overflow: "hidden",
          backgroundColor: "var(--color-surface, #F7F9FC)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          boxShadow: "var(--shadow-subtle, 0 2px 8px rgba(15, 23, 42, 0.04))",
        }}
      >
        {/* Poster Display with Play Icon Overlay for Videos */}
        <div style={{ width: "100%", backgroundColor: "#0F172A", textAlign: "center", position: "relative", minHeight: "220px", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {displayImage ? (
            <div style={{ position: "relative", width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <img
                src={displayImage}
                alt={creative.ad_name || "Creative Preview"}
                style={{
                  width: "100%",
                  maxHeight: "360px",
                  objectFit: "contain",
                  display: "block",
                }}
                onError={(e) => {
                  e.target.style.display = "none";
                }}
              />

              {/* Large Centered Play Icon Overlay for Video Creatives */}
              {isVideoCreative && (
                <div
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    width: "64px",
                    height: "64px",
                    borderRadius: "50%",
                    backgroundColor: "rgba(10, 132, 255, 0.9)",
                    boxShadow: "0 4px 16px rgba(0, 0, 0, 0.3)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#FFFFFF",
                    fontSize: "1.6rem",
                    paddingLeft: "4px",
                    pointerEvents: "none",
                    backdropFilter: "blur(4px)",
                  }}
                >
                  ▶
                </div>
              )}
            </div>
          ) : (
            <div
              style={{
                width: "100%",
                height: "200px",
                background: "var(--gradient-hero, linear-gradient(#F2F8FF, #EAF3FF))",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--color-primary-hover, #0060DF)",
                fontWeight: "600",
                fontSize: "0.95rem",
              }}
            >
              🎨 No creative preview available
            </div>
          )}
        </div>

        {/* Video Creative Action Buttons */}
        {isVideoCreative && (fbPermalink || igPermalink) && (
          <div
            style={{
              width: "100%",
              padding: "14px 16px",
              backgroundColor: "#FFFFFF",
              borderTop: "1px solid var(--color-border, #E8EAED)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "12px",
              flexWrap: "wrap",
            }}
          >
            {fbPermalink && (
              <a
                href={fbPermalink}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "9px 16px",
                  borderRadius: "8px",
                  backgroundColor: "var(--color-primary, #0A84FF)",
                  color: "#FFFFFF",
                  fontSize: "0.85rem",
                  fontWeight: "600",
                  textDecoration: "none",
                  boxShadow: "0 2px 4px rgba(10, 132, 255, 0.2)",
                  transition: "all 0.15s ease",
                }}
              >
                Watch on Facebook →
              </a>
            )}

            {igPermalink && (
              <a
                href={igPermalink}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "9px 16px",
                  borderRadius: "8px",
                  backgroundColor: "#FFFFFF",
                  color: "var(--color-text-primary, #111827)",
                  border: "1px solid var(--color-border, #E8EAED)",
                  fontSize: "0.85rem",
                  fontWeight: "600",
                  textDecoration: "none",
                  transition: "all 0.15s ease",
                }}
              >
                Watch on Instagram →
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CreativePreviewSection;
