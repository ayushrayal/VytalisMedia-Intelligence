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

    // 1. ROOT ADMIN: Unrestricted global authority. Never blocked by organizationId.
    if (user.role === "root_admin" || user.isRootAdmin === true) {
      const explicitOrgId =
        extractValidOrgId(req.params?.organizationId) ||
        extractValidOrgId(req.query?.organizationId) ||
        extractValidOrgId(req.body?.organizationId);
      if (explicitOrgId) {
        const org = await Organization.findById(explicitOrgId).lean();
        if (org) req.organization = org;
      }
      return next();
    }

    // Extract explicit target organizationId from request (params, query, or body)
    const explicitOrgId =
      extractValidOrgId(req.params?.organizationId) ||
      extractValidOrgId(req.query?.organizationId) ||
      extractValidOrgId(req.body?.organizationId);

    // 2. ADMIN / FOUNDER: Manages assigned organizations
    if (user.role === "admin") {
      if (!explicitOrgId) {
        return next();
      }

      const org = await Organization.findById(explicitOrgId).lean();
      if (!org) {
        return sendError(res, 404, "Target organization not found.");
      }
      if (org.status === "disabled") {
        return sendError(res, 403, "Access denied. Target organization has been disabled.");
      }

      const isOwner = org.ownerId && org.ownerId.toString() === user._id.toString();
      let assignment = null;
      if (!isOwner) {
        assignment = await AdminAssignment.findOne({
          adminId: user._id,
          organizationId: explicitOrgId,
          status: "active",
        }).lean();
      }

      if (!isOwner && !assignment) {
        logger.warn(`Admin scoping blocked: Admin ${user._id} attempted access to unassigned Org ${explicitOrgId}`);
        return sendError(res, 403, "Access denied. You are not assigned to manage this organization.");
      }

      req.organization = org;
      return next();
    }

    // 3. MEMBER: Resolves organization via assignedClientId -> Client -> Organization
    let resolvedOrgId = null;
    let resolvedClientId = null;
    let parentClient = null;

    if (user.role === "member") {
      if (user.assignedClientId) {
        const cleanClientId = extractValidOrgId(user.assignedClientId);
        if (cleanClientId) {
          parentClient = await User.findById(cleanClientId).lean();
          if (parentClient) {
            resolvedClientId = parentClient._id.toString();
            resolvedOrgId = extractValidOrgId(parentClient.organizationId);
          }
        }
      }

      if (!resolvedOrgId && user.organizationId) {
        resolvedOrgId = extractValidOrgId(user.organizationId);
      }
    }
    // 4. CLIENT: Resolves organization via user.organizationId
    else if (user.role === "client") {
      resolvedOrgId = extractValidOrgId(user.organizationId);

      if (!resolvedOrgId) {
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
        resolvedOrgId = org._id.toString();
      }
      resolvedClientId = user._id.toString();
    }

    if (!resolvedOrgId) {
      logger.warn(
        `Organization access denied: User ${user._id} (role: ${user.role}, assignedClientId: ${user.assignedClientId}) has no valid organization context.`
      );
      return sendError(res, 403, "Access denied. No active organization context found.");
    }

    // Target organization is explicitOrgId if supplied, or user's resolvedOrgId
    const targetOrgId = explicitOrgId || resolvedOrgId;

    // Strict Cross-Tenant Protection: Client / Member can only access their own organization
    if (targetOrgId !== resolvedOrgId) {
      logger.warn(
        `Cross-tenant access blocked: User ${user._id} (Org ${resolvedOrgId}) attempted access to Org ${targetOrgId}`
      );
      return sendError(res, 403, "Access denied. You do not have permission to access this organization's resources.");
    }

    const org = await Organization.findById(targetOrgId).lean();
    if (!org) {
      return sendError(res, 404, "Organization not found.");
    }
    if (org.status === "disabled") {
      return sendError(res, 403, "Access denied. Your Client Organization has been disabled.");
    }

    req.organization = org;
    req.resolvedClientId = resolvedClientId;
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
