import React, { useState, useRef } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import AppLogo from "../components/shared/AppLogo.jsx";
import LogoutConfirmationModal from "../components/shared/LogoutConfirmationModal.jsx";
import { removeAccessToken } from "../lib/storage.js";
import {
  LayoutDashboard,
  BarChart3,
  Megaphone,
  Layers,
  Image as ImageIcon,
  Users,
  MapPin,
  Settings2,
  LogOut,
  User,
} from "lucide-react";

/**
 * DashboardLayout wrapper for overall dashboard & Meta analytics pages.
 * Professional B2B SaaS Layout with quiet navigation states & structured groups:
 * - ANALYTICS
 * - INSIGHTS
 * - CONNECTIONS
 */
export const DashboardLayout = ({ user, setUser }) => {
  const navigate = useNavigate();
  const logoutTriggerRef = useRef(null);

  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const analyticsNavItems = [
    { route: "/overview", label: "Overview", icon: LayoutDashboard },
    { route: "/meta/overview", label: "Meta Overview", icon: BarChart3 },
    { route: "/meta/campaigns", label: "Campaigns", icon: Megaphone },
    { route: "/meta/adsets", label: "Ad Sets", icon: Layers },
    { route: "/meta/creatives", label: "Creatives", icon: ImageIcon },
  ];

  const insightsNavItems = [
    { route: "/meta/audience", label: "Audience", icon: Users },
    { route: "/meta/places", label: "Places", icon: MapPin },
  ];

  const connectionsNavItems = [
    { route: "/settings/accounts", label: "Meta Accounts", icon: Settings2 },
  ];

  const handleLogout = () => {
    removeAccessToken();
    if (setUser) setUser(null);
    navigate("/login");
  };

  const handleConfirmLogout = () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    handleLogout();
  };

  const renderNavGroup = (title, items) => (
    <div style={{ marginBottom: "20px" }}>
      <span
        style={{
          fontSize: "11px",
          fontWeight: "700",
          textTransform: "uppercase",
          letterSpacing: "0.6px",
          color: "var(--color-text-muted, #94A3B8)",
          padding: "0 10px",
          display: "block",
          marginBottom: "6px",
        }}
      >
        {title}
      </span>
      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
        {items.map((item) => {
          const IconComponent = item.icon;
          return (
            <NavLink
              key={item.route}
              to={item.route}
              style={({ isActive }) => ({
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "8px 10px",
                borderRadius: "var(--radius-nav, 6px)",
                textDecoration: "none",
                backgroundColor: isActive ? "var(--color-surface-subtle, #F1F5F9)" : "transparent",
                color: isActive ? "#0A84FF" : "var(--color-text-secondary, #64748B)",
                fontSize: "13px",
                fontWeight: isActive ? "600" : "500",
                transition: "all 0.15s ease",
                borderLeft: isActive ? "2px solid #0A84FF" : "2px solid transparent",
              })}
            >
              <IconComponent size={18} strokeWidth={2} style={{ flexShrink: 0 }} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </div>
  );

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "var(--color-background, #F8FAFC)", color: "var(--color-text-primary, #0F172A)" }}>
      {/* Fixed Desktop Sidebar */}
      <aside
        style={{
          width: "230px",
          backgroundColor: "#FFFFFF",
          borderRight: "1px solid var(--color-border, #E8ECF2)",
          padding: "20px 14px",
          display: "flex",
          flexDirection: "column",
          position: "sticky",
          top: 0,
          height: "100vh",
          flexShrink: 0,
        }}
      >
        {/* Brand Logo Header */}
        <div style={{ padding: "0 6px 18px 6px", borderBottom: "1px solid var(--color-border, #E8ECF2)" }}>
          <AppLogo size="md" />
        </div>

        {/* Navigation Groups */}
        <nav style={{ display: "flex", flexDirection: "column", flex: 1, paddingTop: "18px", overflowY: "auto" }}>
          {renderNavGroup("Analytics", analyticsNavItems)}
          {renderNavGroup("Insights", insightsNavItems)}
          {renderNavGroup("Connections", connectionsNavItems)}
        </nav>

        {/* Sidebar Footer User Area */}
        <div style={{ paddingTop: "14px", borderTop: "1px solid var(--color-border, #E8ECF2)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", overflow: "hidden" }}>
            <div
              style={{
                width: "30px",
                height: "30px",
                borderRadius: "50%",
                backgroundColor: "rgba(10, 132, 255, 0.08)",
                color: "#0A84FF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "700",
                fontSize: "12px",
                flexShrink: 0,
              }}
            >
              {user && user.name ? user.name.charAt(0).toUpperCase() : <User size={15} />}
            </div>
            <div style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
              <span style={{ fontSize: "13px", fontWeight: "600", color: "var(--color-text-primary, #0F172A)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {user ? user.name : "Vytalis User"}
              </span>
              <span style={{ fontSize: "11px", color: "var(--color-text-muted, #94A3B8)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {user ? user.email : "admin@vytalis.com"}
              </span>
            </div>
          </div>

          <button
            ref={logoutTriggerRef}
            onClick={() => setIsLogoutModalOpen(true)}
            title="Log out"
            aria-label="Log out"
            style={{
              width: "30px",
              height: "30px",
              borderRadius: "6px",
              border: "1px solid var(--color-border, #E8ECF2)",
              backgroundColor: "transparent",
              color: "var(--color-text-secondary, #64748B)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "all 0.15s ease",
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(220, 38, 38, 0.06)";
              e.currentTarget.style.color = "#DC2626";
              e.currentTarget.style.borderColor = "rgba(220, 38, 38, 0.2)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.color = "var(--color-text-secondary, #64748B)";
              e.currentTarget.style.borderColor = "var(--color-border, #E8ECF2)";
            }}
          >
            <LogOut size={15} />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main style={{ flex: 1, padding: "28px 32px", overflowY: "auto", minWidth: 0 }}>
        <Outlet />
      </main>

      {/* Logout Confirmation Modal */}
      <LogoutConfirmationModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={handleConfirmLogout}
        isLoggingOut={isLoggingOut}
        triggerRef={logoutTriggerRef}
      />
    </div>
  );
};

export default DashboardLayout;

