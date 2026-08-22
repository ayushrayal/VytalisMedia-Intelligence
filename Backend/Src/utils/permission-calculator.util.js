const mongoose = require("mongoose");
const User = require("../models/user.model");
const Organization = require("../models/organization.model");
const GlobalSettings = require("../models/global-settings.model");
const AdminAssignment = require("../models/admin-assignment.model");
const { ALL_PERMISSION_KEYS } = require("../config/permission-registry");

/**
 * Safely extracts string ID from string, ObjectId, or populated document.
 */
const extractId = (val) => {
  if (!val) return null;
  if (typeof val === "object") {
    return val._id ? String(val._id) : String(val);
  }
  return String(val);
};

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

  const perms = user.assignedPermissions;

  // 1. Array of permission subdocuments: [{ key: "meta.campaigns", allowed: true }]
  if (Array.isArray(perms)) {
    const entry = perms.find((p) => p && p.key === permissionKey);
    return entry ? Boolean(entry.allowed) : false;
  }

  // 2. Map instance
  if (perms instanceof Map || (typeof perms === "object" && typeof perms.get === "function")) {
    const mapVal = perms.get(permissionKey);
    if (typeof mapVal === "object" && mapVal !== null) {
      return Boolean(mapVal.allowed);
    }
    return Boolean(mapVal);
  }

  // 3. Object dictionary: { "meta.campaigns": true } OR { "meta.campaigns": { allowed: true } }
  if (typeof perms === "object" && perms !== null) {
    if (permissionKey in perms) {
      const objVal = perms[permissionKey];
      if (typeof objVal === "object" && objVal !== null) {
        return Boolean(objVal.allowed);
      }
      return Boolean(objVal);
    }
  }

  return false;
};

/**
 * Calculates effective permission state for a target user and permissionKey.
 *
 * @param {Object} user - Authenticated or target User document/object
 * @param {string} permissionKey - Permission string (e.g. "meta.places")
 * @param {Object} [options] - Options for performance optimization (pre-fetched org, parentClient, supervisingAdmin, maps)
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
      const oId = extractId(user.organizationId);
      if (options.orgMap && options.orgMap.has(oId)) {
        org = options.orgMap.get(oId);
      } else {
        org = await Organization.findById(user.organizationId).lean();
      }
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
    let adminUser = options.supervisingAdmin;
    if (adminUser === undefined) {
      const orgId = extractId(user.organizationId);
      if (orgId && mongoose.Types.ObjectId.isValid(orgId)) {
        let activeAssignment = options.assignmentMap ? options.assignmentMap.get(orgId) : undefined;
        if (activeAssignment === undefined) {
          activeAssignment = await AdminAssignment.findOne({
            organizationId: orgId,
            status: "active",
          }).lean();
        }

        if (activeAssignment && activeAssignment.adminId) {
          const aId = extractId(activeAssignment.adminId);
          if (options.parentClientMap && options.parentClientMap.has(aId)) {
            adminUser = options.parentClientMap.get(aId);
          } else {
            adminUser = await User.findById(aId).lean();
          }
        }
      }
    }

    if (adminUser) {
      const adminResult = await calculateEffectivePermission(adminUser, permissionKey, {
        globalDeniedPermissions: globalDenied,
        orgMap: options.orgMap,
        assignmentMap: options.assignmentMap,
        parentClientMap: options.parentClientMap,
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
    if (parentClient === undefined && user.assignedClientId) {
      if (typeof user.assignedClientId === "object" && user.assignedClientId !== null && user.assignedClientId.role) {
        parentClient = user.assignedClientId;
      } else {
        const cleanClientId = extractId(user.assignedClientId);
        if (options.parentClientMap) {
          parentClient = options.parentClientMap.get(cleanClientId) || null;
        } else if (mongoose.Types.ObjectId.isValid(cleanClientId)) {
          parentClient = await User.findById(cleanClientId).lean();
        }
      }
    }

    if (parentClient === undefined && user.organizationId) {
      const cleanOrgId = extractId(user.organizationId);

      let org = options.organization;
      if (!org && options.orgMap) {
        org = options.orgMap.get(cleanOrgId) || null;
      } else if (!org && mongoose.Types.ObjectId.isValid(cleanOrgId)) {
        org = await Organization.findById(cleanOrgId).lean();
      }

      if (org && org.ownerId) {
        const ownerIdStr = extractId(org.ownerId);
        if (options.parentClientMap) {
          parentClient = options.parentClientMap.get(ownerIdStr) || null;
        } else if (mongoose.Types.ObjectId.isValid(ownerIdStr)) {
          parentClient = await User.findById(ownerIdStr).lean();
        }
      }
    }

    if (parentClient) {
      let parentSupervisingAdmin = options.supervisingAdmin;
      if (parentSupervisingAdmin === undefined && options.assignmentMap && options.parentClientMap && parentClient.organizationId) {
        const pOrgId = extractId(parentClient.organizationId);
        const pAssign = options.assignmentMap.get(pOrgId);
        if (pAssign && pAssign.adminId) {
          parentSupervisingAdmin = options.parentClientMap.get(extractId(pAssign.adminId)) || null;
        } else {
          parentSupervisingAdmin = null;
        }
      }

      const parentOrg = options.orgMap && parentClient.organizationId
        ? options.orgMap.get(extractId(parentClient.organizationId)) || null
        : null;

      const clientResult = await calculateEffectivePermission(parentClient, permissionKey, {
        globalDeniedPermissions: globalDenied,
        organization: parentOrg,
        supervisingAdmin: parentSupervisingAdmin,
        orgMap: options.orgMap,
        assignmentMap: options.assignmentMap,
        parentClientMap: options.parentClientMap,
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
 * No-op cache invalidation helpers (Redis permission caching removed).
 */
