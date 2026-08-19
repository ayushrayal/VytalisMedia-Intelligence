/**
 * Error formatting and sanitization utility for Vytalis Intelligence frontend.
 * Maps internal, provider, network, and HTTP errors to safe, user-friendly messages.
 * Never leaks internal backend details, Windsor/provider names, or timeout values to the UI.
 * 
 * @param {Object|Error|string} error - Error instance, API error payload, or error message
 * @returns {string} User-friendly sanitized error message
 */
export const getErrorMessage = (error) => {
  if (!error) return "Unable to load data. Please try again.";

  // Extract HTTP status code if present
  const status = error.status || error.statusCode || error.response?.status;

  // Extract raw message string for pattern matching
  let rawMessage = "";
  if (typeof error === "string") {
    rawMessage = error;
  } else if (error.message) {
    rawMessage = error.message;
  } else if (error.data && error.data.message) {
    rawMessage = error.data.message;
  } else if (error.response && error.response.data && error.response.data.message) {
    rawMessage = error.response.data.message;
  } else if (error.errors && Array.isArray(error.errors) && error.errors.length > 0) {
    rawMessage = error.errors.map((e) => e.message || e.field || e).join(", ");
  }

  const lowerMsg = rawMessage.toLowerCase();

  // 1. Timeout, connection, or network failures
  if (
    lowerMsg.includes("timeout") ||
    lowerMsg.includes("econnaborted") ||
    lowerMsg.includes("etimedout") ||
    lowerMsg.includes("network error") ||
    lowerMsg.includes("failed to fetch") ||
    lowerMsg.includes("connection error") ||
    status === 504
  ) {
    return "Connection timeout. Please try again.";
  }

  // 2. Specific HTTP status codes
  if (status === 401 || lowerMsg.includes("unauthorized") || lowerMsg.includes("session expired")) {
    return "Your session has expired. Please sign in again.";
  }

  if (status === 403 || lowerMsg.includes("forbidden") || lowerMsg.includes("permission")) {
    return "You don't have permission to access this data.";
  }

  if (status === 404 || lowerMsg.includes("not found")) {
    return "Requested data could not be found.";
  }

  // 3. Provider/Windsor/internal backend leaks or generic 5xx server errors
  if (
    lowerMsg.includes("windsor") ||
    lowerMsg.includes("provider") ||
    lowerMsg.includes("axios") ||
    lowerMsg.includes("15000ms") ||
    lowerMsg.includes("502") ||
    lowerMsg.includes("503") ||
    status >= 500
  ) {
    return "Unable to load data. Please try again.";
  }

  // 4. Check for technical junk (URLs, stack traces, object outputs, API names)
  const isTechnicalJunk =
    rawMessage.includes("http://") ||
    rawMessage.includes("https://") ||
    rawMessage.includes("at ") ||
    rawMessage.includes("{") ||
    rawMessage.includes("Error:") ||
    rawMessage.includes("AxiosError");

  if (rawMessage && !isTechnicalJunk && rawMessage.length < 150) {
    return rawMessage;
  }

  return "Unable to load data. Please try again.";
};

/**
 * Alias for getErrorMessage to support explicit getUserFriendlyErrorMessage invocations.
 */
export const getUserFriendlyErrorMessage = getErrorMessage;

