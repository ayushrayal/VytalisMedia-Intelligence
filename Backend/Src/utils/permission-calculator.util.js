const mongoose = require("mongoose");
const User = require("../models/user.model");
const Organization = require("../models/organization.model");
const GlobalSettings = require("../models/global-settings.model");
const AdminAssignment = require("../models/admin-assignment.model");
const { ALL_PERMISSION_KEYS } = require("../config/permission-registry");

// Short-lived in-memory cache for GlobalSettings to avoid DB spam during batch checks
let globalSettingsCache = null;
let globalSettingsCacheTime = 0;
const CACHE_TTL_MS = 10 * 1000; // 10 seconds

const getCachedGlobalDeniedPermissions = async () => {
  const now = Date.now();
  if (globalSettingsCache && now - globalSettingsCacheTime < CACHE_TTL_MS) {
    return globalSettingsCache;
  }

  const settings = await GlobalSettings.findOne({}).lean();
  globalSettingsCache = Array.isArray(settings?.globalDeniedPermissions)
    ? settings.globalDeniedPermissions
    : [];
  globalSettingsCacheTime = now;
  return globalSettingsCache;
};

/**
 * Clears the in-memory GlobalSettings cache when settings are updated.
 */
const invalidateGlobalSettingsCache = () => {
  globalSettingsCache = null;
  globalSettingsCacheTime = 0;
};

/**
 * Helper to safely extract boolean permission value from User assignedPermissions (Array, Map, or Object)
 */
const getAssignedPermissionValue = (user, permissionKey) => {
  if (!user || !user.assignedPermissions) return false;

  // 1. Array of permission entry subdocuments: [{ key: "meta.campaigns", allowed: true }]
  if (Array.isArray(user.assignedPermissions)) {
    const entry = user.assignedPermissions.find((p) => p && p.key === permissionKey);
    return entry ? Boolean(entry.allowed) : false;
  }

  // 2. Map fallback
  if (user.assignedPermissions instanceof Map) {
    return Boolean(user.assignedPermissions.get(permissionKey));
  }

  // 3. Standard Dictionary Object: { "meta.campaigns": true }
  if (typeof user.assignedPermissions === "object") {
    return Boolean(user.assignedPermissions[permissionKey]);
  }

  return false;
};

/**
 * Calculates effective permission state for a target user and permissionKey.
 *
 * @param {Object} user - Authenticated or target User document/object
 * @param {string} permissionKey - Permission string (e.g. "meta.places")
 * @param {Object} [options] - Options for performance optimization (e.g. pre-fetched org or globalDenied)
 * @returns {Promise<{
 *   allowed: boolean,
 *   permissionKey: string,
 *   source: "root" | "admin" | "client" | "member",
 *   locked: boolean,
 *   lockReason: string|null,
 *   reason: string
 * }>}
 */
