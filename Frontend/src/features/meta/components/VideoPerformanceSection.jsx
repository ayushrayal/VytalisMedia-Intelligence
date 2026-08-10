import React from "react";
import { formatNumber } from "../../../utils/formatNumber.js";
import { getActionValue } from "../utils/actionParser.js";

export const VideoPerformanceSection = ({ creative }) => {
  // Check if video fields exist in API object
  const hasVideoFields =
    creative.video_play_actions !== undefined ||
    creative.video_views !== undefined ||
    creative.video_p25_watched_actions !== undefined ||
    creative.video_p50_watched_actions !== undefined ||
    creative.video_p75_watched_actions !== undefined ||
    creative.video_p95_watched_actions !== undefined ||
    creative.video_p100_watched_actions !== undefined;

  if (!hasVideoFields) {
    return (
      <div
        style={{
          backgroundColor: "var(--color-surface, #F7F9FC)",
          borderRadius: "12px",
          border: "1px dashed var(--color-border, #E8EAED)",
          padding: "36px 20px",
          textAlign: "center",
          color: "var(--color-text-secondary, #64748B)",
        }}
      >
        <div style={{ fontSize: "2rem", marginBottom: "8px" }}>🎬</div>
        <h4 style={{ margin: "0 0 4px 0", color: "#111827", fontWeight: "600" }}>No Video Performance Data</h4>
        <p style={{ margin: 0, fontSize: "0.875rem" }}>
          No video performance data is available for this creative asset.
        </p>
      </div>
    );
  }

  const videoPlays = getActionValue(creative.video_play_actions || creative.video_views);
  const p25 = getActionValue(creative.video_p25_watched_actions);
  const p50 = getActionValue(creative.video_p50_watched_actions);
  const p75 = getActionValue(creative.video_p75_watched_actions);
  const p95 = getActionValue(creative.video_p95_watched_actions);
  const p100 = getActionValue(creative.video_p100_watched_actions);
  const avgTime = getActionValue(creative.video_avg_time_watched_actions);

  const calcPct = (val) => {
    if (!videoPlays || videoPlays <= 0) return 0;
    return Math.min(100, Math.round((val / videoPlays) * 1000) / 10);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <h4 style={{ margin: 0, fontSize: "0.95rem", fontWeight: "700", color: "var(--color-text-primary, #111827)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
        Video Performance & Retention Funnel
      </h4>

      <div
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: "12px",
          border: "1px solid var(--color-border, #E8EAED)",
          padding: "20px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        {/* Top Summary Row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", textAlign: "center" }}>
          <div style={{ backgroundColor: "var(--color-surface, #F7F9FC)", padding: "12px", borderRadius: "8px" }}>
            <span style={{ fontSize: "0.75rem", color: "#64748B", display: "block" }}>Video Plays</span>
            <strong style={{ fontSize: "1.15rem", color: "#111827" }}>{formatNumber(videoPlays)}</strong>
          </div>
          <div style={{ backgroundColor: "var(--color-surface, #F7F9FC)", padding: "12px", borderRadius: "8px" }}>
            <span style={{ fontSize: "0.75rem", color: "#64748B", display: "block" }}>100% Watched</span>
            <strong style={{ fontSize: "1.15rem", color: "#16A34A" }}>{formatNumber(p100)}</strong>
          </div>
          <div style={{ backgroundColor: "var(--color-surface, #F7F9FC)", padding: "12px", borderRadius: "8px" }}>
            <span style={{ fontSize: "0.75rem", color: "#64748B", display: "block" }}>Avg Watch Time</span>
            <strong style={{ fontSize: "1.15rem", color: "#0A84FF" }}>{avgTime ? `${avgTime} sec` : "-"}</strong>
          </div>
        </div>

        {/* Funnel Progress Bars */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "4px" }}>
          <FunnelBar label="Video Plays" count={videoPlays} percent={100} />
          <FunnelBar label="25% Watched" count={p25} percent={calcPct(p25)} />
          <FunnelBar label="50% Watched" count={p50} percent={calcPct(p50)} />
          <FunnelBar label="75% Watched" count={p75} percent={calcPct(p75)} />
          <FunnelBar label="95% Watched" count={p95} percent={calcPct(p95)} />
          <FunnelBar label="100% Watched" count={p100} percent={calcPct(p100)} />
        </div>
      </div>
    </div>
  );
};

const FunnelBar = ({ label, count, percent }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.825rem" }}>
      <span style={{ color: "#475569", fontWeight: "600" }}>{label}</span>
      <span style={{ color: "#111827", fontWeight: "700" }}>
        {formatNumber(count)} <span style={{ color: "#94A3B8", fontWeight: "normal" }}>({percent}%)</span>
      </span>
    </div>
    <div
      style={{
        width: "100%",
        height: "8px",
        borderRadius: "999px",
        backgroundColor: "var(--color-surface, #F7F9FC)",
        border: "1px solid #E8EAED",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: `${percent}%`,
          height: "100%",
          backgroundColor: "var(--color-primary, #0A84FF)",
          borderRadius: "999px",
          transition: "width 0.3s ease",
        }}
      />
    </div>
  </div>
);

export default VideoPerformanceSection;
