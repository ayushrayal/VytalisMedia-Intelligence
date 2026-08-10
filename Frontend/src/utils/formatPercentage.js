/**
 * Percentage formatting utility for Vytalis Intelligence.
 * Formats ratio or percentage value into readable percentage representation.
 * 
 * @param {number|string} value - Decimal ratio (e.g. 0.0415) or percentage
 * @param {number} [decimals=2] - Number of decimal places
 * @returns {string} Formatted percentage string (e.g. "4.15%")
 */
export const formatPercentage = (value, decimals = 2) => {
  if (value === null || value === undefined || isNaN(Number(value))) {
    return "-";
  }

  const num = Number(value);
  // If decimal fraction (e.g., 0.0415), multiply by 100
  const percentageValue = Math.abs(num) <= 1 && num !== 0 ? num * 100 : num;

  return `${percentageValue.toFixed(decimals)}%`;
};