const calculateEffectivePermission = async (user, permissionKey, options = {}) => {
  if (!user) {
    return {
      allowed: false,
      permissionKey,
      source: "member",
      locked: true,
      lockReason: "account_disabled",
      reason: "User not authenticated or not found.",
    };
  }

  // STEP 1: Root Admin Bypass MUST HAPPEN FIRST!
  if (user.role === "root_admin" || user.isRootAdmin === true) {
    return {
      allowed: true,
      permissionKey,
      source: "root",
      locked: false,
      lockReason: null,
      reason: "Allowed by Root Admin authority.",
    };
  }

  // STEP 2: Account Status Check
  if (user.status === "disabled") {
    return {
      allowed: false,
      permissionKey,
      source: user.role || "client",
      locked: true,
      lockReason: "account_disabled",
      reason: "Account is disabled.",
    };
  }

  // STEP 3: Organization Status Check (for Client & Member)
  if (user.role === "client" || user.role === "member") {
    let org = options.organization;
    if (!org && user.organizationId) {
      org = await Organization.findById(user.organizationId).lean();
    }
    if (org && org.status === "disabled") {
      return {
        allowed: false,
        permissionKey,
        source: user.role,
        locked: true,
        lockReason: "organization_disabled",
        reason: "Organization is disabled.",
      };
    }
  }

  // STEP 4: Global Root Admin Explicit Deny Check
  const globalDenied = options.globalDeniedPermissions || (await getCachedGlobalDeniedPermissions());
  if (globalDenied.includes(permissionKey)) {
    return {
      allowed: false,
      permissionKey,
      source: "root",
      locked: true,
      lockReason: "disabled_by_root_admin",
      reason: "Globally disabled by Root Admin.",
    };
  }

  // STEP 5: Admin Level Evaluation
  if (user.role === "admin") {
    const isAssigned = getAssignedPermissionValue(user, permissionKey);
    return {
      allowed: isAssigned,
      permissionKey,
      source: "admin",
      locked: false,
      lockReason: null,
      reason: isAssigned ? "Allowed by Admin assignment." : "not_assigned",
    };
  }

  // STEP 6: Client Level Evaluation
  if (user.role === "client") {
    // Check if supervising Admin limits this Client
    let orgId = user.organizationId;
    if (typeof orgId === "object" && orgId !== null) {
      orgId = orgId._id ? orgId._id.toString() : String(orgId);
    }
    if (orgId && mongoose.Types.ObjectId.isValid(orgId)) {
      const activeAssignment = await AdminAssignment.findOne({
        organizationId: orgId,
        status: "active",
      }).lean();

      if (activeAssignment && activeAssignment.adminId) {
        const adminUser = await User.findById(activeAssignment.adminId).lean();
        if (adminUser) {
          const adminResult = await calculateEffectivePermission(adminUser, permissionKey, {
            globalDeniedPermissions: globalDenied,
          });
          if (!adminResult.allowed) {
            return {
              allowed: false,
              permissionKey,
              source: "admin",
              locked: true,
              lockReason: adminResult.lockReason || "disabled_by_admin",
              reason: "Disabled by supervising Admin.",
            };
          }
        }
      }
    }

    const isAssigned = getAssignedPermissionValue(user, permissionKey);
    return {
      allowed: isAssigned,
      permissionKey,
      source: "client",
      locked: false,
      lockReason: null,
      reason: isAssigned ? "Allowed by Client assignment." : "not_assigned",
    };
  }

  // STEP 7: Member Level Evaluation
  if (user.role === "member") {
    let parentClient = options.parentClient;
    if (!parentClient && user.assignedClientId) {
      // Check if user.assignedClientId is a populated User object (has a role property)
      if (typeof user.assignedClientId === "object" && user.assignedClientId !== null && user.assignedClientId.role) {
        parentClient = user.assignedClientId;
      } else {
        const cleanClientId = typeof user.assignedClientId === "object" && user.assignedClientId !== null
          ? (user.assignedClientId._id ? user.assignedClientId._id.toString() : String(user.assignedClientId))
          : String(user.assignedClientId);
        if (mongoose.Types.ObjectId.isValid(cleanClientId)) {
          parentClient = await User.findById(cleanClientId).lean();
        }
      }
    }

    if (!parentClient && user.organizationId) {
      const cleanOrgId = typeof user.organizationId === "object" && user.organizationId !== null
        ? (user.organizationId._id ? user.organizationId._id.toString() : String(user.organizationId))
        : String(user.organizationId);
      if (mongoose.Types.ObjectId.isValid(cleanOrgId)) {
        const org = await Organization.findById(cleanOrgId).lean();
        if (org && org.ownerId) {
          parentClient = await User.findById(org.ownerId).lean();
        }
      }
    }

    if (parentClient) {
      const clientResult = await calculateEffectivePermission(parentClient, permissionKey, {
        globalDeniedPermissions: globalDenied,
      });

      if (!clientResult.allowed) {
        return {
          allowed: false,
          permissionKey,
          source: clientResult.source || "client",
          locked: true,
          lockReason:
            clientResult.lockReason === "not_assigned"
              ? "disabled_by_client"
              : clientResult.lockReason || "disabled_by_client",
          reason: "Disabled by parent Client Organization.",
        };
      }
    }

    const isAssigned = getAssignedPermissionValue(user, permissionKey);
    return {
      allowed: isAssigned,
      permissionKey,
      source: "member",
      locked: false,
      lockReason: null,
      reason: isAssigned ? "Allowed by Member assignment." : "not_assigned",
    };
  }

  return {
    allowed: false,
    permissionKey,
    source: "member",
    locked: false,
    lockReason: null,
    reason: "not_assigned",
  };
};

/**
 * Calculates effective permissions for ALL registered permission keys for a given user.
 *
 * @param {Object} user - User document
 * @returns {Promise<Record<string, { allowed: boolean, locked: boolean, lockReason: string|null, reason: string }>>}
 */
const calculateAllEffectivePermissions = async (user) => {
  const globalDenied = await getCachedGlobalDeniedPermissions();

  let organization = null;
  if (user && user.organizationId) {
    organization = await Organization.findById(user.organizationId).lean();
  }

  let parentClient = null;
  if (user && user.role === "member") {
    if (user.assignedClientId) {
      parentClient = await User.findById(user.assignedClientId).lean();
    } else if (organization && organization.ownerId) {
      parentClient = await User.findById(organization.ownerId).lean();
    }
  }

  const results = {};
  for (const permKey of ALL_PERMISSION_KEYS) {
    results[permKey] = await calculateEffectivePermission(user, permKey, {
      globalDeniedPermissions: globalDenied,
      organization,
      parentClient,
    });
  }

  return results;
};

module.exports = {
  calculateEffectivePermission,
  calculateAllEffectivePermissions,
  invalidateGlobalSettingsCache,
};
