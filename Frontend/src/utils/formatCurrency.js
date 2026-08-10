/**
 * Currency formatting utility for Vytalis Intelligence.
 * Safely formats amounts according to currency code (e.g. INR -> ₹, USD -> $).
 * 
 * @param {number|string} amount - Monetary amount
 * @param {string} [currencyCode="USD"] - ISO currency code
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount, currencyCode = "USD") => {
  if (amount === null || amount === undefined || isNaN(Number(amount))) {
    return "-";
  }

  const numericValue = Number(amount);
  const code = (currencyCode || "USD").toUpperCase();

  try {
    return new Intl.NumberFormat("en-US", {
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
