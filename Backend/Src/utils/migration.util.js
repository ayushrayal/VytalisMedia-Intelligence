const User = require("../models/user.model");
const Organization = require("../models/organization.model");
const AdminAssignment = require("../models/admin-assignment.model");
const { getDefaultPermissions } = require("../config/permission-registry");
const logger = require("./logger.util");

/**
 * Converts a permission dictionary object, Map, or array into a standard subdocument array format.
 * Format: [{ key: "dashboard.view", allowed: true }, { key: "meta.campaigns", allowed: true }, ...]
 */
const formatPermissionsArray = (perms) => {
  if (!perms) return [];
  if (Array.isArray(perms)) {
    return perms.map((p) => ({ key: p.key, allowed: Boolean(p.allowed) }));
  }
  if (perms instanceof Map) {
    const arr = [];
    perms.forEach((val, key) => arr.push({ key, allowed: Boolean(val) }));
    return arr;
  }
  if (typeof perms === "object") {
    return Object.entries(perms).map(([key, allowed]) => ({
      key,
      allowed: Boolean(allowed),
    }));
  }
  return [];
};

/**
 * Idempotent Migration Utility for Vytalis Intelligence RBAC & Organizations.
 * Safe to run multiple times without duplicating data or breaking permissions.
 */
const runRbacMigration = async () => {
  try {
    logger.info("Starting idempotent RBAC & Organization migration...");

    const users = await User.find({});
    let migratedCount = 0;
    let createdOrgsCount = 0;
    let createdAssignmentsCount = 0;

    for (const user of users) {
      let isModified = false;

      // 1. Role Migration
      if (user.isRootAdmin && user.role !== "root_admin") {
        user.role = "root_admin";
        isModified = true;
      } else if (!user.role) {
        user.role = "client";
        isModified = true;
      }

      // 2. Status Default
      if (!user.status) {
        user.status = "active";
        isModified = true;
      }

      // 3. Client Organization Migration
      if (user.role === "client") {
        let org = null;
        if (user.organizationId) {
          org = await Organization.findById(user.organizationId);
        }

        if (!org) {
          // Check if org already exists for this owner
          org = await Organization.findOne({ ownerId: user._id });
        }

        if (!org) {
          org = await Organization.create({
            name: `${user.name || "Client"}'s Organization`,
            ownerId: user._id,
            memberLimit: 5,
            status: "active",
          });
          createdOrgsCount++;
          logger.info(`Created Organization ${org._id} for Client ${user._id}`);
        }

        if (!user.organizationId || user.organizationId.toString() !== org._id.toString()) {
          user.organizationId = org._id;
          isModified = true;
        }
      }

      // 4. Default Permissions Migration (Array of Subdocuments Format)
      const defaultPerms = getDefaultPermissions(user.role);
      const existingMap = new Map();

      if (Array.isArray(user.assignedPermissions)) {
        user.assignedPermissions.forEach((p) => {
          if (p && p.key) {
            existingMap.set(p.key, Boolean(p.allowed));
          }
        });
      } else if (user.assignedPermissions instanceof Map) {
        user.assignedPermissions.forEach((val, key) => {
          existingMap.set(key, Boolean(val));
        });
      } else if (user.assignedPermissions && typeof user.assignedPermissions === "object") {
        Object.entries(user.assignedPermissions).forEach(([k, v]) => {
          existingMap.set(k, Boolean(v));
        });
      }

      let permsChanged = false;

      if (existingMap.size === 0) {
        // No permissions existing -> assign complete default permissions set
        user.assignedPermissions = formatPermissionsArray(defaultPerms);
        permsChanged = true;
      } else {
        // Populate missing permission keys safely without overwriting existing customized values
        Object.entries(defaultPerms).forEach(([key, defaultVal]) => {
          if (!existingMap.has(key)) {
            existingMap.set(key, Boolean(defaultVal));
            permsChanged = true;
          }
        });

        if (permsChanged) {
          user.assignedPermissions = Array.from(existingMap.entries()).map(([key, allowed]) => ({
            key,
            allowed,
          }));
        }
      }

      if (permsChanged) {
        isModified = true;
      }

      if (isModified) {
        await user.save();
        migratedCount++;
      }

      // 5. Legacy assignedAdminId to AdminAssignment Migration
      if (user.assignedAdminId && user.organizationId) {
        const existingAssignment = await AdminAssignment.findOne({
          adminId: user.assignedAdminId,
          organizationId: user.organizationId,
        });

        if (!existingAssignment) {
          await AdminAssignment.create({
            adminId: user.assignedAdminId,
            organizationId: user.organizationId,
            status: "active",
          });
          createdAssignmentsCount++;
        }
      }
    }

    logger.info(
      `RBAC Migration complete: ${migratedCount} users updated, ${createdOrgsCount} orgs created, ${createdAssignmentsCount} admin assignments created.`
    );

    return {
      success: true,
      migratedCount,
      createdOrgsCount,
      createdAssignmentsCount,
    };
  } catch (error) {
    logger.error(`RBAC Migration failed: ${error.message}`, error);
    throw error;
  }
};

module.exports = {
  runRbacMigration,
  formatPermissionsArray,
};
