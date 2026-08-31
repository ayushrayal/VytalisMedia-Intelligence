const mongoose = require("mongoose");
const User = require("../models/user.model");
const Organization = require("../models/organization.model");
const AdminAssignment = require("../models/admin-assignment.model");
const { sendError } = require("../utils/api-response.util");
const logger = require("../utils/logger.util");

/**
 * Safely extracts a valid MongoDB ObjectId string or returns null.
 * Prevents CastError (which leads to HTTP 500) when "undefined", "null", or invalid strings are passed.
 */
const extractValidOrgId = (val) => {
  if (!val) return null;
  if (typeof val === "object" && val._id) {
    val = val._id;
  }
  const str = String(val).trim();
  if (!str || str === "undefined" || str === "null") {
    return null;
  }
  return mongoose.Types.ObjectId.isValid(str) ? str : null;
};

const { getEffectiveIntegrationContext } = require("../utils/integration-context.util");
const { invalidateUserCache } = require("../utils/user-cache.util");

/**
 * Middleware enforcing multi-tenant organization data isolation.
 * Safe for Root Admins, Admins, Clients, Members, and Legacy Users.
 *
 * Rules:
 * - Root Admin: Unrestricted global access. Never blocked by organizationId.
 * - Admin: Can manage multiple organizations. If no explicit target organizationId requested, allowed to proceed.
 * - Client & Member: Scoped strictly to their assigned organizationId. Cross-tenant access blocked with 403.
 */
const requireOrganizationAccess = async (req, res, next) => {
  try {
    const user = req.user;
    if (!user) {
      return sendError(res, 401, "Not authorized, token missing or user not authenticated.");
    }

    const explicitOrgId =
      extractValidOrgId(req.params?.organizationId) ||
      extractValidOrgId(req.query?.organizationId) ||
      extractValidOrgId(req.body?.organizationId);

    // 1. ROOT ADMIN: Unrestricted global authority. Never blocked by organizationId.
    if (user.role === "root_admin" || user.isRootAdmin === true) {
      if (explicitOrgId) {
        const context = await getEffectiveIntegrationContext(user, explicitOrgId);
        if (context.organization) req.organization = context.organization;
      }
      return next();
    }

    // 2. ADMIN / FOUNDER: Manages assigned organizations
    if (user.role === "admin") {
      if (!explicitOrgId) {
        return next();
      }

      const context = await getEffectiveIntegrationContext(user, explicitOrgId);
      if (context.error) {
        return sendError(res, context.error.includes("not found") ? 404 : 403, context.error);
      }
      if (context.organization) {
        if (context.organization.status === "disabled") {
          return sendError(res, 403, "Access denied. Target organization has been disabled.");
        }
        req.organization = context.organization;
      }
      return next();
    }

    // 3. CLIENT & MEMBER: Resolves organization via getEffectiveIntegrationContext
    let context = await getEffectiveIntegrationContext(user, explicitOrgId);

    // Auto-create missing organization for legacy Client if needed
    if (user.role === "client" && !context.organization) {
      let org = await Organization.findOne({ ownerId: user._id });
      if (!org) {
        org = await Organization.create({
          name: `${user.name || "Client"}'s Organization`,
          ownerId: user._id,
          memberLimit: 5,
          status: "active",
        });
        logger.info(`Auto-created missing Organization ${org._id} for legacy Client ${user._id}`);
      }
      user.organizationId = org._id;
      await user.save().catch((e) => logger.warn(`Failed saving user.organizationId: ${e.message}`));
      invalidateUserCache(user._id);
      context = await getEffectiveIntegrationContext(user, explicitOrgId);
    }

    if (!context.organization) {
      logger.warn(
        `Organization access denied: User ${user._id} (role: ${user.role}, assignedClientId: ${user.assignedClientId}) has no valid organization context.`
      );
      return sendError(res, 403, "Access denied. No active organization context found.");
    }

    const resolvedOrgId = String(context.organization._id);

    // Strict Cross-Tenant Protection: Client / Member can only access their own organization
    if (explicitOrgId && explicitOrgId !== resolvedOrgId) {
      logger.warn(
        `Cross-tenant access blocked: User ${user._id} (Org ${resolvedOrgId}) attempted access to Org ${explicitOrgId}`
      );
      return sendError(res, 403, "Access denied. You do not have permission to access this organization's resources.");
    }

    if (context.organization.status === "disabled") {
      return sendError(res, 403, "Access denied. Your Client Organization has been disabled.");
    }

    req.organization = context.organization;
    req.resolvedClientId = context.integrationUser ? String(context.integrationUser._id) : null;
    req.resolvedOrganizationId = resolvedOrgId;
    return next();
  } catch (error) {
    console.error("[ORG AUTH ERROR]", {
      message: error?.message,
      stack: error?.stack,
      name: error?.name,
      userId: req.user?._id ? String(req.user._id) : null,
      role: req.user?.role || null,
      organizationId: req.user?.organizationId ? String(req.user.organizationId) : null,
      assignedClientId: req.user?.assignedClientId ? String(req.user.assignedClientId) : null,
    });
    logger.error(`Error in requireOrganizationAccess: ${error.message}`, {
      userId: req.user?._id ? String(req.user._id) : null,
      role: req.user?.role || null,
      organizationId: req.user?.organizationId ? String(req.user.organizationId) : null,
      assignedClientId: req.user?.assignedClientId ? String(req.user.assignedClientId) : null,
      errorStack: error.stack,
    });
    return sendError(res, 500, "Organization authorization server error.");
  }
};

module.exports = {
  requireOrganizationAccess,
  extractValidOrgId,
};
