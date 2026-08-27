const mongoose = require("mongoose");
const User = require("../models/user.model");
const Organization = require("../models/organization.model");
const AdminAssignment = require("../models/admin-assignment.model");
const GlobalSettings = require("../models/global-settings.model");
const { getNextSequenceValue } = require("../models/counter.model");
const { getDefaultPermissions, ALL_PERMISSION_KEYS } = require("../config/permission-registry");
const {
  calculateEffectivePermission,
  calculateAllEffectivePermissions,
  calculateBatchEffectivePermissions,
  updateAssignedPermissionsAtomic,
  invalidateGlobalSettingsCache,
  invalidateUserPermissionCache,
  invalidateOrgPermissionCache,
  invalidateGlobalPermissionCache,
} = require("../utils/permission-calculator.util");
const { formatPermissionsArray } = require("../utils/migration.util");
const { logAuditEvent } = require("../utils/audit-logger.util");
const { sendSuccess, sendError } = require("../utils/api-response.util");
const { createTimer } = require("../utils/performance-timer.util");
const logger = require("../utils/logger.util");
const { acquireLock } = require("../utils/async-mutex.util");

/**
 * Helper to check Root Admin hierarchy authority.
 * Rule: currentUser.rootAdminRank < targetUser.rootAdminRank required for managing Root Admins.
 */
const checkRootAdminHierarchy = (caller, target) => {
  const isTargetRoot = Boolean(target && (target.role === "root_admin" || target.isRootAdmin));
  if (!isTargetRoot) return { allowed: true };

  const isCallerRoot = Boolean(caller && (caller.role === "root_admin" || caller.isRootAdmin));
  if (!isCallerRoot) {
    return {
      allowed: false,
      reason: "Access denied. Only a Root Administrator can perform this action.",
    };
  }

  if (caller._id.toString() === target._id.toString()) {
    return {
      allowed: false,
      reason: "You cannot modify your own Root Administrator account.",
    };
  }

  const callerRank = typeof caller.rootAdminRank === "number" ? caller.rootAdminRank : Infinity;
  const targetRank = typeof target.rootAdminRank === "number" ? target.rootAdminRank : Infinity;

  if (callerRank >= targetRank) {
    return {
      allowed: false,
      reason: "Access denied. You cannot modify a Root Administrator with equal or higher authority rank.",
    };
  }

  return { allowed: true };
};


/**
 * GET /api/admin/users/counts
 * Retrieve fast summary user counts by category for UI tabs.
 */
