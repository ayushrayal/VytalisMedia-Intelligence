const Joi = require("joi");
const { sendError } = require("../utils/api-response.util");

const signupSchema = Joi.object({
  name: Joi.string().trim().required().messages({
    "string.empty": "Name is required",
    "any.required": "Name is required",
  }),
  email: Joi.string().trim().email().required().messages({
    "string.email": "Must be a valid email address",
    "string.empty": "Email is required",
    "any.required": "Email is required",
  }),
  password: Joi.string().min(6).required().messages({
    "string.min": "Password must be at least 6 characters long",
    "string.empty": "Password is required",
    "any.required": "Password is required",
  }),
  accessCode: Joi.string().trim().required().messages({
    "string.empty": "Access Code is required",
    "any.required": "Access Code is required",
  }),
});

const loginSchema = Joi.object({
  email: Joi.string().trim().email().required().messages({
    "string.email": "Must be a valid email address",
    "string.empty": "Email is required",
    "any.required": "Email is required",
  }),
  password: Joi.string().required().messages({
    "string.empty": "Password is required",
    "any.required": "Password is required",
  }),
});

const validateSignup = (req, res, next) => {
  const { error } = signupSchema.validate(req.body, { abortEarly: false });

  if (error) {
    const formattedErrors = error.details.map((detail) => ({
      field: detail.path[0],
      message: detail.message,
    }));
    return sendError(res, 400, "Validation failed", formattedErrors);
  }

  next();
};

const validateLogin = (req, res, next) => {
  const { error } = loginSchema.validate(req.body, { abortEarly: false });

  if (error) {
    const formattedErrors = error.details.map((detail) => ({
      field: detail.path[0],
      message: detail.message,
    }));
    return sendError(res, 400, "Validation failed", formattedErrors);
  }

  next();
};

module.exports = {
  validateSignup,
  validateLogin,
};
