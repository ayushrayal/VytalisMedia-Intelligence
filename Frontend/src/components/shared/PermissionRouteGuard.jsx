import React from "react";
import { Outlet, useNavigate, useOutletContext } from "react-router-dom";
import useEffectivePermissions from "../../hooks/useEffectivePermissions.js";
import { ShieldAlert, ArrowLeft } from "lucide-react";

/**
 * Route guard component protecting direct URL access.
 * If user lacks required effective permission, renders a clean 403 Access Restricted UI.
 *
 * @param {Object} props
 * @param {string} props.permissionKey - Key from permission registry
 * @param {Object} [props.user] - User object (or derived from OutletContext)
 * @param {React.ReactNode} [props.children] - Optional child elements
 */
export const PermissionRouteGuard = ({ permissionKey, user: directUser, children }) => {
  const navigate = useNavigate();
  const outletContext = useOutletContext() || {};
  const user = directUser || outletContext.user || null;

  const { hasPermission, getPermissionState } = useEffectivePermissions(user);
  const isAllowed = hasPermission(permissionKey);
  const permState = getPermissionState(permissionKey);

  if (isAllowed) {
    return children ? children : <Outlet context={outletContext} />;
  }

  let lockMessage = "You do not have permission to access this page.";
  if (permState.lockReason === "disabled_by_root_admin") {
    lockMessage = "This feature has been globally disabled by the Root Administrator.";
  } else if (permState.lockReason === "disabled_by_admin") {
    lockMessage = "This feature has been disabled by your supervising Administrator.";
  } else if (permState.lockReason === "disabled_by_client") {
    lockMessage = "This feature has been disabled by your Client Organization.";
  } else if (permState.lockReason === "organization_disabled") {
    lockMessage = "Your Client Organization has been disabled.";
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "65vh",
        textAlign: "center",
        padding: "32px 16px",
      }}
    >
      <div
        style={{
          width: "64px",
          height: "64px",
          borderRadius: "18px",
          backgroundColor: "rgba(239, 68, 68, 0.1)",
          color: "#EF4444",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "20px",
          boxShadow: "0 4px 12px rgba(239, 68, 68, 0.15)",
        }}
      >
        <ShieldAlert size={32} />
      </div>

      <h1
        style={{
          fontSize: "22px",
          fontWeight: "800",
          color: "#0F2742",
          margin: "0 0 8px 0",
          letterSpacing: "-0.4px",
        }}
      >
        403 · Access Restricted
      </h1>

      <p
        style={{
          fontSize: "14px",
          color: "#64748B",
          maxWidth: "420px",
          margin: "0 0 24px 0",
          lineHeight: "1.5",
        }}
      >
        {lockMessage}
      </p>

      <button
        type="button"
        onClick={() => navigate("/overview")}
        style={{
          height: "40px",
          padding: "0 20px",
          borderRadius: "10px",
          backgroundColor: "#0A84FF",
          border: "none",
          color: "#FFFFFF",
          fontSize: "13.5px",
          fontWeight: "600",
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          boxShadow: "0 2px 6px rgba(10, 132, 255, 0.25)",
          transition: "all 0.15s ease",
        }}
      >
        <ArrowLeft size={16} />
        <span>Return to Overview</span>
      </button>
    </div>
  );
};

export default PermissionRouteGuard;
