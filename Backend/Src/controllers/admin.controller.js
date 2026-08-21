const mongoose = require("mongoose");
const User = require("../models/user.model");
const Organization = require("../models/organization.model");
const AdminAssignment = require("../models/admin-assignment.model");
const GlobalSettings = require("../models/global-settings.model");
const { getDefaultPermissions, ALL_PERMISSION_KEYS } = require("../config/permission-registry");
const { invalidateGlobalSettingsCache, calculateAllEffectivePermissions } = require("../utils/permission-calculator.util");
const { formatPermissionsArray } = require("../utils/migration.util");
const { logAuditEvent } = require("../utils/audit-logger.util");
const { sendSuccess, sendError } = require("../utils/api-response.util");
const logger = require("../utils/logger.util");

/**
 * GET /api/admin/users/admins
 * Retrieve list of all Admins and Root Admins.
 */
const getAllAdmins = async (req, res, next) => {
  try {
    const admins = await User.find({ role: { $in: ["admin", "root_admin"] } })
      .select("-password")
      .sort({ createdAt: -1 });

    const sanitizedAdmins = await Promise.all(
      admins.map(async (admin) => {
        const json = admin.toJSON();
        // Fetch count of assigned active organizations for this admin
        const assignments = await AdminAssignment.find({ adminId: admin._id, status: "active" })
          .populate("organizationId", "name ownerId")
          .lean();
        json.assignedOrganizations = assignments.map((a) => a.organizationId).filter(Boolean);
        json.effectivePermissions = await calculateAllEffectivePermissions(admin);
        return json;
      })
    );

    return sendSuccess(res, 200, "Admins retrieved successfully", {
      admins: sanitizedAdmins,
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
    const { name, email, password } = req.body || {};

    if (!name || !name.trim()) return sendError(res, 400, "Full name is required.");
    if (!email || !email.trim() || !email.includes("@")) return sendError(res, 400, "A valid email address is required.");
    if (!password || password.length < 6) return sendError(res, 400, "Password must be at least 6 characters.");

    const cleanEmail = email.trim().toLowerCase();
    const existing = await User.findOne({ email: cleanEmail });
    if (existing) return sendError(res, 409, "A user with this email address already exists.");

    const defaultPerms = getDefaultPermissions("admin");
    const newAdmin = await User.create({
      name: name.trim(),
      email: cleanEmail,
      password: password,
      role: "admin",
      status: "active",
      assignedPermissions: formatPermissionsArray(defaultPerms),
    });

    await logAuditEvent({
      actorId: req.user._id,
      targetUserId: newAdmin._id,
      action: "USER_CREATED",
      metadata: { role: "admin", email: cleanEmail },
    });

    logger.info(`Root Admin ${req.user._id} created new Admin ${newAdmin._id} (${cleanEmail})`);

    const json = newAdmin.toJSON();
    json.effectivePermissions = await calculateAllEffectivePermissions(newAdmin);

    return sendSuccess(res, 201, "Admin user account created successfully", {
      admin: json,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/users/clients
 * Retrieve list of Clients with organization details and active member counts.
 */
const getAllClients = async (req, res, next) => {
  try {
    let query = { role: "client" };
    // Root Admin and Admin get global access to all clients in the platform.

    const clients = await User.find(query)
      .select("-password")
      .populate("organizationId", "name ownerId memberLimit status")
      .sort({ createdAt: -1 });

    const sanitizedClients = await Promise.all(
      clients.map(async (client) => {
        const json = client.toJSON();
        let orgId = client.organizationId ? client.organizationId._id : null;

        let activeMembersCount = 0;
        let memberLimit = 5;

        if (orgId) {
          activeMembersCount = await User.countDocuments({
            organizationId: orgId,
            role: "member",
            status: "active",
          });
          if (client.organizationId && client.organizationId.memberLimit) {
            memberLimit = client.organizationId.memberLimit;
          }
        }

        // Fetch assigned admins
        let assignedAdmins = [];
        if (orgId) {
          const assignments = await AdminAssignment.find({ organizationId: orgId, status: "active" })
            .populate("adminId", "name email")
            .lean();
          assignedAdmins = assignments.map((a) => a.adminId).filter(Boolean);
        }

        json.activeMembersCount = activeMembersCount;
        json.memberLimit = memberLimit;
        json.assignedAdmins = assignedAdmins;
        json.effectivePermissions = await calculateAllEffectivePermissions(client);

        return json;
      })
    );

    return sendSuccess(res, 200, "Clients retrieved successfully", {
      clients: sanitizedClients,
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
 * Retrieve list of Members under accessible Client organizations.
 */
const getAllMembers = async (req, res, next) => {
  try {
    let query = { role: "member" };

    if (req.user.role === "client") {
      query = {
        role: "member",
        $or: [
          { assignedClientId: req.user._id },
          ...(req.user.organizationId ? [{ organizationId: req.user.organizationId }] : []),
        ],
      };
    }

    const members = await User.find(query)
      .select("-password")
      .populate("organizationId", "name ownerId status")
      .populate("assignedClientId", "name email")
      .sort({ createdAt: -1 });

    const sanitizedMembers = await Promise.all(
      members.map(async (member) => {
        const json = member.toJSON();
        json.effectivePermissions = await calculateAllEffectivePermissions(member);
        return json;
      })
    );

    return sendSuccess(res, 200, "Members retrieved successfully", {
      members: sanitizedMembers,
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

    // ATOMIC MEMBER LIMIT CHECK (Active Members only)
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
      return sendError(res, 400, "Maximum limit of 5 active members reached.");
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = await User.findOne({ email: cleanEmail });
    if (existing) return sendError(res, 409, "A user with this email address already exists.");

    const defaultPerms = getDefaultPermissions("member");
    const newMember = await User.create({
      name: name.trim(),
      email: cleanEmail,
      password: password,
      role: "member",
      status: "active",
      organizationId: targetOrg._id,
      assignedClientId: parentClient ? parentClient._id : null,
      assignedPermissions: formatPermissionsArray(defaultPerms),
    });

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

    // Root Admin Immutability Check
    if (targetUser.role === "root_admin" || targetUser.isRootAdmin) {
      return sendError(res, 403, "Root Administrator permissions cannot be modified.");
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

    // Hierarchical Authority Grant Check: Non-root users can ONLY grant permissions they possess.
    if (!isCallerRoot) {
      for (const [key, val] of Object.entries(permissions)) {
        if (Boolean(val) && ALL_PERMISSION_KEYS.includes(key)) {
          const callerEff = await calculateEffectivePermission(req.user, key);
          if (!callerEff.allowed) {
            logger.warn(`Permission grant attempt blocked: User ${req.user._id} (${req.user.role}) tried to grant '${key}' without possessing it.`);
            return sendError(
              res,
              403,
              `Access denied. You cannot grant permission '${key}' because you do not possess authority over it.`
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

    // Update permission map keys safely
    Object.entries(permissions).forEach(([key, val]) => {
      if (ALL_PERMISSION_KEYS.includes(key)) {
        existingMap.set(key, Boolean(val));
      }
    });

    targetUser.assignedPermissions = Array.from(existingMap.entries()).map(([key, allowed]) => ({
      key,
      allowed,
    }));

    await targetUser.save();

    await logAuditEvent({
      actorId: req.user._id,
      targetUserId: targetUser._id,
      organizationId: targetUser.organizationId,
      action: "PERMISSION_CHANGED",
      oldValue: oldPermsObj,
      newValue: permissions,
    });

    logger.info(`User ${req.user._id} updated permissions for user ${targetUser._id}`);

    const json = targetUser.toJSON();
    json.effectivePermissions = await calculateAllEffectivePermissions(targetUser);

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

    // Root Admin Immutability Check
    if (targetUser.role === "root_admin" || targetUser.isRootAdmin) {
      return sendError(res, 403, "Root Administrator account status cannot be modified.");
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

    invalidateGlobalSettingsCache();

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

    // Root Admin Protection
    if (targetUser.role === "root_admin" || targetUser.isRootAdmin) {
      return sendError(res, 403, "Root Administrator cannot be deleted.");
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

    await logAuditEvent({
      actorId: req.user._id,
      targetUserId: userId,
      organizationId: targetUser.organizationId,
      action: "USER_DELETED",
      metadata: { deletedUserEmail: targetUser.email, role: targetUser.role },
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
 * Promote Client to Admin or demote Admin to Client. STRICT: Root Admin ONLY.
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

    if (role !== "admin" && role !== "client") {
      return sendError(res, 400, "Invalid role specified. Role must be 'admin' or 'client'.");
    }

    const targetUser = await User.findById(userId);
    if (!targetUser) return sendError(res, 404, "User not found.");

    if (targetUser.role === "root_admin" || targetUser.isRootAdmin) {
      return sendError(res, 403, "Root Administrator role cannot be modified.");
    }

    const oldRole = targetUser.role;
    targetUser.role = role;
    await targetUser.save();

    await logAuditEvent({
      actorId: req.user._id,
      targetUserId: targetUser._id,
      action: "ROLE_CHANGED",
      oldValue: oldRole,
      newValue: role,
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

module.exports = {
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
};
