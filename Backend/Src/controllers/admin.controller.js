const User = require("../models/user.model");
const { sendSuccess, sendError } = require("../utils/api-response.util");
const logger = require("../utils/logger.util");
const mongoose = require("mongoose");

/**
 * GET /api/admin/users
 * Retrieve list of all registered users for Admin User Management dashboard.
 * Requires Admin privileges.
 * 
 * Default sorting: Root Admin first, Admins next, Clients after that.
 * Within each tier, sorted by lastActiveAt descending (most recent first, null last).
 */
const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find({})
      .select("_id name email role shopifyEnabled attributionEnabled isRootAdmin lastActiveAt createdAt integrations preferences")
      .sort({ createdAt: -1 });

    const sanitizedUsers = users.map((u) => u.toJSON());

    // Sort hierarchy: Root Admin (1) -> Admins (2) -> Clients (3), then by lastActiveAt descending
    const getRolePriority = (user) => {
      if (user.isRootAdmin) return 1;
      if (user.role === "admin") return 2;
      return 3;
    };

    sanitizedUsers.sort((a, b) => {
      const priorityA = getRolePriority(a);
      const priorityB = getRolePriority(b);
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }
      const timeA = a.lastActiveAt ? new Date(a.lastActiveAt).getTime() : 0;
      const timeB = b.lastActiveAt ? new Date(b.lastActiveAt).getTime() : 0;
      return timeB - timeA;
    });

    return sendSuccess(res, 200, "Users retrieved successfully", {
      users: sanitizedUsers,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/admin/users
 * Admin creates a new Client user with assigned Meta account details.
 * Requires Admin privileges.
 *
 * Body parameters:
 * - name: string (required)
 * - email: string (required)
 * - password: string (required)
 * - metaAccountId: string (required)
 * - metaAccountName: string (required)
 */
const createUser = async (req, res, next) => {
  try {
    const { name, email, password, metaAccountId, metaAccountName } = req.body || {};

    if (!name || !name.trim()) {
      return sendError(res, 400, "User full name is required.");
    }
    if (!email || !email.trim() || !email.includes("@")) {
      return sendError(res, 400, "A valid email address is required.");
    }
    if (!password || password.length < 6) {
      return sendError(res, 400, "Password must be at least 6 characters long.");
    }
    if (!metaAccountId || !metaAccountId.trim()) {
      return sendError(res, 400, "Meta Account ID is required.");
    }
    if (!metaAccountName || !metaAccountName.trim()) {
      return sendError(res, 400, "Meta Account Name is required.");
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check for existing duplicate user email
    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      return sendError(res, 409, "A user with this email address already exists.");
    }

    const cleanMetaAccountId = metaAccountId.trim();
    const cleanMetaAccountName = metaAccountName.trim();

    // Create client user with defaults and Meta integration attached
    const newUser = await User.create({
      name: name.trim(),
      email: cleanEmail,
      password: password,
      role: "client",
      shopifyEnabled: false,
      attributionEnabled: false,
      isRootAdmin: false,
      lastActiveAt: null,
      integrations: {
        meta: [
          {
            accountId: cleanMetaAccountId,
            accountName: cleanMetaAccountName,
            connectedAt: new Date(),
          },
        ],
      },
      preferences: {
        activeMetaAccount: cleanMetaAccountId,
      },
    });

    logger.info(`Admin ${req.user._id} created new user ${newUser._id} (${newUser.email})`);

    return sendSuccess(res, 201, "User account created successfully", {
      user: newUser.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/admin/users/:userId
 * Permanently delete a user account.
 * Requires Admin privileges.
 *
 * Security rules:
 * - Admin cannot self-delete.
 * - Root Admin CANNOT be deleted by anyone.
 * - Regular Admins CANNOT delete other Admins or Root Admin.
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

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return sendError(res, 404, "Target user not found.");
    }

    // Root Admin Protection
    if (targetUser.isRootAdmin) {
      logger.warn(`User deletion rejected: Attempt to delete Root Admin ${targetUser._id} by ${req.user._id}`);
      return sendError(res, 403, "Root Administrator cannot be deleted.");
    }

    // Hierarchy check: Regular admin attempting to delete another admin
    if (!req.user.isRootAdmin && targetUser.role === "admin") {
      logger.warn(`User deletion rejected: Regular admin ${req.user._id} attempted to delete admin ${targetUser._id}`);
      return sendError(res, 403, "Regular administrators cannot delete other administrators.");
    }

    await User.findByIdAndDelete(userId);

    logger.info(`Admin ${req.user._id} deleted user account ${targetUser._id} (${targetUser.email})`);

    return sendSuccess(res, 200, "User account permanently deleted successfully", {
      userId,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/admin/users/:userId/role
 * Promote client to Admin or demote Admin to Client.
 * STRICT: ONLY Root Admin (isRootAdmin === true) can modify roles.
 *
 * Body parameters:
 * - role: "admin" | "client"
 */
const updateUserRole = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { role } = req.body || {};

    if (!req.user.isRootAdmin) {
      logger.warn(`Role update rejected: Non-root admin ${req.user._id} attempted role change`);
      return sendError(res, 403, "You don't have permission to change user roles.");
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return sendError(res, 400, "Invalid user ID format.");
    }

    if (role !== "admin" && role !== "client") {
      return sendError(res, 400, "Invalid role specified. Role must be 'admin' or 'client'.");
    }

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return sendError(res, 404, "User not found.");
    }

    if (targetUser.isRootAdmin) {
      return sendError(res, 403, "Root Administrator role cannot be modified.");
    }

    targetUser.role = role;
    await targetUser.save();

    logger.info(`Root Admin ${req.user._id} updated role for user ${targetUser._id} to ${role}`);

    return sendSuccess(res, 200, `User role successfully updated to ${role}`, {
      user: targetUser.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/admin/users/:userId/features
 * Independently toggle Shopify and Attribution feature access for a specific user.
 * Requires Admin privileges.
 * 
 * Body parameters:
 * - shopifyEnabled: boolean (optional)
 * - attributionEnabled: boolean (optional)
 */
const updateUserFeatures = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { shopifyEnabled, attributionEnabled } = req.body || {};

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return sendError(res, 400, "Invalid user ID format.");
    }

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return sendError(res, 404, "User not found.");
    }

    if (targetUser.isRootAdmin && !req.user.isRootAdmin) {
      return sendError(res, 403, "Regular administrators cannot modify Root Administrator permissions.");
    }

    let updated = false;

    if (typeof shopifyEnabled === "boolean") {
      targetUser.shopifyEnabled = shopifyEnabled;
      updated = true;
    }

    if (typeof attributionEnabled === "boolean") {
      targetUser.attributionEnabled = attributionEnabled;
      updated = true;
    }

    if (!updated) {
      return sendError(res, 400, "No valid feature fields provided for update.");
    }

    await targetUser.save();

    logger.info(
      `Admin ${req.user._id} updated features for user ${targetUser._id}: shopifyEnabled=${targetUser.shopifyEnabled}, attributionEnabled=${targetUser.attributionEnabled}`
    );

    return sendSuccess(res, 200, "User feature access updated successfully", {
      user: targetUser.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllUsers,
  createUser,
  deleteUser,
  updateUserRole,
  updateUserFeatures,
};
