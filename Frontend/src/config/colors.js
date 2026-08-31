/**
 * Canonical Frontend Color Palette for Vytalis Intelligence (Task #26).
 * Authoritative single source of truth for design system color tokens.
 *
 * DO NOT ALTER VALUES - APPROVED CANONICAL PALETTE
 */

export const CANONICAL_COLORS = {
  background: "#FFFFFF",
  surface: "#F7F9FC",
  border: "#E8EAED",
  accent: "#0A84FF",
  accentHover: "#0060DF",
  positive: "#16A34A",
  negative: "#E5484D",
  warning: "#F59E0B",
  gradient: "linear-gradient(#F2F8FF, #EAF3FF)",
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = { CANONICAL_COLORS };
}

export default CANONICAL_COLORS;
