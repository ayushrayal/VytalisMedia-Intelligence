const AuditLog = require("../models/audit-log.model");
const logger = require("./logger.util");

/**
 * Sanitizes object metadata to ensure no sensitive fields (passwords, tokens, secrets)
 * are accidentally persisted in audit logs.
 */
const sanitizeAuditData = (data) => {
  if (!data || typeof data !== "object") return data;

  const SENSITIVE_KEYS = [
    "password",
    "access_token",
    "refresh_token",
    "accessToken",
    "refreshToken",
    "accessCode",
    "ADMIN_UPGRADE_KEY",
    "cookie",
    "cookies",
    "secret",
    "token",
  ];

  const sanitized = Array.isArray(data) ? [] : {};

  for (const [key, value] of Object.entries(data)) {
    if (SENSITIVE_KEYS.some((sKey) => key.toLowerCase().includes(sKey.toLowerCase()))) {
      sanitized[key] = "[REDACTED]";
    } else if (value && typeof value === "object") {
      sanitized[key] = sanitizeAuditData(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
};

/**
 * Records a security-sensitive event to the AuditLog database collection.
 * Non-blocking: Errors are caught and logged without breaking core user action.
 */
const logAuditEvent = async ({
  actorId,
  targetUserId = null,
  organizationId = null,
  action,
  permissionKey = null,
  oldValue = null,
  newValue = null,
  metadata = {},
}) => {
  try {
    if (!actorId || !action) {
      logger.warn("Audit log skipped: missing required actorId or action");
      return;
    }

    const sanitizedOld = sanitizeAuditData(oldValue);
    const sanitizedNew = sanitizeAuditData(newValue);
    const sanitizedMeta = sanitizeAuditData(metadata);

    await AuditLog.create({
      actorId,
      targetUserId,
      organizationId,
      action,
      permissionKey,
      oldValue: sanitizedOld,
      newValue: sanitizedNew,
      metadata: sanitizedMeta,
    });
  } catch (error) {
    logger.error(`Audit logging failed for action '${action}': ${error.message}`);
  }
};

module.exports = {
  logAuditEvent,
  sanitizeAuditData,
};
