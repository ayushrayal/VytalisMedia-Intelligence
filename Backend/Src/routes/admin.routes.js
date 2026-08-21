const express = require("express");
const router = express.Router();
const adminController = require("../controllers/admin.controller");
const { protect, requireRootAdmin, requireEffectivePermission } = require("../middleware/auth.middleware");

// All user management routes require JWT Authentication & status verification
router.use(protect);

/**
 * Admins Management Routes
 */
router.get("/users/admins", requireEffectivePermission("user_management.admins"), adminController.getAllAdmins);
router.post("/admins", requireRootAdmin, adminController.createAdmin);

/**
 * Clients Management Routes
 */
router.get("/users/clients", requireEffectivePermission("user_management.clients"), adminController.getAllClients);
router.post("/clients", requireEffectivePermission("user_management.clients"), adminController.createClient);
// Backward compatibility fallback for POST /api/admin/users
router.post("/users", requireEffectivePermission("user_management.clients"), adminController.createClient);

/**
 * Members Management Routes
 */
router.get("/users/members", requireEffectivePermission("user_management.members"), adminController.getAllMembers);
router.post("/members", requireEffectivePermission("user_management.members"), adminController.createMember);

/**
 * Permissions, Status, & Role Management Routes
 */
router.patch("/users/:userId/permissions", requireEffectivePermission("user_management.members"), adminController.updateUserPermissions);
router.patch("/users/:userId/status", requireEffectivePermission("user_management.members"), adminController.updateUserStatus);
router.patch("/users/:userId/role", requireRootAdmin, adminController.updateUserRole);
router.delete("/users/:userId", requireEffectivePermission("user_management.members"), adminController.deleteUser);

/**
 * Global System Restrictions Routes
 */
router.get("/global-settings", adminController.getGlobalSettings);
router.patch("/global-settings", requireRootAdmin, adminController.updateGlobalSettings);

/**
 * Admin Organization Assignment Routes
 */
router.post("/organizations/:organizationId/admins", requireRootAdmin, adminController.assignAdminToOrganization);
router.delete("/organizations/:organizationId/admins/:adminId", requireRootAdmin, adminController.unassignAdminFromOrganization);

module.exports = router;
