const authService = require("../services/auth.service");
const { sendSuccess } = require("../utils/api-response.util");
const { setAuthCookies, clearAuthCookies } = require("../utils/cookie.util");

/**
 * Handles user signup requests.
 * Endpoint: POST /api/auth/signup
 */
const signup = async (req, res, next) => {
  try {
    const { name, email, password, accessCode } = req.body;
    const result = await authService.signupUser({
      name,
      email,
      password,
      accessCode,
    });

    // Set HttpOnly cookies (access_token & refresh_token)
    setAuthCookies(res, result.accessToken, result.refreshToken);

    // Return sanitized response without raw JWTs in body
    return sendSuccess(res, 201, "User registered successfully", {
      user: result.user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Handles user login requests.
 * Endpoint: POST /api/auth/login
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await authService.loginUser({
      email,
      password,
    });

    // Set HttpOnly cookies (access_token & refresh_token)
    setAuthCookies(res, result.accessToken, result.refreshToken);

    // Return sanitized response without raw JWTs in body
    return sendSuccess(res, 200, "Login successful", {
      user: result.user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Handles token refresh requests using HttpOnly refresh cookie.
 * Endpoint: POST /api/auth/refresh
 */
const refresh = async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.refresh_token;
    const result = await authService.refreshAccessToken({ refreshToken });

    // Set updated HttpOnly cookies (rotated access_token & refresh_token)
    setAuthCookies(res, result.accessToken, result.refreshToken);

    return sendSuccess(res, 200, "Token refreshed successfully", {
      user: result.user,
    });
  } catch (error) {
    // Clear cookies if refresh failed
    clearAuthCookies(res);
    next(error);
  }
};

/**
 * Handles user logout requests, revoking refresh session and clearing cookies.
 * Endpoint: POST /api/auth/logout
 */
const logout = async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.refresh_token;
    await authService.logoutUser({ refreshToken });

    // Clear HttpOnly cookies
    clearAuthCookies(res);

    return sendSuccess(res, 200, "Logout successful", null);
  } catch (error) {
    clearAuthCookies(res);
    next(error);
  }
};

/**
 * Handles current user profile requests.
 * Endpoint: GET /api/auth/me
 */
const getMe = async (req, res, next) => {
  try {
    const user = await authService.getUserById(req.user._id);
    return sendSuccess(res, 200, "User profile retrieved successfully", { user });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  signup,
  login,
  refresh,
  logout,
  getMe,
};
