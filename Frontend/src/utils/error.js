/**
 * Error formatting utility for Vytalis Intelligence.
 * Extracts human-readable error messages from API or runtime error objects.
 * 
 * @param {Object|Error|string} error - Error instance or API error payload
 * @returns {string} User-friendly error message
 */
export const getErrorMessage = (error) => {
  if (!error) return "An unexpected error occurred.";

  if (typeof error === "string") return error;

  if (error.message) return error.message;

  if (error.data && error.data.message) return error.data.message;

  if (error.errors && Array.isArray(error.errors) && error.errors.length > 0) {
    return error.errors.map((e) => e.message || e.field || e).join(", ");
  }

  return "An unexpected error occurred. Please try again.";
};
