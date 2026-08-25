/**
 * Percentage formatting utility for Vytalis Intelligence.
 * Formats ratio or percentage value into readable percentage representation.
 * 
 * @param {number|string} value - Percentage value (e.g. 2.39 for 2.39%) or ratio
 * @param {number} [decimals=2] - Number of decimal places
 * @param {boolean} [isRatio=false] - Set to true if value is a decimal ratio (e.g. 0.0415 for 4.15%)
 * @returns {string} Formatted percentage string (e.g. "4.15%")
 */
export const formatPercentage = (value, decimals = 2, isRatio = false) => {
  if (value === null || value === undefined || isNaN(Number(value))) {
    return "-";
  }

  const num = Number(value);
  const percentageValue = isRatio ? num * 100 : num;

  return `${percentageValue.toFixed(decimals)}%`;
};
