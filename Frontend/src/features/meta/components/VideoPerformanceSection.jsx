import React from "react";
import { formatNumber } from "../../../utils/formatNumber.js";
import { getActionValue } from "../utils/actionParser.js";

/**
 * Calculates Hook Rate: (3-Second Video Plays / Impressions) * 100
 * Where 3-Second Video Plays = actions_video_view
 */
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

/**
 * Calculates Hold Rate: (ThruPlay / 3-Second Video Plays) * 100
 * Where ThruPlay = video_thruplay_watched_actions_video_view
 * Where 3-Second Video Plays = actions_video_view
 */
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

export const VideoPerformanceSection = ({ creative }) => {
  // Check if video fields exist in API object
  const hasVideoFields =
    creative.video_play_actions_video_view !== undefined ||
    creative.video_play_actions !== undefined ||
    creative.video_views !== undefined ||
    creative.actions_video_view !== undefined ||
    creative.video_3_sec_watched_actions !== undefined ||
    creative.video_thruplay_watched_actions_video_view !== undefined ||
    creative.video_thruplay_watched_actions !== undefined ||
    creative.video_p25_watched_actions_video_view !== undefined ||
    creative.video_p25_watched_actions !== undefined ||
    creative.video_p50_watched_actions_video_view !== undefined ||
    creative.video_p50_watched_actions !== undefined ||
    creative.video_p75_watched_actions_video_view !== undefined ||
    creative.video_p75_watched_actions !== undefined ||
    creative.video_p95_watched_actions_video_view !== undefined ||
    creative.video_p95_watched_actions !== undefined ||
    creative.video_p100_watched_actions_video_view !== undefined ||
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

  const videoPlays = getActionValue(
    creative.video_play_actions_video_view ?? creative.video_play_actions ?? creative.video_views
  );
  const v3secPlays = getActionValue(
    creative.actions_video_view ?? creative.video_3_sec_watched_actions ?? creative.video_3_sec_views
  );
  const thruplays = getActionValue(
    creative.video_thruplay_watched_actions_video_view ?? creative.video_thruplay_watched_actions ?? creative.thruplay
  );

  const p25 = getActionValue(creative.video_p25_watched_actions_video_view ?? creative.video_p25_watched_actions);
  const p50 = getActionValue(creative.video_p50_watched_actions_video_view ?? creative.video_p50_watched_actions);
  const p75 = getActionValue(creative.video_p75_watched_actions_video_view ?? creative.video_p75_watched_actions);
  const p95 = getActionValue(creative.video_p95_watched_actions_video_view ?? creative.video_p95_watched_actions);
  const p100 = getActionValue(creative.video_p100_watched_actions_video_view ?? creative.video_p100_watched_actions);
  const avgTime = getActionValue(
    creative.video_avg_time_watched_actions_video_view ?? creative.video_avg_time_watched_actions ?? creative.video_avg_time_watched
  );

  const hookRate = getHookRate(creative);
  const holdRate = getHoldRate(creative);

  const formatRatePct = (val) => {
    if (val === null || val === undefined || isNaN(Number(val))) {
      return "--";
    }
    const num = Number(val);
    return `${num.toFixed(2).replace(/\.00$/, "")}%`;
  };

  const formattedAvgTime =
    avgTime !== null && avgTime !== undefined && !isNaN(Number(avgTime)) && Number(avgTime) > 0
      ? `${Number(avgTime).toFixed(2).replace(/\.00$/, "")} sec`
      : "--";

  const calcPct = (val) => {
    if (!videoPlays || videoPlays <= 0 || !val || val < 0) return 0;
    const pct = (val / videoPlays) * 100;
    return Math.min(100, Math.round(pct * 100) / 100);
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
        {/* Top Summary Metrics Row (6 Cards in 1 Single Line) */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, minmax(0, 1fr))", gap: "6px", textAlign: "center" }}>
          <div style={{ backgroundColor: "var(--color-surface, #F7F9FC)", padding: "10px 4px", borderRadius: "8px" }}>
            <span style={{ fontSize: "0.68rem", color: "#64748B", display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title="Video Plays">Video Plays</span>
            <strong style={{ fontSize: "1rem", color: "#111827", display: "block", whiteSpace: "nowrap" }}>{formatNumber(videoPlays)}</strong>
          </div>

          <div style={{ backgroundColor: "var(--color-surface, #F7F9FC)", padding: "10px 4px", borderRadius: "8px" }}>
            <span style={{ fontSize: "0.68rem", color: "#64748B", display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title="3-Sec Plays">3-Sec Plays</span>
            <strong style={{ fontSize: "1rem", color: "#0A84FF", display: "block", whiteSpace: "nowrap" }}>{formatNumber(v3secPlays)}</strong>
          </div>

          <div style={{ backgroundColor: "var(--color-surface, #F7F9FC)", padding: "10px 4px", borderRadius: "8px" }}>
            <span style={{ fontSize: "0.68rem", color: "#64748B", display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title="Hook Rate">Hook Rate</span>
            <strong style={{ fontSize: "1rem", color: "#8B5CF6", display: "block", whiteSpace: "nowrap" }}>{formatRatePct(hookRate)}</strong>
          </div>

          <div style={{ backgroundColor: "var(--color-surface, #F7F9FC)", padding: "10px 4px", borderRadius: "8px" }}>
            <span style={{ fontSize: "0.68rem", color: "#64748B", display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title="ThruPlay">ThruPlay</span>
            <strong style={{ fontSize: "1rem", color: "#D97706", display: "block", whiteSpace: "nowrap" }}>{formatNumber(thruplays)}</strong>
          </div>

          <div style={{ backgroundColor: "var(--color-surface, #F7F9FC)", padding: "10px 4px", borderRadius: "8px" }}>
            <span style={{ fontSize: "0.68rem", color: "#64748B", display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title="Hold Rate">Hold Rate</span>
            <strong style={{ fontSize: "1rem", color: "#EC4899", display: "block", whiteSpace: "nowrap" }}>{formatRatePct(holdRate)}</strong>
          </div>

          <div style={{ backgroundColor: "var(--color-surface, #F7F9FC)", padding: "10px 4px", borderRadius: "8px" }}>
            <span style={{ fontSize: "0.68rem", color: "#64748B", display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title="Avg Watch Time">Avg Watch Time</span>
            <strong style={{ fontSize: "1rem", color: "#16A34A", display: "block", whiteSpace: "nowrap" }}>{formattedAvgTime}</strong>
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
