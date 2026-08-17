/**
 * Cookie utility for setting and clearing secure HttpOnly authentication cookies.
 * Strictly adheres to P0.3 security specifications.
 */

const ACCESS_TOKEN_MAX_AGE_MS = 15 * 60 * 1000; // 15 minutes
const REFRESH_TOKEN_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

const getBaseCookieOptions = () => {
  const isProd = process.env.NODE_ENV === "production";
  const sameSite = process.env.COOKIE_SAMESITE || "Strict";

  return {
    httpOnly: true,
    secure: isProd,
    sameSite: sameSite,
  };
};

/**
 * Sets access_token and refresh_token HttpOnly cookies on the response.
 *
 * @param {Object} res - Express response object
 * @param {string} accessToken - Short-lived access JWT
 * @param {string} refreshToken - Long-lived refresh token
 */
const setAuthCookies = (res, accessToken, refreshToken) => {
  const baseOptions = getBaseCookieOptions();

  if (accessToken) {
    res.cookie("access_token", accessToken, {
      ...baseOptions,
      path: "/",
      maxAge: ACCESS_TOKEN_MAX_AGE_MS,
    });
  }

  if (refreshToken) {
    res.cookie("refresh_token", refreshToken, {
      ...baseOptions,
      path: "/api/auth",
      maxAge: REFRESH_TOKEN_MAX_AGE_MS,
    });
  }
};

/**
 * Clears access_token and refresh_token cookies from the response.
 *
 * @param {Object} res - Express response object
 */
const clearAuthCookies = (res) => {
  const baseOptions = getBaseCookieOptions();

  res.clearCookie("access_token", {
    ...baseOptions,
    path: "/",
  });

  res.clearCookie("refresh_token", {
    ...baseOptions,
    path: "/api/auth",
  });
};

module.exports = {
  setAuthCookies,
  clearAuthCookies,
  ACCESS_TOKEN_MAX_AGE_MS,
  REFRESH_TOKEN_MAX_AGE_MS,
};
