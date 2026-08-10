const authService = require("../services/auth.service");
const { sendSuccess } = require("../utils/api-response.util");

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

    return sendSuccess(res, 201, "User registered successfully", result);
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

    return sendSuccess(res, 200, "Login successful", result);
  } catch (error) {
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
  getMe,
};