const invalidateUserPermissionCache = async (userId) => {
  return;
};

const invalidateOrgPermissionCache = async (orgId) => {
  return;
};

const invalidateGlobalPermissionCache = async () => {
  globalSettingsCache = null;
  globalSettingsCacheTime = 0;
  return;
};

/**
 * Atomically updates assignedPermissions array on User document in MongoDB.
 * For each key in patchPermissions:
 * 1. If assignedPermissions already contains an entry with matching key, update its 'allowed' value.
 * 2. If assignedPermissions does NOT contain matching key, push { key, allowed }.
 * Unmentioned keys in assignedPermissions are completely untouched.
 *
 * @param {string|mongoose.Types.ObjectId} userId
 * @param {Record<string, boolean>} patchPermissions
 */
const updateAssignedPermissionsAtomic = async (userId, patchPermissions) => {
  if (!patchPermissions || typeof patchPermissions !== "object") return;

  const cleanUserId = extractId(userId);
  if (!cleanUserId) return;

  for (const [key, allowedVal] of Object.entries(patchPermissions)) {
    if (!ALL_PERMISSION_KEYS.includes(key)) continue;
    const allowed = Boolean(allowedVal);

    const updateRes = await User.updateOne(
      { _id: cleanUserId, "assignedPermissions.key": key },
      { $set: { "assignedPermissions.$.allowed": allowed } }
    );

    if (updateRes.matchedCount === 0) {
      await User.updateOne(
        { _id: cleanUserId, "assignedPermissions.key": { $ne: key } },
        { $push: { assignedPermissions: { key, allowed } } }
      );
    }
  }
};

/**
 * Calculates effective permissions for ALL registered permission keys for a single user.
 * Resolved directly from MongoDB user state.
 *
 * @param {Object} user - User document
 * @param {Object} [options] - Optional pre-loaded context (organization, parentClient, supervisingAdmin, globalDeniedPermissions)
 * @returns {Promise<Record<string, { allowed: boolean, locked: boolean, lockReason: string|null, reason: string }>>}
 */
const calculateAllEffectivePermissions = async (user, options = {}) => {
  if (!user) return {};

  const globalDenied = options.globalDeniedPermissions || (await getCachedGlobalDeniedPermissions());

  let organization = options.organization || null;
  if (!organization && user && user.organizationId) {
    organization = typeof user.organizationId === "object" && user.organizationId.name
      ? user.organizationId
      : await Organization.findById(user.organizationId).lean();
  }

  let supervisingAdmin = options.supervisingAdmin || null;
  if (!supervisingAdmin && user && user.role === "client" && organization) {
    const activeAssignment = await AdminAssignment.findOne({
      organizationId: organization._id,
      status: "active",
    }).lean();
    if (activeAssignment && activeAssignment.adminId) {
      supervisingAdmin = await User.findById(activeAssignment.adminId).lean();
    }
  }

  let parentClient = options.parentClient || null;
  if (!parentClient && user && user.role === "member") {
    if (user.assignedClientId) {
      parentClient = typeof user.assignedClientId === "object" && user.assignedClientId.role
        ? user.assignedClientId
        : await User.findById(user.assignedClientId).lean();
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
      supervisingAdmin,
      orgMap: options.orgMap,
      assignmentMap: options.assignmentMap,
      parentClientMap: options.parentClientMap,
    });
  }

  return results;
};

/**
 * High-Performance Batch Permission Calculator.
 * Operates directly on MongoDB User data without Redis caching.
 *
 * @param {Array<Object>} usersArray - Users for the current page only
 * @param {Object} [timer] - Optional PerformanceTimer for MongoDB/permCalc timing
 * @returns {Promise<Map<string, Record<string, Object>>>} Map of userId -> effectivePermissions
 */
