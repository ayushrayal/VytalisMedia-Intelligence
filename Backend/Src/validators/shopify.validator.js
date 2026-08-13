const Joi = require("joi");
const { sendError } = require("../utils/api-response.util");

/**
 * Validation schema for adding a Shopify account.
 * Requires ONLY shopName and accountName from user payload.
 * Forbids unknown/system-managed fields in body.
 */
const addAccountSchema = Joi.object({
  shopName: Joi.string().trim().required().messages({
    "string.empty": "shopName is required and cannot be empty",
    "any.required": "shopName is required",
  }),
  accountName: Joi.string().trim().required().messages({
    "string.empty": "accountName is required and cannot be empty",
    "any.required": "accountName is required",
  }),
})
  .unknown(false)
  .messages({
    "object.unknown": "Unknown or system field in request body is forbidden",
  });

/**
 * Validation schema for updating a Shopify account.
 * Allows updating ONLY shopName and/or accountName.
 * Rejects empty bodies, system fields, and unknown fields.
 */
const updateAccountSchema = Joi.object({
  shopName: Joi.string().trim().messages({
    "string.empty": "shopName cannot be empty",
  }),
  accountName: Joi.string().trim().messages({
    "string.empty": "accountName cannot be empty",
  }),
})
  .min(1)
  .unknown(false)
  .messages({
    "object.min": "At least one field (shopName or accountName) must be provided for update",
    "object.unknown": "Unknown or system field in update body is forbidden",
  });

/**
 * Validation schema for accountName / id URL parameter.
 */
const accountIdParamSchema = Joi.object({
  id: Joi.string().trim().required().messages({
    "string.empty": "account identifier URL parameter cannot be empty",
    "any.required": "account identifier URL parameter is required",
  }),
});

/**
 * Validation schema for setting active Shopify account.
 * Requires accountName in body and forbids unknown fields.
 */
const setActiveShopifyAccountSchema = Joi.object({
  accountName: Joi.string().trim().required().messages({
    "string.empty": "accountName is required and cannot be empty",
    "any.required": "accountName is required",
  }),
})
  .unknown(false)
  .messages({
    "object.unknown": "Unknown field in request body is forbidden",
  });

/**
 * Middleware to validate payload for adding a Shopify account.
 */
const validateAddAccount = (req, res, next) => {
  const { error } = addAccountSchema.validate(req.body, { abortEarly: false });

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
 * Middleware to validate payload for setting active Shopify account.
 */
const validateSetActiveShopifyAccount = (req, res, next) => {
  const { error } = setActiveShopifyAccountSchema.validate(req.body, { abortEarly: false });

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
 * Middleware to validate payload for updating a Shopify account.
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
 * Middleware to validate account identifier URL parameter in route.
 */
const validateAccountIdParam = (req, res, next) => {
  const { error } = accountIdParamSchema.validate(req.params, { abortEarly: false });

  if (error) {
    const formattedErrors = error.details.map((detail) => ({
      field: detail.path[0] || "param",
      message: detail.message,
    }));
    return sendError(res, 400, "Validation failed", formattedErrors);
  }

  next();
};

module.exports = {
  validateAddAccount,
  validateSetActiveShopifyAccount,
  validateUpdateAccount,
  validateAccountIdParam,
};
