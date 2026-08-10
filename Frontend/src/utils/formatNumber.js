/**
 * Number formatting utility for Vytalis Intelligence.
 * Formats large numbers compactly (e.g. 12500 -> 12.5K, 1200000 -> 1.2M).
 * 
 * @param {number|string} value - Raw numeric value
 * @returns {string} Compact formatted number string
 */
export const formatNumber = (value) => {
  if (value === null || value === undefined || isNaN(Number(value))) {
    return "-";
  }

  const num = Number(value);
  const absNum = Math.abs(num);

  if (absNum >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (absNum >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }

  return num.toLocaleString();
};