const calculateBatchEffectivePermissions = async (usersArray = [], timer = null) => {
  const permMap = new Map();
  if (!Array.isArray(usersArray) || usersArray.length === 0) {
    return permMap;
  }

  const userList = usersArray;
  const misses = [...userList];

  const missOrgIdsSet = new Set();
  const missClientIdsSet = new Set();

  misses.forEach((u) => {
    if (u.organizationId) {
      const oId = extractId(u.organizationId);
      if (oId) missOrgIdsSet.add(oId);
    }
    if (u.assignedClientId) {
      const cId = extractId(u.assignedClientId);
      if (cId) missClientIdsSet.add(cId);
    }
  });

  const fetchMongoData = async () => {
    let missClientIds = Array.from(missClientIdsSet);
    let initialParentClients = missClientIds.length
      ? await User.find({ _id: { $in: missClientIds } }).lean()
      : [];

    initialParentClients.forEach((pc) => {
      if (pc && pc.organizationId) {
        const oId = extractId(pc.organizationId);
        if (oId) missOrgIdsSet.add(oId);
      }
    });

    const missOrgIds = Array.from(missOrgIdsSet);

    const [globalDenied, orgDocs, assignments] = await Promise.all([
      getCachedGlobalDeniedPermissions(),
      missOrgIds.length ? Organization.find({ _id: { $in: missOrgIds } }).lean() : [],
      missOrgIds.length ? AdminAssignment.find({ organizationId: { $in: missOrgIds }, status: "active" }).lean() : [],
    ]);

    const extraUserIdsSet = new Set();
    orgDocs.forEach((org) => {
      if (org && org.ownerId) {
        const ownerId = extractId(org.ownerId);
        if (ownerId && !missClientIds.includes(ownerId)) {
          extraUserIdsSet.add(ownerId);
        }
      }
    });

    assignments.forEach((a) => {
      if (a && a.adminId) {
        const adminId = extractId(a.adminId);
        if (adminId && !missClientIds.includes(adminId)) {
          extraUserIdsSet.add(adminId);
        }
      }
    });

    const extraUserIds = Array.from(extraUserIdsSet);
    let extraUsers = [];
    if (extraUserIds.length > 0) {
      extraUsers = await User.find({ _id: { $in: extraUserIds } }).lean();
    }

    return {
      globalDenied,
      orgDocs,
      assignments,
      parentClientDocs: [...initialParentClients, ...extraUsers],
    };
  };

  const { globalDenied, orgDocs, assignments, parentClientDocs } = timer
    ? await timer.timeMongo(fetchMongoData)
    : await fetchMongoData();

  const orgMap = new Map();
  orgDocs.forEach((o) => orgMap.set(extractId(o), o));

  const assignmentMap = new Map();
  assignments.forEach((a) => {
    if (a && a.organizationId) {
      assignmentMap.set(extractId(a.organizationId), a);
    }
  });

  const parentClientMap = new Map();
  parentClientDocs.forEach((p) => parentClientMap.set(extractId(p), p));

  const doInMemCalc = async () => {
    for (const u of misses) {
      const uId = extractId(u);

      let organization = null;
      if (u.organizationId) {
        const oId = extractId(u.organizationId);
        organization = typeof u.organizationId === "object" && u.organizationId.name
          ? u.organizationId
          : orgMap.get(oId) || null;
      }

      let supervisingAdmin = null;
      if (u.role === "client" && organization) {
        const activeAssign = assignmentMap.get(extractId(organization));
        if (activeAssign && activeAssign.adminId) {
          const aId = extractId(activeAssign.adminId);
          supervisingAdmin = parentClientMap.get(aId) || null;
        }
      }

      let parentClient = null;
      if (u.role === "member") {
        if (u.assignedClientId) {
          const cId = extractId(u.assignedClientId);
          parentClient = typeof u.assignedClientId === "object" && u.assignedClientId.role
            ? u.assignedClientId
            : parentClientMap.get(cId) || null;
        } else if (organization && organization.ownerId) {
          parentClient = parentClientMap.get(extractId(organization.ownerId)) || null;
        }
      }

      const userResults = {};
      for (const permKey of ALL_PERMISSION_KEYS) {
        userResults[permKey] = await calculateEffectivePermission(u, permKey, {
          globalDeniedPermissions: globalDenied,
          organization,
          parentClient,
          supervisingAdmin,
          orgMap,
          assignmentMap,
          parentClientMap,
        });
      }

      permMap.set(uId, userResults);
    }
  };

  if (timer) {
    await timer.timePermCalc(doInMemCalc);
  } else {
    await doInMemCalc();
  }

  return permMap;
};

module.exports = {
  calculateEffectivePermission,
  calculateAllEffectivePermissions,
  calculateBatchEffectivePermissions,
  updateAssignedPermissionsAtomic,
  invalidateGlobalSettingsCache,
  invalidateUserPermissionCache,
  invalidateOrgPermissionCache,
  invalidateGlobalPermissionCache,
};

