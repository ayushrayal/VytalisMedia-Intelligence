const User = require("../models/user.model");
const { generateAccessToken } = require("../utils/jwt.util");
const logger = require("../utils/logger.util");

/**
 * Registers a new user account.
 *
 * @param {Object} payload - User signup data
 * @param {string} payload.name - Full name of the user
 * @param {string} payload.email - User email address
 * @param {string} payload.password - Plain text password
 * @param {string} payload.accessCode - Access verification code
 * @returns {Object} Object containing sanitized user record and access token
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

  // Fetch sanitized user object without password
  const user = await User.findById(createdUser._id);

  return {
    user,
    accessToken,
  };
};

/**
 * Authenticates a user with email and password.
 *
 * @param {Object} payload - User login credentials
 * @param {string} payload.email - User email address
 * @param {string} payload.password - Plain text password
 * @returns {Object} Object containing sanitized user record and access token
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

  // Fetch sanitized user object without password
  const sanitizedUser = await User.findById(user._id);

  return {
    user: sanitizedUser,
    accessToken,
  };
};

/**
 * Retrieves user profile by user ID.
 *
 * @param {string} userId - User ID from JWT payload
 * @returns {Object} User document
 */
const getUserById = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    logger.warn(`User lookup failed for ID: ${userId}`);
    const err = new Error("User not found");
    err.statusCode = 404;
    throw err;
  }

  return user;
};

module.exports = {
  signupUser,
  loginUser,
  getUserById,
};
