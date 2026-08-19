const User = require("../models/user.model");
const { sendSuccess, sendError } = require("../utils/api-response.util");
const logger = require("../utils/logger.util");
const mongoose = require("mongoose");

/**
 * GET /api/admin/users
 * Retrieve list of all registered users for Admin User Management dashboard.
 * Requires Admin privileges.
 */
const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find({})
      .select("_id name email role shopifyEnabled attributionEnabled createdAt")
      .sort({ createdAt: -1 });

    const sanitizedUsers = users.map((u) => u.toJSON());

    return sendSuccess(res, 200, "Users retrieved successfully", {
      users: sanitizedUsers,
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

    const user = await User.findById(userId);
    if (!user) {
      return sendError(res, 404, "User not found.");
    }

    let updated = false;

    if (typeof shopifyEnabled === "boolean") {
      user.shopifyEnabled = shopifyEnabled;
      updated = true;
    }

    if (typeof attributionEnabled === "boolean") {
      user.attributionEnabled = attributionEnabled;
      updated = true;
    }

    if (!updated) {
      return sendError(res, 400, "No valid feature fields provided for update.");
    }

    await user.save();

    logger.info(
      `Admin ${req.user._id} updated features for user ${user._id}: shopifyEnabled=${user.shopifyEnabled}, attributionEnabled=${user.attributionEnabled}`
    );

    return sendSuccess(res, 200, "User feature access updated successfully", {
      user: user.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllUsers,
  updateUserFeatures,
};
