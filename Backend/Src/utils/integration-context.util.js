const User = require("../models/user.model");
const Organization = require("../models/organization.model");
const AdminAssignment = require("../models/admin-assignment.model");
const logger = require("./logger.util");
const { getCachedContext, setCachedContext } = require("./user-cache.util");

/**
 * Centralized Integration Context Resolver for Vytalis Intelligence.
 * Resolves effective integration owner (Client or target Organization owner) for any authenticated user role.
 *
 * Rules:
 * - Client: returns own user document (self) and own Organization
 * - Member: strictly resolves assigned Client (via assignedClientId or organizationId); ignores cross-tenant explicitOrgId
 * - Admin: requires explicit organization context (explicitOrgId or user.organizationId) AND verified AdminAssignment/ownership; returns null if missing/unassigned. NO firstConnectedClient fallback!
 * - Root Admin: resolves explicit target Organization owner if explicitOrgId/organizationId provided; else returns null context. NO arbitrary client fallback!
 *
 * @param {Object} user - Authenticated user document (req.user)
 * @param {string|null} [explicitOrgId] - Optional explicit target organizationId
 * @returns {Promise<{ integrationUser: Object|null, organization: Object|null, error?: string }>}
 */
const getEffectiveIntegrationContext = async (user, explicitOrgId = null) => {
  if (!user) {
    return { integrationUser: null, organization: null };
  }

  let userObj = typeof user === "object" ? user : null;
  if (!userObj && user) {
    userObj = await User.findById(user);
  }

  if (!userObj) {
    return { integrationUser: null, organization: null };
  }

  const userId = String(userObj._id);
  const cached = getCachedContext(userId, explicitOrgId);
  if (cached) {
    return cached;
  }

  // 1. Client: Returns self and own Organization
  if (userObj.role === "client") {
    let org = null;
    const orgId = typeof userObj.organizationId === "object" && userObj.organizationId?._id ? userObj.organizationId._id : userObj.organizationId;
    if (orgId) {
      org = await Organization.findById(orgId).lean();
    }
    if (!org) {
      org = await Organization.findOne({ ownerId: userObj._id }).lean();
    }
    const result = { integrationUser: userObj, organization: org };
    setCachedContext(userId, explicitOrgId, result);
    return result;
  }

  // 2. Member: Resolves parent Client strictly via assignedClientId or organizationId (ignores caller explicitOrgId if cross-tenant)
  if (userObj.role === "member") {
    let clientUser = null;
    let org = null;

    if (userObj.assignedClientId) {
      const cleanClientId = typeof userObj.assignedClientId === "object" && userObj.assignedClientId?._id
        ? userObj.assignedClientId._id
        : userObj.assignedClientId;
      clientUser = await User.findById(cleanClientId);
    }

    if (!clientUser && userObj.organizationId) {
      const cleanOrgId = typeof userObj.organizationId === "object" && userObj.organizationId?._id
        ? userObj.organizationId._id
        : userObj.organizationId;
      org = await Organization.findById(cleanOrgId).lean();
      if (org && org.ownerId) {
        clientUser = await User.findById(org.ownerId);
      }
    }

    if (!org && clientUser && clientUser.organizationId) {
      org = await Organization.findById(clientUser.organizationId).lean();
    }

    return {
      integrationUser: clientUser || userObj,
      organization: org,
    };
  }

  // 3. Admin & Root Admin Resolution
  const targetOrgId = explicitOrgId || (userObj.organizationId ? userObj.organizationId.toString() : null);

  if (userObj.role === "admin") {
    if (!targetOrgId) {
      logger.warn(`Integration context denied: Admin ${userObj._id} requested integration context without explicit organizationId.`);
      return { integrationUser: null, organization: null, error: "Explicit organization context required for Admin." };
    }

    const org = await Organization.findById(targetOrgId).lean();
    if (!org) {
      return { integrationUser: null, organization: null, error: "Target organization not found." };
    }

    const isOwner = org.ownerId && org.ownerId.toString() === userObj._id.toString();
    let assignment = null;
    if (!isOwner) {
      assignment = await AdminAssignment.findOne({
        adminId: userObj._id,
        organizationId: targetOrgId,
        status: "active",
      }).lean();
    }

    if (!isOwner && !assignment) {
      logger.warn(`Integration context denied: Admin ${userObj._id} is not assigned to Org ${targetOrgId}`);
      return { integrationUser: null, organization: null, error: "Access denied. You are not assigned to manage this organization." };
    }

    const clientUser = await User.findById(org.ownerId);
    return { integrationUser: clientUser || userObj, organization: org };
  }

  if (userObj.role === "root_admin" || userObj.isRootAdmin) {
    if (targetOrgId) {
      const org = await Organization.findById(targetOrgId).lean();
      if (org && org.ownerId) {
        const clientUser = await User.findById(org.ownerId);
        if (clientUser) {
          return { integrationUser: clientUser, organization: org };
        }
      }
      return { integrationUser: userObj, organization: org || null };
    }
    return { integrationUser: null, organization: null };
  }

  // Fallback: Return self if valid
  return { integrationUser: userObj, organization: null };
};

module.exports = {
  getEffectiveIntegrationContext,
};
