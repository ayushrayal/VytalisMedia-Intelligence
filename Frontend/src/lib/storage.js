/**
 * Storage utility for Vytalis Intelligence frontend.
 * Manages JWT access token storage strictly via localStorage["accessToken"].
 * 
 * SECURITY:
 * - Never stores passwords, WINDSOR_API_KEY, REDIS_URI, or backend secrets.
 * - Never logs access tokens.
 */

const TOKEN_KEY = "accessToken";

export const getAccessToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY) || null;
  } catch (error) {
    return null;
  }
};

export const setAccessToken = (token) => {
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    }
  } catch (error) {
    // Silent fail on storage error
  }
};

export const removeAccessToken = () => {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch (error) {
    // Silent fail on storage error
  }
};