const getUserCounts = async (req, res, next) => {
  const timer = createTimer("getUserCounts");
  try {
    let clientQuery = { role: "client" };
    let memberQuery = { role: "member" };
    let adminQuery = { role: { $in: ["admin", "root_admin"] } };

    if (req.user.role === "client") {
      memberQuery = {
        role: "member",
        $or: [
          { assignedClientId: req.user._id },
          ...(req.user.organizationId ? [{ organizationId: req.user.organizationId }] : []),
        ],
      };
    }

    const [adminCount, clientCount, memberCount] = await timer.timeMongo(() =>
      Promise.all([
        User.countDocuments(adminQuery),
        User.countDocuments(clientQuery),
        User.countDocuments(memberQuery),
      ])
    );

    timer.attachServerTimingHeader(res);
    return sendSuccess(res, 200, "User counts retrieved successfully", {
      counts: {
        admins: adminCount,
        clients: clientCount,
        members: memberCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/users/admins
 * Retrieve paginated list of all Admins and Root Admins.
 */
const getAllAdmins = async (req, res, next) => {
  const timer = createTimer("getAllAdmins");
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 25));
    const skip = (page - 1) * limit;
    const search = req.query.search ? req.query.search.trim() : "";

    let filter = { role: { $in: ["admin", "root_admin"] } };

    if (search) {
      const cleanSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.$or = [
        { name: { $regex: `^${cleanSearch}`, $options: "i" } },
        { email: { $regex: `^${cleanSearch}`, $options: "i" } },
      ];
    }

    const [total, admins] = await timer.timeMongo(() =>
      Promise.all([
        User.countDocuments(filter),
        User.find(filter)
          .select("name email role status isRootAdmin lastActiveAt createdAt assignedPermissions")
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
      ])
    );

    const adminIds = admins.map((a) => a._id);
    let adminAssignmentsMap = {};

    if (adminIds.length > 0) {
      const assignments = await timer.timeMongo(() =>
        AdminAssignment.find({ adminId: { $in: adminIds }, status: "active" })
          .populate("organizationId", "name ownerId")
          .lean()
      );
      assignments.forEach((a) => {
        const aId = a.adminId.toString();
        if (!adminAssignmentsMap[aId]) adminAssignmentsMap[aId] = [];
        if (a.organizationId) adminAssignmentsMap[aId].push(a.organizationId);
      });
    }

    const batchPermMap = await calculateBatchEffectivePermissions(admins, timer);

    const sanitizedAdmins = admins.map((admin) => {
      const assignedOrganizations = adminAssignmentsMap[admin._id.toString()] || [];
      const effectivePermissions = batchPermMap.get(String(admin._id)) || {};
      return {
        ...admin,
        assignedOrganizations,
        effectivePermissions,
      };
    });

    const totalPages = Math.ceil(total / limit) || 1;
    timer.attachServerTimingHeader(res);

    return sendSuccess(res, 200, "Admins retrieved successfully", {
      admins: sanitizedAdmins,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/admin/admins
 * Create a new Admin user account. STRICT: Root Admin only.
 */
const createAdmin = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body || {};

    if (!name || !name.trim()) return sendError(res, 400, "Full name is required.");
    if (!email || !email.trim() || !email.includes("@")) return sendError(res, 400, "A valid email address is required.");
    if (!password || password.length < 6) return sendError(res, 400, "Password must be at least 6 characters.");

    const cleanEmail = email.trim().toLowerCase();
    const existing = await User.findOne({ email: cleanEmail });
    if (existing) return sendError(res, 409, "A user with this email address already exists.");

    const isCreatingRootAdmin = role === "root_admin";

    if (isCreatingRootAdmin) {
      const isCallerRoot = Boolean(req.user && (req.user.role === "root_admin" || req.user.isRootAdmin));
      if (!isCallerRoot) {
        return sendError(res, 403, "Only the Root Administrator can create another Root Administrator.");
      }
    }

    const targetRole = isCreatingRootAdmin ? "root_admin" : "admin";
    const defaultPerms = getDefaultPermissions(targetRole);

    let nextRank = null;
    if (isCreatingRootAdmin) {
      nextRank = await getNextSequenceValue("rootAdminRank");
    }

    const newAdmin = await User.create({
      name: name.trim(),
      email: cleanEmail,
      password: password,
      role: targetRole,
      isRootAdmin: isCreatingRootAdmin,
      rootAdminRank: nextRank,
      createdBy: req.user._id,
      status: "active",
      assignedPermissions: formatPermissionsArray(defaultPerms),
    });

    await logAuditEvent({
      actorId: req.user._id,
      targetUserId: newAdmin._id,
      action: "USER_CREATED",
      metadata: { role: targetRole, email: cleanEmail, rootAdminRank: nextRank },
    });

    logger.info(`Root Admin ${req.user._id} created new ${targetRole} ${newAdmin._id} (${cleanEmail}) with rank ${nextRank}`);

    const json = newAdmin.toJSON();
    json.effectivePermissions = await calculateAllEffectivePermissions(newAdmin);

    return sendSuccess(res, 201, `${isCreatingRootAdmin ? "Root Administrator" : "Admin"} user account created successfully`, {
      admin: json,
    });
  } catch (error) {
    next(error);
  }
};


/**
 * GET /api/admin/users/clients
 * Retrieve paginated list of Clients with organization details and active member counts.
 */
const getAllClients = async (req, res, next) => {
  const timer = createTimer("getAllClients");
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 25));
    const skip = (page - 1) * limit;
    const search = req.query.search ? req.query.search.trim() : "";

    let filter = { role: "client" };

    if (search) {
      const cleanSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.$or = [
        { name: { $regex: `^${cleanSearch}`, $options: "i" } },
        { email: { $regex: `^${cleanSearch}`, $options: "i" } },
      ];
    }

    const [total, clients] = await timer.timeMongo(() =>
      Promise.all([
        User.countDocuments(filter),
        User.find(filter)
          .select("name email role status organizationId assignedClientId shopifyEnabled attributionEnabled isRootAdmin lastActiveAt createdAt assignedPermissions")
          .populate("organizationId", "name ownerId memberLimit status")
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
      ])
    );

    const orgIds = clients.map((c) => (c.organizationId ? c.organizationId._id : null)).filter(Boolean);

    let memberCountsMap = {};
    let adminAssignmentsMap = {};

    if (orgIds.length > 0) {
      const [memberCounts, assignments] = await timer.timeMongo(() =>
        Promise.all([
          User.aggregate([
            { $match: { organizationId: { $in: orgIds }, role: "member", status: "active" } },
            { $group: { _id: "$organizationId", count: { $sum: 1 } } },
          ]),
          AdminAssignment.find({ organizationId: { $in: orgIds }, status: "active" })
            .populate("adminId", "name email")
            .lean(),
        ])
      );

      memberCounts.forEach((m) => {
        memberCountsMap[m._id.toString()] = m.count;
      });

      assignments.forEach((a) => {
        const oId = a.organizationId.toString();
        if (!adminAssignmentsMap[oId]) adminAssignmentsMap[oId] = [];
        if (a.adminId) adminAssignmentsMap[oId].push(a.adminId);
      });
    }

    const batchPermMap = await calculateBatchEffectivePermissions(clients, timer);

    const sanitizedClients = clients.map((client) => {
      const orgIdStr = client.organizationId ? client.organizationId._id.toString() : null;
      const activeMembersCount = orgIdStr ? memberCountsMap[orgIdStr] || 0 : 0;
      const memberLimit = (client.organizationId && client.organizationId.memberLimit) || 5;
      const assignedAdmins = orgIdStr ? adminAssignmentsMap[orgIdStr] || [] : [];
      const effectivePermissions = batchPermMap.get(String(client._id)) || {};

      return {
        ...client,
        activeMembersCount,
        memberLimit,
        assignedAdmins,
        effectivePermissions,
      };
    });

    const totalPages = Math.ceil(total / limit) || 1;
    timer.attachServerTimingHeader(res);

    return sendSuccess(res, 200, "Clients retrieved successfully", {
      clients: sanitizedClients,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/admin/clients
 * Create a new Client user account and initialize Organization.
 */
const createClient = async (req, res, next) => {
  try {
    const { name, email, password, metaAccountId, metaAccountName, organizationName } = req.body || {};

    if (!name || !name.trim()) return sendError(res, 400, "Client full name is required.");
    if (!email || !email.trim() || !email.includes("@")) return sendError(res, 400, "A valid email address is required.");
    if (!password || password.length < 6) return sendError(res, 400, "Password must be at least 6 characters.");

    const cleanEmail = email.trim().toLowerCase();
    const existing = await User.findOne({ email: cleanEmail });
    if (existing) return sendError(res, 409, "A user with this email address already exists.");

    const cleanMetaAccountId = metaAccountId ? metaAccountId.trim() : null;
    const cleanMetaAccountName = metaAccountName ? metaAccountName.trim() : null;

    const defaultPerms = getDefaultPermissions("client");
    const newClient = new User({
      name: name.trim(),
      email: cleanEmail,
      password: password,
      role: "client",
      status: "active",
      assignedPermissions: formatPermissionsArray(defaultPerms),
      integrations: cleanMetaAccountId
        ? {
            meta: [
              {
                accountId: cleanMetaAccountId,
                accountName: cleanMetaAccountName || cleanMetaAccountId,
                connectedAt: new Date(),
              },
            ],
          }
        : { meta: [] },
      preferences: {
        activeMetaAccount: cleanMetaAccountId,
      },
    });

    // Create Organization
    const org = await Organization.create({
      name: (organizationName && organizationName.trim()) || `${newClient.name}'s Organization`,
      ownerId: newClient._id,
      memberLimit: 5,
      status: "active",
    });

    newClient.organizationId = org._id;
    await newClient.save();

    // If created by regular Admin, assign creating Admin to Organization
    if (req.user.role === "admin") {
      await AdminAssignment.create({
        adminId: req.user._id,
        organizationId: org._id,
        status: "active",
      });
    }

    await logAuditEvent({
      actorId: req.user._id,
      targetUserId: newClient._id,
      organizationId: org._id,
      action: "ORGANIZATION_CREATED",
      metadata: { organizationName: org.name },
    });

    await logAuditEvent({
      actorId: req.user._id,
      targetUserId: newClient._id,
      organizationId: org._id,
      action: "USER_CREATED",
      metadata: { role: "client", email: cleanEmail },
    });

    logger.info(`User ${req.user._id} created new Client ${newClient._id} and Organization ${org._id}`);

    const json = newClient.toJSON();
    json.organizationId = org;
    json.activeMembersCount = 0;
    json.memberLimit = 5;
    json.effectivePermissions = await calculateAllEffectivePermissions(newClient);

    return sendSuccess(res, 201, "Client user account and Organization created successfully", {
      client: json,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/users/members
 * Retrieve paginated list of Members under accessible Client organizations.
 */
const getAllMembers = async (req, res, next) => {
  const timer = createTimer("getAllMembers");
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 25));
    const skip = (page - 1) * limit;
    const search = req.query.search ? req.query.search.trim() : "";

    let filter = { role: "member" };

    if (req.user.role === "client") {
      filter = {
        role: "member",
        $or: [
          { assignedClientId: req.user._id },
          ...(req.user.organizationId ? [{ organizationId: req.user.organizationId }] : []),
        ],
      };
    }

    if (search) {
      const cleanSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const searchOr = [
        { name: { $regex: `^${cleanSearch}`, $options: "i" } },
        { email: { $regex: `^${cleanSearch}`, $options: "i" } },
      ];
      if (filter.$or) {
        filter = { $and: [filter, { $or: searchOr }] };
      } else {
        filter.$or = searchOr;
      }
    }

    const [total, members] = await timer.timeMongo(() =>
      Promise.all([
        User.countDocuments(filter),
        User.find(filter)
          .select("name email role status organizationId assignedClientId lastActiveAt createdAt assignedPermissions")
          .populate("organizationId", "name ownerId status")
          .populate("assignedClientId", "name email")
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
      ])
    );

    const batchPermMap = await calculateBatchEffectivePermissions(members, timer);

    const sanitizedMembers = members.map((member) => ({
      ...member,
      effectivePermissions: batchPermMap.get(String(member._id)) || {},
    }));

    const totalPages = Math.ceil(total / limit) || 1;
    timer.attachServerTimingHeader(res);

    return sendSuccess(res, 200, "Members retrieved successfully", {
      members: sanitizedMembers,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    next(error);
  }
};


/**
 * POST /api/admin/members
 * Create a new Member under a Client Organization.
 * ATOMIC MEMBER LIMIT ENFORCEMENT: Rejects creation of 6th active member with 400.
 */
const createMember = async (req, res, next) => {
  try {
    const { name, email, password, clientId, organizationId } = req.body || {};

    if (!name || !name.trim()) return sendError(res, 400, "Member full name is required.");
    if (!email || !email.trim() || !email.includes("@")) return sendError(res, 400, "A valid email address is required.");
    if (!password || password.length < 6) return sendError(res, 400, "Password must be at least 6 characters.");

    let targetOrg = null;
    let parentClient = null;

    // 1. CLIENT ROLE SCOPING: Must create strictly under own Organization!
    if (req.user.role === "client") {
      // If client attempts to supply a cross-organization organizationId, reject with 403 Forbidden
      if (organizationId && req.user.organizationId && organizationId.toString() !== req.user.organizationId.toString()) {
        logger.warn(`Cross-client member creation attempt blocked for Client ${req.user._id}`);
        return sendError(res, 403, "Access denied. You can only create members under your own organization.");
      }

      if (req.user.organizationId) {
        targetOrg = await Organization.findById(req.user.organizationId);
      } else {
        targetOrg = await Organization.findOne({ ownerId: req.user._id });
      }
      parentClient = req.user;
    }
    // 2. ADMIN ROLE SCOPING: Must be assigned to target Organization via AdminAssignment
    else if (req.user.role === "admin") {
      if (organizationId) {
        targetOrg = await Organization.findById(organizationId);
      } else if (clientId) {
        parentClient = await User.findById(clientId);
        if (parentClient && parentClient.organizationId) {
          targetOrg = await Organization.findById(parentClient.organizationId);
        }
      }

      if (!targetOrg) {
        return sendError(res, 400, "Valid target Client or Organization ID is required.");
      }

      const isAssigned = await AdminAssignment.findOne({
        adminId: req.user._id,
        organizationId: targetOrg._id,
        status: "active",
      });

      if (!isAssigned && targetOrg.ownerId?.toString() !== req.user._id.toString()) {
        logger.warn(`Admin unassigned member creation blocked for Admin ${req.user._id} on Org ${targetOrg._id}`);
        return sendError(res, 403, "Access denied. You are not assigned to manage this organization.");
      }
    }
    // 3. ROOT ADMIN: Unrestricted global access across any target Organization
    else if (req.user.role === "root_admin" || req.user.isRootAdmin) {
      if (organizationId) {
        targetOrg = await Organization.findById(organizationId);
      } else if (clientId) {
        parentClient = await User.findById(clientId);
        if (parentClient && parentClient.organizationId) {
          targetOrg = await Organization.findById(parentClient.organizationId);
        }
      }
    }
    // 4. MEMBER ROLE: Prohibited from creating members
    else {
      return sendError(res, 403, "Access denied. Team Members cannot create other members.");
    }

    if (!targetOrg) {
      return sendError(res, 400, "Valid target Client or Organization ID is required.");
    }

    if (!parentClient && targetOrg.ownerId) {
      parentClient = await User.findById(targetOrg.ownerId);
    }

    // Acquire In-Process Keyed Mutex Lock per organizationId
    // SCOPE LIMITATION: Single-Process Concurrency Safety ONLY.
    // Multi-instance horizontally scaled deployments require a distributed lock (e.g., Redis Redlock / DB transaction).
    const releaseLock = await acquireLock(targetOrg._id.toString());
    let newMember;
    try {
      const activeCount = await User.countDocuments({
        organizationId: targetOrg._id,
        role: "member",
        status: "active",
      });

      const limit = targetOrg.memberLimit || 5;
      if (activeCount >= limit) {
        logger.warn(
          `Member creation blocked for Org ${targetOrg._id}: activeCount=${activeCount}, limit=${limit}`
        );
        return sendError(res, 400, `Maximum limit of ${limit} active members reached.`);
      }

      const cleanEmail = email.trim().toLowerCase();
      const existing = await User.findOne({ email: cleanEmail });
      if (existing) return sendError(res, 409, "A user with this email address already exists.");

      const defaultPerms = getDefaultPermissions("member");
      newMember = await User.create({
        name: name.trim(),
        email: cleanEmail,
        password: password,
        role: "member",
        status: "active",
        organizationId: targetOrg._id,
        assignedClientId: parentClient ? parentClient._id : null,
        assignedPermissions: formatPermissionsArray(defaultPerms),
      });
    } finally {
      releaseLock();
    }

    await logAuditEvent({
      actorId: req.user._id,
      targetUserId: newMember._id,
      organizationId: targetOrg._id,
      action: "MEMBER_CREATED",
      metadata: { email: cleanEmail, organizationName: targetOrg.name },
    });

    logger.info(`User ${req.user._id} created Member ${newMember._id} under Org ${targetOrg._id}`);

    const json = newMember.toJSON();
    json.organizationId = targetOrg;
    json.assignedClientId = parentClient;
    json.effectivePermissions = await calculateAllEffectivePermissions(newMember);

    return sendSuccess(res, 201, "Member created successfully", {
      member: json,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/admin/users/:userId/permissions
 * Update assigned permissions map for a target user.
 */
const updateUserPermissions = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { permissions } = req.body || {};

    if (!mongoose.Types.ObjectId.isValid(userId)) return sendError(res, 400, "Invalid user ID format.");
    if (!permissions || typeof permissions !== "object") return sendError(res, 400, "Permissions object payload required.");

    // Self-Permission Escalation Check
    if (req.user._id.toString() === userId) {
      return sendError(res, 403, "You cannot modify your own security permissions.");
    }

    if (req.user.role === "member") {
      return sendError(res, 403, "Access denied. Team Members cannot modify user permissions.");
    }

    const targetUser = await User.findById(userId);
    if (!targetUser) return sendError(res, 404, "User not found.");

    // Root Admin Hierarchy Check
    if (targetUser.role === "root_admin" || targetUser.isRootAdmin) {
      const hierarchyCheck = checkRootAdminHierarchy(req.user, targetUser);
      if (!hierarchyCheck.allowed) {
        return sendError(res, 403, hierarchyCheck.reason);
      }
    }

    // Role-based organizational scoping checks
    if (req.user.role === "client") {
      if (!targetUser.organizationId || targetUser.organizationId.toString() !== req.user.organizationId?.toString()) {
        return sendError(res, 403, "Access denied. You can only manage members of your own organization.");
      }
    } else if (req.user.role === "admin") {
      const isAssigned = await AdminAssignment.findOne({
        adminId: req.user._id,
        organizationId: targetUser.organizationId,
        status: "active",
      });
      if (!isAssigned && targetUser.organizationId?.toString() !== req.user.organizationId?.toString()) {
        return sendError(res, 403, "Access denied. You are not assigned to manage this user's organization.");
      }
    }


    const isCallerRoot = Boolean(req.user.role === "root_admin" || req.user.isRootAdmin);

    // Hierarchical Authority Check: Non-root users can ONLY modify (grant or revoke) permissions over which they possess authority.
    if (!isCallerRoot) {
      for (const [key, val] of Object.entries(permissions)) {
        if (ALL_PERMISSION_KEYS.includes(key)) {
          const callerEff = await calculateEffectivePermission(req.user, key);
          if (!callerEff.allowed) {
            logger.warn(`Permission modification attempt blocked: User ${req.user._id} (${req.user.role}) tried to modify '${key}' (val=${val}) without possessing authority.`);
            return sendError(
              res,
              403,
              `Access denied. You cannot modify permission '${key}' because you do not possess authority over it.`
            );
          }
        }
      }
    }

    const existingMap = new Map();
    if (Array.isArray(targetUser.assignedPermissions)) {
      targetUser.assignedPermissions.forEach((p) => {
        if (p && p.key) existingMap.set(p.key, Boolean(p.allowed));
      });
    } else if (targetUser.assignedPermissions instanceof Map) {
      targetUser.assignedPermissions.forEach((val, key) => {
        existingMap.set(key, Boolean(val));
      });
    } else if (targetUser.assignedPermissions && typeof targetUser.assignedPermissions === "object") {
      Object.entries(targetUser.assignedPermissions).forEach(([k, v]) => {
        existingMap.set(k, Boolean(v));
      });
    }

    const oldPermsObj = Object.fromEntries(existingMap);
    const patchKeys = Object.keys(permissions).filter((k) => ALL_PERMISSION_KEYS.includes(k));

    // Atomic MongoDB Update: Update ONLY the explicitly requested permission keys without overwriting unmentioned keys
    const patchObj = {};
    patchKeys.forEach((key) => {
      patchObj[key] = Boolean(permissions[key]);
    });

    await updateAssignedPermissionsAtomic(targetUser._id, patchObj);
    await invalidateUserPermissionCache(targetUser._id);
    if (targetUser.role === "client" && targetUser.organizationId) {
      await invalidateOrgPermissionCache(targetUser.organizationId);
    }

    await logAuditEvent({
      actorId: req.user._id,
      targetUserId: targetUser._id,
      organizationId: targetUser.organizationId,
      action: "PERMISSION_CHANGED",
      oldValue: oldPermsObj,
      newValue: permissions,
    });

    logger.info(`User ${req.user._id} updated permissions for user ${targetUser._id}`);

    const freshUser = await User.findById(targetUser._id);
    const json = freshUser.toJSON();
    json.effectivePermissions = await calculateAllEffectivePermissions(freshUser);

    return sendSuccess(res, 200, "User permissions updated successfully", {
      user: json,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/admin/users/:userId/status
 * Toggle active/disabled status for a target user.
 */
const updateUserStatus = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { status } = req.body || {};

    if (!mongoose.Types.ObjectId.isValid(userId)) return sendError(res, 400, "Invalid user ID format.");
    if (status !== "active" && status !== "disabled") return sendError(res, 400, "Status must be 'active' or 'disabled'.");

    // Self-Deactivation Check
    if (req.user._id.toString() === userId) {
      return sendError(res, 403, "You cannot disable your own user account.");
    }

    if (req.user.role === "member") {
      return sendError(res, 403, "Access denied. Team Members cannot modify user status.");
    }

    const targetUser = await User.findById(userId);
    if (!targetUser) return sendError(res, 404, "User not found.");

    // Root Admin Hierarchy Check
    if (targetUser.role === "root_admin" || targetUser.isRootAdmin) {
      const hierarchyCheck = checkRootAdminHierarchy(req.user, targetUser);
      if (!hierarchyCheck.allowed) {
        return sendError(res, 403, hierarchyCheck.reason);
      }
    }


    // Role-based organizational scoping checks
    if (req.user.role === "client") {
      if (!targetUser.organizationId || targetUser.organizationId.toString() !== req.user.organizationId?.toString()) {
        return sendError(res, 403, "Access denied. You can only manage members of your own organization.");
      }
    } else if (req.user.role === "admin") {
      const isAssigned = await AdminAssignment.findOne({
        adminId: req.user._id,
        organizationId: targetUser.organizationId,
        status: "active",
      });
      if (!isAssigned && targetUser.organizationId?.toString() !== req.user.organizationId?.toString()) {
        return sendError(res, 403, "Access denied. You are not assigned to manage this user's organization.");
      }
    }

    const oldStatus = targetUser.status;
    targetUser.status = status;
    await targetUser.save();
    await invalidateUserPermissionCache(targetUser._id);
    if (targetUser.organizationId) {
      await invalidateOrgPermissionCache(targetUser.organizationId);
    }

    const actionType = status === "disabled" ? "USER_DISABLED" : "USER_ENABLED";
    await logAuditEvent({
      actorId: req.user._id,
      targetUserId: targetUser._id,
      organizationId: targetUser.organizationId,
      action: actionType,
      oldValue: oldStatus,
      newValue: status,
    });

    logger.info(`User ${req.user._id} updated status for user ${targetUser._id} to ${status}`);

    const json = targetUser.toJSON();
    json.effectivePermissions = await calculateAllEffectivePermissions(targetUser);

    return sendSuccess(res, 200, `User account successfully ${status}`, {
      user: json,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/global-settings
 * Retrieve Root Admin global denied permissions singleton.
 */
const getGlobalSettings = async (req, res, next) => {
  try {
    let settings = await GlobalSettings.findOne({});
    if (!settings) {
      settings = await GlobalSettings.create({ globalDeniedPermissions: [] });
    }
    return sendSuccess(res, 200, "Global settings retrieved successfully", {
      globalSettings: settings.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/admin/global-settings
 * Update Root Admin global denied permissions array. Root Admin ONLY.
 */
const updateGlobalSettings = async (req, res, next) => {
  try {
    const { globalDeniedPermissions } = req.body || {};
    if (!Array.isArray(globalDeniedPermissions)) {
      return sendError(res, 400, "globalDeniedPermissions must be an array of permission keys.");
    }

    let settings = await GlobalSettings.findOne({});
    if (!settings) {
      settings = new GlobalSettings();
    }

    const oldDenied = settings.globalDeniedPermissions;
    settings.globalDeniedPermissions = globalDeniedPermissions.filter((k) => ALL_PERMISSION_KEYS.includes(k));
    settings.updatedBy = req.user._id;
    await settings.save();

    await invalidateGlobalPermissionCache();

    await logAuditEvent({
      actorId: req.user._id,
      action: "GLOBAL_PERMISSION_DISABLED",
      oldValue: oldDenied,
      newValue: settings.globalDeniedPermissions,
    });

    logger.info(`Root Admin ${req.user._id} updated global denied permissions: ${settings.globalDeniedPermissions.join(", ")}`);

    return sendSuccess(res, 200, "Global system restrictions updated successfully", {
      globalSettings: settings.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/admin/organizations/:organizationId/admins
 * Assign an Admin to an Organization. Root Admin ONLY.
 */
const assignAdminToOrganization = async (req, res, next) => {
  try {
    const { organizationId } = req.params;
    const { adminId } = req.body || {};

    if (!mongoose.Types.ObjectId.isValid(organizationId) || !mongoose.Types.ObjectId.isValid(adminId)) {
      return sendError(res, 400, "Invalid Organization or Admin ID format.");
    }

    const adminUser = await User.findById(adminId);
    if (!adminUser || (adminUser.role !== "admin" && adminUser.role !== "root_admin")) {
      return sendError(res, 400, "Target user must be an Administrator.");
    }

    const org = await Organization.findById(organizationId);
    if (!org) return sendError(res, 404, "Organization not found.");

    const assignment = await AdminAssignment.findOneAndUpdate(
      { adminId, organizationId },
      { status: "active" },
      { upsert: true, new: true }
    );

    await invalidateOrgPermissionCache(organizationId);

    await logAuditEvent({
      actorId: req.user._id,
      targetUserId: adminId,
      organizationId,
      action: "ADMIN_ASSIGNED",
    });

    return sendSuccess(res, 200, "Admin successfully assigned to Organization", { assignment });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/admin/organizations/:organizationId/admins/:adminId
 * Unassign an Admin from an Organization. Root Admin ONLY. Does NOT delete Client or Members.
 */
const unassignAdminFromOrganization = async (req, res, next) => {
  try {
    const { organizationId, adminId } = req.params;

    const assignment = await AdminAssignment.findOneAndUpdate(
      { adminId, organizationId },
      { status: "inactive" },
      { new: true }
    );

    await invalidateOrgPermissionCache(organizationId);

    await logAuditEvent({
      actorId: req.user._id,
      targetUserId: adminId,
      organizationId,
      action: "ADMIN_UNASSIGNED",
    });

    return sendSuccess(res, 200, "Admin unassigned from Organization successfully", { assignment });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/admin/users/:userId
 * Permanently delete a user account.
 * Root Admin Protection & Self-delete Protection.
 */
const deleteUser = async (req, res, next) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return sendError(res, 400, "Invalid user ID format.");
    }

    if (req.user._id.toString() === userId) {
      return sendError(res, 400, "You cannot delete your own user account.");
    }

    if (req.user.role === "member") {
      return sendError(res, 403, "Access denied. Team Members cannot delete user accounts.");
    }

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return sendError(res, 404, "Target user not found.");
    }

    // Root Admin Protection & Hierarchy Check
    if (targetUser.role === "root_admin" || targetUser.isRootAdmin) {
      const hierarchyCheck = checkRootAdminHierarchy(req.user, targetUser);
      if (!hierarchyCheck.allowed) {
        return sendError(res, 403, hierarchyCheck.reason);
      }
    }

    // Role-based organizational scoping checks
    if (req.user.role === "client") {
      if (!targetUser.organizationId || targetUser.organizationId.toString() !== req.user.organizationId?.toString()) {
        return sendError(res, 403, "Access denied. You can only delete members of your own organization.");
      }
    } else if (req.user.role === "admin") {
      const isAssigned = await AdminAssignment.findOne({
        adminId: req.user._id,
        organizationId: targetUser.organizationId,
        status: "active",
      });
      if (!isAssigned && targetUser.organizationId?.toString() !== req.user.organizationId?.toString()) {
        return sendError(res, 403, "Access denied. You are not assigned to manage this user's organization.");
      }
    }

    // Regular admin attempting to delete another admin
    if (req.user.role !== "root_admin" && !req.user.isRootAdmin && targetUser.role === "admin") {
      return sendError(res, 403, "Regular administrators cannot delete other administrators.");
    }

    await User.findByIdAndDelete(userId);
    await invalidateUserPermissionCache(userId);
    if (targetUser.organizationId) {
      await invalidateOrgPermissionCache(targetUser.organizationId);
    }

    await logAuditEvent({
      actorId: req.user._id,
      targetUserId: userId,
      organizationId: targetUser.organizationId,
      action: "USER_DELETED",
      metadata: { deletedUserEmail: targetUser.email, role: targetUser.role, rootAdminRank: targetUser.rootAdminRank },
    });

    logger.info(`User ${req.user._id} deleted user account ${targetUser._id} (${targetUser.email})`);

    return sendSuccess(res, 200, "User account permanently deleted successfully", {
      userId,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/admin/users/:userId/role
 * Promote or demote user roles. STRICT: Root Admin ONLY.
 */
const updateUserRole = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { role } = req.body || {};

    if (req.user.role !== "root_admin" && !req.user.isRootAdmin) {
      return sendError(res, 403, "Only the Root Administrator can modify user roles.");
    }

    if (req.user._id.toString() === userId) {
      return sendError(res, 400, "You cannot modify your own role.");
    }

    if (role !== "root_admin" && role !== "admin" && role !== "client") {
      return sendError(res, 400, "Invalid role specified. Role must be 'root_admin', 'admin', or 'client'.");
    }

    const targetUser = await User.findById(userId);
    if (!targetUser) return sendError(res, 404, "User not found.");

    // Root Admin Target Hierarchy Check
    if (targetUser.role === "root_admin" || targetUser.isRootAdmin) {
      const hierarchyCheck = checkRootAdminHierarchy(req.user, targetUser);
      if (!hierarchyCheck.allowed) {
        return sendError(res, 403, hierarchyCheck.reason);
      }
    }

    const oldRole = targetUser.role;

    if (role === "root_admin") {
      if (targetUser.role !== "root_admin") {
        targetUser.role = "root_admin";
        targetUser.isRootAdmin = true;
        targetUser.rootAdminRank = await getNextSequenceValue("rootAdminRank");
      }
    } else {
      // Demoting from root_admin to admin or client
      if (targetUser.role === "root_admin" || targetUser.isRootAdmin) {
        targetUser.rootAdminRank = undefined;
        targetUser.isRootAdmin = false;
      }

      targetUser.role = role;
    }

    await targetUser.save();
    await invalidateUserPermissionCache(userId);

    await logAuditEvent({
      actorId: req.user._id,
      targetUserId: targetUser._id,
      action: "ROLE_CHANGED",
      oldValue: oldRole,
      newValue: role,
      metadata: { rootAdminRank: targetUser.rootAdminRank },
    });

    logger.info(`Root Admin ${req.user._id} updated role for user ${targetUser._id} to ${role}`);

    const json = targetUser.toJSON();
    json.effectivePermissions = await calculateAllEffectivePermissions(targetUser);

    return sendSuccess(res, 200, `User role updated successfully to ${role}`, {
      user: json,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/metric-registry
 * Exposes Metric Registry metadata.
 */
const getMetricRegistry = async (req, res, next) => {
  try {
    const { METRIC_REGISTRY } = require("../config/metric-registry.config");
    const { platform, category, type } = req.query || {};
    let metricsList = Object.values(METRIC_REGISTRY);

    if (platform) {
      const cleanPlatform = String(platform).toLowerCase().trim();
      metricsList = metricsList.filter((m) => m.platform === cleanPlatform);
    }

    if (category) {
      const cleanCategory = String(category).toLowerCase().trim();
      metricsList = metricsList.filter((m) => m.category === cleanCategory);
    }

    if (type) {
      const cleanType = String(type).toLowerCase().trim();
      metricsList = metricsList.filter((m) => m.type === cleanType);
    }

    return sendSuccess(res, 200, "Metric Registry retrieved successfully", {
      total: metricsList.length,
      metrics: metricsList,
      metricsMap: METRIC_REGISTRY,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUserCounts,
  getAllAdmins,
  createAdmin,
  getAllClients,
  createClient,
  getAllMembers,
  createMember,
  updateUserPermissions,
  updateUserStatus,
  getGlobalSettings,
  updateGlobalSettings,
  assignAdminToOrganization,
  unassignAdminFromOrganization,
  deleteUser,
  updateUserRole,
  getMetricRegistry,
};


