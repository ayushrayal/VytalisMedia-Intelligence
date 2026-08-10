const Joi = require("joi");
const { sendError } = require("../utils/api-response.util");

/**
 * Validation schema for adding a Meta account.
 */
const addAccountSchema = Joi.object({
  accountId: Joi.string().trim().required().messages({
    "string.empty": "accountId is required and cannot be empty",
    "any.required": "accountId is required",
  }),
  accountName: Joi.string().trim().required().messages({
    "string.empty": "accountName is required and cannot be empty",
    "any.required": "accountName is required",
  }),
});

/**
 * Validation schema for updating a Meta account (allows accountId and/or accountName).
 * Rejects empty bodies, unknown fields, and trims strings.
 */
const updateAccountSchema = Joi.object({
  accountId: Joi.string().trim().messages({
    "string.empty": "accountId cannot be empty",
  }),
  accountName: Joi.string().trim().messages({
    "string.empty": "accountName cannot be empty",
  }),
})
  .min(1)
  .unknown(false)
  .messages({
    "object.min": "At least one field (accountId or accountName) must be provided for update",
    "object.unknown": "Unknown field in update body is forbidden",
  });

/**
 * Validation schema for accountId URL parameter.
 */
const accountIdParamSchema = Joi.object({
  accountId: Joi.string().trim().required().messages({
    "string.empty": "accountId URL parameter cannot be empty",
    "any.required": "accountId URL parameter is required",
  }),
});

/**
 * Validation schema for setting active Meta account.
 * Rejects empty body, unknown fields, whitespace-only accountId.
 */
const setActiveMetaAccountSchema = Joi.object({
  accountId: Joi.string().trim().required().messages({
    "string.empty": "accountId is required and cannot be empty",
    "any.required": "accountId is required",
  }),
})
  .unknown(false)
  .messages({
    "object.unknown": "Unknown field in request body is forbidden",
  });

/**
 * Middleware to validate payload for adding a Meta account.
 */
const validateAddAccount = (req, res, next) => {
  const { error } = addAccountSchema.validate(req.body, { abortEarly: false });

  if (error) {
    const formattedErrors = error.details.map((detail) => ({
      field: detail.path[0],
      message: detail.message,
    }));
    return sendError(res, 400, "Validation failed", formattedErrors);
  }

  next();
};

/**
 * Middleware to validate payload for setting active Meta account.
 */
const validateSetActiveMetaAccount = (req, res, next) => {
  const { error } = setActiveMetaAccountSchema.validate(req.body, { abortEarly: false });

  if (error) {
    const formattedErrors = error.details.map((detail) => ({
      field: detail.path[0] || "body",
      message: detail.message,
    }));
    return sendError(res, 400, "Validation failed", formattedErrors);
  }

  next();
};

/**
 * Middleware to validate payload for updating a Meta account.
 */
const validateUpdateAccount = (req, res, next) => {
  const { error } = updateAccountSchema.validate(req.body, { abortEarly: false });

  if (error) {
    const formattedErrors = error.details.map((detail) => ({
      field: detail.path[0] || "body",
      message: detail.message,
    }));
    return sendError(res, 400, "Validation failed", formattedErrors);
  }

  next();
};

/**
 * Middleware to validate accountId parameter in route.
 */
const validateAccountIdParam = (req, res, next) => {
  const { error } = accountIdParamSchema.validate(req.params, { abortEarly: false });

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
  validateAddAccount,
  validateSetActiveMetaAccount,
  validateUpdateAccount,
  validateAccountIdParam,
};
