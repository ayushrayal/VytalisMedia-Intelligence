/**
 * Storage utility for Vytalis Intelligence frontend.
 * 
 * SECURITY COMPLIANCE (P0.3):
 * Authentication tokens are managed strictly via HttpOnly cookies by the browser.
 * Tokens MUST NOT be stored in localStorage, sessionStorage, or JavaScript state.
 */

// Legacy helper functions maintained as safe no-ops to prevent import breakage
export const getAccessToken = () => null;
export const setAccessToken = () => {};
export const removeAccessToken = () => {
  try {
    localStorage.removeItem("accessToken");
  } catch (error) {
    // Ignore storage errors
  }
};
