const crypto = require("crypto");
const User = require("../models/user.model");
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} = require("../utils/jwt.util");
const cacheUtil = require("../utils/cache.util");
const logger = require("../utils/logger.util");

const REFRESH_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days

/**
 * Creates and stores a refresh session in Redis.
 * Structure: refresh_session:<sessionId> -> { userId, createdAt, expiresAt, revokedAt: null }
 *
 * @param {string} userId - User ID
 * @returns {Promise<{ sessionId: string, refreshToken: string }>} Session ID and signed refresh token
 */
const createRefreshSession = async (userId) => {
  const sessionId = crypto.randomBytes(32).toString("hex");
  const refreshToken = generateRefreshToken({ id: userId, sessionId });

  const sessionData = {
    userId: userId.toString(),
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_SECONDS * 1000).toISOString(),
    revokedAt: null,
  };

  const redisKey = `refresh_session:${sessionId}`;
  await cacheUtil.set(redisKey, sessionData, REFRESH_TOKEN_TTL_SECONDS);

  return { sessionId, refreshToken };
};

/**
 * Registers a new user account.
 * Requires valid access code.
 *
 * @param {Object} payload - User signup data
 * @returns {Object} Object containing sanitized user record, access token, and refresh token
 */
const signupUser = async ({ name, email, password, accessCode }) => {
  const envAccessCode = process.env.ACCESS_CODE;
  if (!envAccessCode) {
    logger.error("ACCESS_CODE is not defined in environment variables");
    const err = new Error("System configuration error");
    err.statusCode = 500;
    throw err;
  }

  if (!accessCode || accessCode.trim() !== envAccessCode.trim()) {
    logger.warn(`Failed signup attempt with invalid access code for email: ${email}`);
    const err = new Error("Invalid access code");
    err.statusCode = 400;
    throw err;
  }

  const normalizedEmail = email.trim().toLowerCase();

  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    logger.warn(`Duplicate signup attempt for email: ${normalizedEmail}`);
    const err = new Error("User with this email already exists");
    err.statusCode = 409;
    throw err;
  }

  const createdUser = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    password: password,
  });

  const accessToken = generateAccessToken({ id: createdUser._id });
  const { refreshToken } = await createRefreshSession(createdUser._id);

  const user = await User.findById(createdUser._id);
  const json = user.toJSON();
  json.effectivePermissions = await calculateAllEffectivePermissions(user);

  return {
    user: json,
    accessToken,
    refreshToken,
  };
};

/**
 * Authenticates a user with email and password.
 *
 * @param {Object} payload - User login credentials
 * @returns {Object} Object containing sanitized user record, access token, and refresh token
 */
const loginUser = async ({ email, password }) => {
  const normalizedEmail = email.trim().toLowerCase();

  const user = await User.findOne({ email: normalizedEmail }).select("+password");
  if (!user) {
    logger.warn(`Failed login attempt for non-existent email: ${normalizedEmail}`);
    const err = new Error("Invalid email or password");
    err.statusCode = 401;
    throw err;
  }

  const isPasswordValid = await user.matchPassword(password);
  if (!isPasswordValid) {
    logger.warn(`Failed login attempt (invalid password) for user ID: ${user._id}`);
    const err = new Error("Invalid email or password");
    err.statusCode = 401;
    throw err;
  }

  const accessToken = generateAccessToken({ id: user._id });
  const { refreshToken } = await createRefreshSession(user._id);

  const sanitizedUser = await User.findById(user._id);
  const json = sanitizedUser.toJSON();
  json.effectivePermissions = await calculateAllEffectivePermissions(sanitizedUser);

  return {
    user: json,
    accessToken,
    refreshToken,
  };
};

/**
 * Rotates an existing refresh token atomically and issues a new access token & refresh token.
 * Race-safe: Two concurrent refresh calls with the same token will result in exactly 1 success and 1 fail (401).
 *
 * @param {Object} payload
 * @param {string} payload.refreshToken - Raw refresh token from HttpOnly cookie
 * @returns {Object} Object containing sanitized user, new accessToken, and new refreshToken
 */
const refreshAccessToken = async ({ refreshToken }) => {
  if (!refreshToken) {
    const err = new Error("Refresh token missing");
    err.statusCode = 401;
    throw err;
  }

  let decoded;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch (error) {
    logger.warn(`Invalid or expired refresh token signature: ${error.message}`);
    const err = new Error("Invalid or expired refresh token");
    err.statusCode = 401;
    throw err;
  }

  const { id: userId, sessionId } = decoded;

  if (!sessionId) {
    const err = new Error("Malformed refresh token payload");
    err.statusCode = 401;
    throw err;
  }

  // RACE-SAFE ATOMIC CONSUMPTION:
  // Atomically get and delete the session from Redis so concurrent requests fail.
  const redisKey = `refresh_session:${sessionId}`;
  const existingSession = await cacheUtil.getDel(redisKey);

  if (!existingSession) {
    logger.warn(`Refresh session reuse attempt or missing session for ID: ${sessionId}`);
    const err = new Error("Invalid or expired refresh token");
    err.statusCode = 401;
    throw err;
  }

  if (existingSession.revokedAt) {
    logger.warn(`Attempt to use revoked refresh session: ${sessionId}`);
    const err = new Error("Refresh session has been revoked");
    err.statusCode = 401;
    throw err;
  }

  const user = await User.findById(userId);
  if (!user) {
    logger.warn(`User lookup failed during refresh for ID: ${userId}`);
    const err = new Error("User no longer exists");
    err.statusCode = 401;
    throw err;
  }

  // REFRESH TOKEN ROTATION: Issue new access token, new refresh token & new Redis session
  const newAccessToken = generateAccessToken({ id: user._id });
  const { refreshToken: newRefreshToken } = await createRefreshSession(user._id);

  return {
    user,
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
};

/**
 * Revokes a user's refresh session in Redis and logs out user.
 *
 * @param {Object} payload
 * @param {string} payload.refreshToken - Raw refresh token from cookie
 */
const logoutUser = async ({ refreshToken }) => {
  if (!refreshToken) {
    return true;
  }

  try {
    const decoded = verifyRefreshToken(refreshToken);
    if (decoded && decoded.sessionId) {
      const redisKey = `refresh_session:${decoded.sessionId}`;
      await cacheUtil.delete(redisKey);
    }
  } catch (error) {
    // Ignore invalid/expired token errors during logout
    logger.warn(`Logout token verification error (non-fatal): ${error.message}`);
  }

  return true;
};

const { calculateAllEffectivePermissions } = require("../utils/permission-calculator.util");

/**
 * Retrieves user profile by user ID.
 * Automatically attaches calculated effectivePermissions.
 *
 * @param {string} userId - User ID from JWT payload
 * @returns {Object} User document object with effectivePermissions
 */
const getUserById = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    logger.warn(`User lookup failed for ID: ${userId}`);
    const err = new Error("User not found");
    err.statusCode = 404;
    throw err;
  }

  const json = user.toJSON();
  json.effectivePermissions = await calculateAllEffectivePermissions(user);
  return json;
};

module.exports = {
  signupUser,
  loginUser,
  refreshAccessToken,
  logoutUser,
  getUserById,
};
