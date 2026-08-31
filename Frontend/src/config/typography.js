/**
 * Canonical Typography Tokens for Vytalis Intelligence (Task #27).
 * Authoritative single source of truth for typography definitions across the application.
 *
 * EXACT EXISTING APPROVED SCALES - DO NOT ALTER VALUES
 */

export const CANONICAL_TYPOGRAPHY = {
  fontFamily: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",

  // Headings
  h1: {
    fontSize: "26px",
    fontWeight: "700",
    letterSpacing: "-0.4px",
    lineHeight: "1.25",
  },
  h2: {
    fontSize: "20px",
    fontWeight: "700",
    letterSpacing: "-0.3px",
    lineHeight: "1.3",
  },
  h3: {
    fontSize: "16px",
    fontWeight: "650",
    letterSpacing: "-0.2px",
    lineHeight: "1.35",
  },
  h4: {
    fontSize: "14px",
    fontWeight: "650",
    lineHeight: "1.4",
  },

  // Body Text
  body: {
    fontSize: "14px",
    fontWeight: "400",
    lineHeight: "1.5",
  },
  bodyMedium: {
    fontSize: "14px",
    fontWeight: "500",
    lineHeight: "1.5",
  },
  bodySecondary: {
    fontSize: "13px",
    fontWeight: "400",
    lineHeight: "1.4",
  },
  bodyMuted: {
    fontSize: "12.5px",
    fontWeight: "400",
    lineHeight: "1.4",
  },

  // UI Components & Micro Typography
  label: {
    fontSize: "12px",
    fontWeight: "600",
    lineHeight: "1.3",
  },
  caption: {
    fontSize: "11px",
    fontWeight: "500",
    lineHeight: "1.3",
  },
  captionUpper: {
    fontSize: "11px",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  tableHeader: {
    fontSize: "11px",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  tableCell: {
    fontSize: "13px",
    fontWeight: "400",
  },

  // Metrics & Display
  metricValueLarge: {
    fontSize: "28px",
    fontWeight: "700",
    letterSpacing: "-0.5px",
  },
  metricValueMedium: {
    fontSize: "24px",
    fontWeight: "700",
    letterSpacing: "-0.3px",
  },
  metricValueSmall: {
    fontSize: "18px",
    fontWeight: "700",
  },

  // Buttons & Navigation
  button: {
    fontSize: "13px",
    fontWeight: "600",
    lineHeight: "1.25",
  },
  navItem: {
    fontSize: "13px",
    fontWeight: "500",
  },
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = { CANONICAL_TYPOGRAPHY };
}

export default CANONICAL_TYPOGRAPHY;
