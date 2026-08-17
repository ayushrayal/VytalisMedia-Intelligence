const jwt = require("jsonwebtoken");

/**
 * Generates a short-lived Access Token (15 minutes).
 * Payload strictly contains { id }.
 *
 * @param {Object} payload - Object containing user id
 * @returns {string} Signed JWT access token
 */
const generateAccessToken = (payload) => {
  const secret = process.env.JWT_SECRET_TOKEN;
  if (!secret) {
    throw new Error("JWT_SECRET_TOKEN is not configured in environment.");
  }

  return jwt.sign({ id: payload.id }, secret, { expiresIn: "15m" });
};

/**
 * Generates a long-lived Refresh Token (7 days).
 * Payload contains { id, sessionId }.
 *
 * @param {Object} payload - Object containing user id and refresh sessionId
 * @returns {string} Signed JWT refresh token
 */
const generateRefreshToken = (payload) => {
  const secret = process.env.JWT_REFRESH_SECRET_TOKEN || process.env.JWT_SECRET_TOKEN;
  if (!secret) {
    throw new Error("JWT_SECRET_TOKEN is not configured in environment.");
  }

  return jwt.sign(
    { id: payload.id, sessionId: payload.sessionId },
    secret,
    { expiresIn: "7d" }
  );
};

/**
 * Verifies an Access Token.
 *
 * @param {string} token - JWT access token
 * @returns {Object} Decoded token payload
 */
const verifyAccessToken = (token) => {
  const secret = process.env.JWT_SECRET_TOKEN;
  if (!secret) {
    throw new Error("JWT_SECRET_TOKEN is not configured in environment.");
  }

  return jwt.verify(token, secret);
};

/**
 * Verifies a Refresh Token.
 *
 * @param {string} token - JWT refresh token
 * @returns {Object} Decoded token payload
 */
const verifyRefreshToken = (token) => {
  const secret = process.env.JWT_REFRESH_SECRET_TOKEN || process.env.JWT_SECRET_TOKEN;
  if (!secret) {
    throw new Error("JWT_SECRET_TOKEN is not configured in environment.");
  }

  return jwt.verify(token, secret);
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};
