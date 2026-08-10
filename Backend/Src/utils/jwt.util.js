const jwt = require("jsonwebtoken");

/**
 * Generates an Access Token for authenticated users.
 * Payload strictly contains { id }.
 *
 * @param {Object} payload - Token payload containing user id
 * @returns {string} Signed JWT access token
 */
const generateAccessToken = (payload) => {
  const secret = process.env.JWT_SECRET_TOKEN;
  if (!secret) {
    throw new Error("JWT_SECRET_TOKEN is not configured in environment.");
  }

  return jwt.sign({ id: payload.id }, secret, { expiresIn: "7d" });
};

/**
 * Verifies an Access Token.
 *
 * @param {string} token - Bearer JWT access token
 * @returns {Object} Decoded token payload
 */
const verifyAccessToken = (token) => {
  const secret = process.env.JWT_SECRET_TOKEN;
  if (!secret) {
    throw new Error("JWT_SECRET_TOKEN is not configured in environment.");
  }

  return jwt.verify(token, secret);
};

module.exports = {
  generateAccessToken,
  verifyAccessToken,
};
