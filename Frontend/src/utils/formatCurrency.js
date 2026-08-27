/**
 * Currency formatting utility for Vytalis Intelligence.
 * Safely formats amounts according to currency code (e.g. INR -> ₹, USD -> $).
 * 
 * @param {number|string} amount - Monetary amount
 * @param {string} [currencyCode="USD"] - ISO currency code
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount, currencyCode = "INR") => {
  if (amount === null || amount === undefined || isNaN(Number(amount))) {
    return "-";
  }

  const numericValue = Number(amount);
  const code = (currencyCode || "INR").toUpperCase();

  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: code,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numericValue);
  } catch (error) {
    // Fallback if Intl fails
    const symbolMap = { INR: "₹", USD: "$", EUR: "€", GBP: "£" };
    const symbol = symbolMap[code] || `${code} `;
    return `${symbol}${numericValue.toFixed(2)}`;
  }
};

/**
 * Strictly formats an amount as Indian Rupee (₹).
 */
export const formatCurrencyINR = (amount) => {
  return formatCurrency(amount, "INR");
};

