const User = require("../models/user.model");
const Organization = require("../models/organization.model");
const logger = require("./logger.util");

/**
 * Centralized Integration Context Resolver for Vytalis Intelligence.
 * Resolves effective integration owner (Client or target Organization owner) for any authenticated user role.
 *
 * Rules:
 * - Client: returns own user document (self)
 * - Member: finds user.organizationId -> Organization -> ownerId -> Client User
 * - Admin: if explicitOrgId provided, validates Organization -> ownerId -> Client User; else returns self.
 * - Root Admin: if explicitOrgId provided, finds Organization -> ownerId -> Client User; else returns self.
 *
 * @param {Object} user - Authenticated user document (req.user)
 * @param {string|null} [explicitOrgId] - Optional explicit target organizationId
 * @returns {Promise<{ integrationUser: Object, organization: Object|null }>}
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
    return { integrationUser: userObj, organization: org };
  }

  // 2. Member: Resolves parent Client via assignedClientId or organizationId
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

  // 3. Admin & Root Admin with explicit target organizationId or fallback to connected Client
  const targetOrgId = explicitOrgId || (user.organizationId ? user.organizationId.toString() : null);
  if (targetOrgId) {
    const org = await Organization.findById(targetOrgId).lean();
    if (org && org.ownerId) {
      const clientUser = await User.findById(org.ownerId);
      if (clientUser) {
        return { integrationUser: clientUser, organization: org };
      }
    }
  }

  const hasMeta = Boolean(user.integrations?.meta?.length);
  const hasShopify = Boolean(user.integrations?.shopify?.length);

  if (!hasMeta && !hasShopify && (user.role === "admin" || user.role === "root_admin" || user.isRootAdmin)) {
    const firstConnectedClient = await User.findOne({
      role: "client",
      $or: [
        { "integrations.meta.0": { $exists: true } },
        { "integrations.shopify.0": { $exists: true } },
      ],
    });
    if (firstConnectedClient) {
      let org = null;
      if (firstConnectedClient.organizationId) {
        org = await Organization.findById(firstConnectedClient.organizationId).lean();
      }
      return { integrationUser: firstConnectedClient, organization: org };
    }
  }

  // Fallback: Return self
  return { integrationUser: user, organization: null };
};

module.exports = {
  getEffectiveIntegrationContext,
};
