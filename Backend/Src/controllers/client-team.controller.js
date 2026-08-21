const mongoose = require("mongoose");
const User = require("../models/user.model");
const Organization = require("../models/organization.model");
const { getDefaultPermissions, ALL_PERMISSION_KEYS } = require("../config/permission-registry");
const {
  calculateEffectivePermission,
  calculateAllEffectivePermissions,
  invalidateUserPermissionCache,
} = require("../utils/permission-calculator.util");
const { formatPermissionsArray } = require("../utils/migration.util");
const { logAuditEvent } = require("../utils/audit-logger.util");
const { sendSuccess, sendError } = require("../utils/api-response.util");
const { createTimer } = require("../utils/performance-timer.util");
const logger = require("../utils/logger.util");

/**
 * GET /api/client/team
 * Retrieve paginated list of Members owned strictly by the authenticated Client.
 */
const getClientTeamMembers = async (req, res, next) => {
  const timer = createTimer("getClientTeamMembers");
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 25));
    const skip = (page - 1) * limit;
    const search = req.query.search ? req.query.search.trim() : "";

    // Ownership Filter derived strictly from req.user
    let filter = {
      role: "member",
      assignedClientId: req.user._id,
      ...(req.user.organizationId ? { organizationId: req.user.organizationId } : {}),
    };

    if (search) {
      const cleanSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.$or = [
        { name: { $regex: `^${cleanSearch}`, $options: "i" } },
        { email: { $regex: `^${cleanSearch}`, $options: "i" } },
      ];
    }

    const [total, members, targetOrg] = await timer.timeMongo(() =>
      Promise.all([
        User.countDocuments(filter),
        User.find(filter)
          .select("name email role status organizationId assignedClientId lastActiveAt createdAt")
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        req.user.organizationId
          ? Organization.findById(req.user.organizationId).lean()
          : Organization.findOne({ ownerId: req.user._id }).lean(),
      ])
    );

    const activeMembersCount = targetOrg
      ? await User.countDocuments({ organizationId: targetOrg._id, role: "member", status: "active" })
      : 0;

    const memberLimit = targetOrg?.memberLimit || 5;

    const sanitizedMembers = await timer.timePermCalc(async () => {
      return await Promise.all(
        members.map(async (member) => {
          const effectivePermissions = await calculateAllEffectivePermissions(member);
          return {
            ...member,
            effectivePermissions,
          };
        })
      );
    });

    const totalPages = Math.ceil(total / limit) || 1;
    timer.attachServerTimingHeader(res);

    return sendSuccess(res, 200, "Team members retrieved successfully", {
      members: sanitizedMembers,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
      quota: {
        activeMembersCount,
        memberLimit,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/client/team
 * Create a new Team Member under the authenticated Client's organization.
 */
const createClientTeamMember = async (req, res, next) => {
  try {
    const { name, email, password } = req.body || {};

    if (!name || !name.trim()) return sendError(res, 400, "Member full name is required.");
    if (!email || !email.trim() || !email.includes("@")) return sendError(res, 400, "A valid email address is required.");
    if (!password || password.length < 6) return sendError(res, 400, "Password must be at least 6 characters.");

    const targetOrg = req.user.organizationId
      ? await Organization.findById(req.user.organizationId)
      : await Organization.findOne({ ownerId: req.user._id });

    if (!targetOrg) {
      return sendError(res, 400, "Client organization context not found.");
    }

    // Atomic Quota Check
    const activeCount = await User.countDocuments({
      organizationId: targetOrg._id,
      role: "member",
      status: "active",
    });

    const limit = targetOrg.memberLimit || 5;
    if (activeCount >= limit) {
      logger.warn(`Client member creation blocked for Org ${targetOrg._id}: activeCount=${activeCount}, limit=${limit}`);
      return sendError(res, 400, `Maximum limit of ${limit} active members reached.`);
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = await User.findOne({ email: cleanEmail });
    if (existing) return sendError(res, 409, "A user with this email address already exists.");

    const defaultPerms = getDefaultPermissions("member");

    // Server-side forced attributes (IGNORE any role or clientId from req.body)
    const newMember = await User.create({
      name: name.trim(),
      email: cleanEmail,
      password: password,
      role: "member",
      status: "active",
      organizationId: targetOrg._id,
      assignedClientId: req.user._id,
      assignedPermissions: formatPermissionsArray(defaultPerms),
    });

    await logAuditEvent({
      actorId: req.user._id,
      targetUserId: newMember._id,
      organizationId: targetOrg._id,
      action: "MEMBER_CREATED",
      metadata: { email: cleanEmail, organizationName: targetOrg.name },
    });

    logger.info(`Client ${req.user._id} created Member ${newMember._id} under Org ${targetOrg._id}`);

    const json = newMember.toJSON();
    json.organizationId = targetOrg;
    json.assignedClientId = req.user;
    json.effectivePermissions = await calculateAllEffectivePermissions(newMember);

    return sendSuccess(res, 201, "Team Member created successfully", {
      member: json,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/client/team/:memberId/permissions
 * Update assigned permissions map for a Client's Team Member.
 */
const updateClientTeamMemberPermissions = async (req, res, next) => {
  try {
    const { memberId } = req.params;
    const { permissions } = req.body || {};

    if (!mongoose.Types.ObjectId.isValid(memberId)) return sendError(res, 400, "Invalid member ID format.");
    if (!permissions || typeof permissions !== "object") return sendError(res, 400, "Permissions object payload required.");

    // Strict Ownership Verification
    const targetMember = await User.findOne({
      _id: memberId,
      role: "member",
      assignedClientId: req.user._id,
      ...(req.user.organizationId ? { organizationId: req.user.organizationId } : {}),
    });

    if (!targetMember) {
      return sendError(res, 403, "Access denied. You do not have authority to manage this member.");
    }

    // Hierarchical Authority Grant Check: Client can ONLY grant permissions they possess!
    for (const [key, val] of Object.entries(permissions)) {
      if (Boolean(val) && ALL_PERMISSION_KEYS.includes(key)) {
        const callerEff = await calculateEffectivePermission(req.user, key);
        if (!callerEff.allowed) {
          logger.warn(`Client permission grant attempt blocked: Client ${req.user._id} tried to grant '${key}' without possessing authority.`);
          return sendError(
            res,
            403,
            `Access denied. You cannot grant permission '${key}' because you do not possess authority over it.`
          );
        }
      }
    }

    const existingMap = new Map();
    if (Array.isArray(targetMember.assignedPermissions)) {
      targetMember.assignedPermissions.forEach((p) => {
        if (p && p.key) existingMap.set(p.key, Boolean(p.allowed));
      });
    } else if (targetMember.assignedPermissions instanceof Map) {
      targetMember.assignedPermissions.forEach((val, key) => {
        existingMap.set(key, Boolean(val));
      });
    } else if (targetMember.assignedPermissions && typeof targetMember.assignedPermissions === "object") {
      Object.entries(targetMember.assignedPermissions).forEach(([k, v]) => {
        existingMap.set(k, Boolean(v));
      });
    }

    const oldPermsObj = Object.fromEntries(existingMap);

    Object.entries(permissions).forEach(([key, val]) => {
      if (ALL_PERMISSION_KEYS.includes(key)) {
        existingMap.set(key, Boolean(val));
      }
    });

    targetMember.assignedPermissions = Array.from(existingMap.entries()).map(([key, allowed]) => ({
      key,
      allowed,
    }));

    await targetMember.save();
    await invalidateUserPermissionCache(targetMember._id);

    await logAuditEvent({
      actorId: req.user._id,
      targetUserId: targetMember._id,
      organizationId: targetMember.organizationId,
      action: "PERMISSION_CHANGED",
      oldValue: oldPermsObj,
      newValue: permissions,
    });

    logger.info(`Client ${req.user._id} updated permissions for Member ${targetMember._id}`);

    const json = targetMember.toJSON();
    json.effectivePermissions = await calculateAllEffectivePermissions(targetMember);

    return sendSuccess(res, 200, "Member permissions updated successfully", {
      user: json,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/client/team/:memberId/status
 * Toggle active/disabled status for a Client's Team Member.
 */
const updateClientTeamMemberStatus = async (req, res, next) => {
  try {
    const { memberId } = req.params;
    const { status } = req.body || {};

    if (!mongoose.Types.ObjectId.isValid(memberId)) return sendError(res, 400, "Invalid member ID format.");
    if (status !== "active" && status !== "disabled") return sendError(res, 400, "Status must be 'active' or 'disabled'.");

    // Strict Ownership Verification
    const targetMember = await User.findOne({
      _id: memberId,
      role: "member",
      assignedClientId: req.user._id,
      ...(req.user.organizationId ? { organizationId: req.user.organizationId } : {}),
    });

    if (!targetMember) {
      return sendError(res, 403, "Access denied. You do not have authority to manage this member.");
    }

    const oldStatus = targetMember.status;
    targetMember.status = status;
    await targetMember.save();
    await invalidateUserPermissionCache(targetMember._id);

    const actionType = status === "disabled" ? "USER_DISABLED" : "USER_ENABLED";
    await logAuditEvent({
      actorId: req.user._id,
      targetUserId: targetMember._id,
      organizationId: targetMember.organizationId,
      action: actionType,
      oldValue: oldStatus,
      newValue: status,
    });

    logger.info(`Client ${req.user._id} updated status for Member ${targetMember._id} to ${status}`);

    const json = targetMember.toJSON();
    json.effectivePermissions = await calculateAllEffectivePermissions(targetMember);

    return sendSuccess(res, 200, `Member account successfully ${status}`, {
      user: json,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/client/team/:memberId
 * Delete a Team Member owned by the authenticated Client.
 */
const deleteClientTeamMember = async (req, res, next) => {
  try {
    const { memberId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(memberId)) {
      return sendError(res, 400, "Invalid member ID format.");
    }

    if (req.user._id.toString() === memberId) {
      return sendError(res, 400, "You cannot delete your own account.");
    }

    // Strict Ownership Verification
    const targetMember = await User.findOne({
      _id: memberId,
      role: "member",
      assignedClientId: req.user._id,
      ...(req.user.organizationId ? { organizationId: req.user.organizationId } : {}),
    });

    if (!targetMember) {
      return sendError(res, 403, "Access denied. You do not have authority to delete this member.");
    }

    await User.findByIdAndDelete(memberId);
    await invalidateUserPermissionCache(memberId);

    await logAuditEvent({
      actorId: req.user._id,
      targetUserId: memberId,
      organizationId: targetMember.organizationId,
      action: "USER_DELETED",
      metadata: { deletedUserEmail: targetMember.email, role: targetMember.role },
    });

    logger.info(`Client ${req.user._id} deleted Member account ${targetMember._id} (${targetMember.email})`);

    return sendSuccess(res, 200, "Team Member permanently deleted successfully", {
      memberId,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getClientTeamMembers,
  createClientTeamMember,
  updateClientTeamMemberPermissions,
  updateClientTeamMemberStatus,
  deleteClientTeamMember,
};
