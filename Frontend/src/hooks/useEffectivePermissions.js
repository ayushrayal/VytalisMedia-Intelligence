import { useMemo } from "react";
import { PERMISSION_KEYS } from "../config/permission-registry.js";

/**
 * React Hook for evaluating effective permissions on the frontend.
 * Uses backend-calculated effectivePermissions when present, or evaluates fallback rules.
 *
 * @param {Object} user - Authenticated user object
 */
export const useEffectivePermissions = (user) => {
  return useMemo(() => {
    const isRootAdmin = user && (user.role === "root_admin" || user.isRootAdmin === true);

    const hasPermission = (permissionKey) => {
      if (!user) return false;
      if (user.status === "disabled") return false;
      if (isRootAdmin) return true;

      // 1. Primary source: Backend calculated effectivePermissions object
      if (user.effectivePermissions && user.effectivePermissions[permissionKey]) {
        return Boolean(user.effectivePermissions[permissionKey].allowed);
      }

      // 2. Fallback check for assignedPermissions Array, Map, or Object
      let assignedVal = undefined;
      if (user.assignedPermissions) {
        if (Array.isArray(user.assignedPermissions)) {
          const entry = user.assignedPermissions.find((p) => p && p.key === permissionKey);
          if (entry) assignedVal = Boolean(entry.allowed);
        } else if (typeof user.assignedPermissions.get === "function") {
          assignedVal = Boolean(user.assignedPermissions.get(permissionKey));
        } else if (typeof user.assignedPermissions === "object") {
          if (permissionKey in user.assignedPermissions) {
            assignedVal = Boolean(user.assignedPermissions[permissionKey]);
          }
        }
      }

      if (assignedVal !== undefined) {
        return assignedVal;
      }

      // Backward compatibility fallbacks for legacy flags
      if (permissionKey === PERMISSION_KEYS.SHOPIFY_VIEW && Boolean(user.shopifyEnabled)) {
        return true;
      }
      if (permissionKey === PERMISSION_KEYS.ATTRIBUTION_VIEW && Boolean(user.attributionEnabled)) {
        return true;
      }

      // Default role behavior if no explicit assignedPermission entry exists
      if (user.role === "client" || user.role === "admin") {
        return true;
      }

      return false;
    };

    const getPermissionState = (permissionKey) => {
      if (!user) {
        return { allowed: false, locked: true, lockReason: "account_disabled", reason: "User not logged in." };
      }

      if (user.status === "disabled") {
        return { allowed: false, locked: true, lockReason: "account_disabled", reason: "Account is disabled." };
      }

      if (isRootAdmin) {
        return { allowed: true, locked: false, lockReason: null, reason: "Root Admin authority." };
      }

      if (user.effectivePermissions && user.effectivePermissions[permissionKey]) {
        return user.effectivePermissions[permissionKey];
      }

      const allowed = hasPermission(permissionKey);
      return {
        allowed,
        locked: false,
        lockReason: allowed ? null : "not_assigned",
        reason: allowed ? "Allowed" : "not_assigned",
      };
    };

    return {
      hasPermission,
      getPermissionState,
      isRootAdmin,
    };
  }, [user]);
};

export default useEffectivePermissions;
