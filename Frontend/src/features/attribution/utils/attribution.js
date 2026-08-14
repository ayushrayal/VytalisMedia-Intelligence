import { formatCurrency, formatCurrencyINR } from "../../../utils/formatCurrency.js";
import { formatNumber } from "../../../utils/formatNumber.js";
import { formatPercentage } from "../../../utils/formatPercentage.js";

/**
 * Color Tokens for Attribution UI Groups
 */
export const GROUP_COLORS = {
  meta: {
    primary: "#0A84FF",
    bg: "rgba(10, 132, 255, 0.08)",
    border: "rgba(10, 132, 255, 0.25)",
    text: "#0A84FF",
    bar: "#0A84FF",
  },
  google: {
    primary: "#2563EB",
    bg: "rgba(37, 99, 235, 0.08)",
    border: "rgba(37, 99, 235, 0.25)",
    text: "#2563EB",
    bar: "#2563EB",
  },
  not_attribution: {
    primary: "#64748B",
    bg: "rgba(100, 116, 139, 0.08)",
    border: "rgba(100, 116, 139, 0.25)",
    text: "#64748B",
    bar: "#94A3B8",
  },
};

/**
 * Badge Styles per Raw Attribution Channel
 */
export const CHANNEL_BADGE_STYLES = {
  "Meta Ads": {
    bg: "#EFF6FF",
    border: "#BFDBFE",
    text: "#1D4ED8",
  },
  "Google Ads": {
    bg: "#F0F9FF",
    border: "#BAE6FD",
    text: "#0369A1",
  },
  "Google Organic": {
    bg: "#F8FAFC",
    border: "#E2E8F0",
    text: "#475569",
  },
  "CRM / WhatsApp / Email": {
    bg: "#F0FDF4",
    border: "#BBF7D0",
    text: "#15803D",
  },
  "AI / LLM Referral": {
    bg: "#FAF5FF",
    border: "#E9D5FF",
    text: "#7E22CE",
  },
  "Other (Tagged)": {
    bg: "#FFFBEB",
    border: "#FDE68A",
    text: "#B45309",
  },
  "Not Attributed": {
    bg: "#F1F5F9",
    border: "#CBD5E1",
    text: "#64748B",
  },
};

/**
 * Formats a metric safely with fallback "—" for null/undefined values.
 */
export const formatMetric = (val, type = "number", currency = "INR") => {
  if (val === null || val === undefined || val === "" || isNaN(Number(val))) {
    return "—";
  }
  const num = Number(val);

  switch (type) {
    case "currency":
      return formatCurrency(num, currency);
    case "percentage":
      return `${num.toFixed(1)}%`;
    case "number":
      return formatNumber(num);
    default:
      return num.toLocaleString();
  }
};

/**
 * Returns badge styling object for a given group key ("meta", "google", "not_attribution").
 */
export const getGroupBadgeStyle = (groupKey) => {
  const normKey = (groupKey || "not_attribution").toLowerCase();
  return (
    GROUP_COLORS[normKey] || {
      primary: "#64748B",
      bg: "#F8FAFC",
      border: "#E2E8F0",
      text: "#64748B",
      bar: "#94A3B8",
    }
  );
};

/**
 * Returns badge styling object for a given raw channel name.
 */
export const getChannelBadgeStyle = (channelName) => {
  return (
    CHANNEL_BADGE_STYLES[channelName] || {
      bg: "#F8FAFC",
      border: "#E2E8F0",
      text: "#64748B",
    }
  );
};
