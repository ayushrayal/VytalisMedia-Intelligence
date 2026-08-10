import React from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import AppLogo from "../components/shared/AppLogo.jsx";
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
 * Premium SaaS Layout with subtle navigation states & Lucide stroke icons.
 */
export const DashboardLayout = ({ user, setUser }) => {
  const navigate = useNavigate();

  const mainNavItems = [
    { route: "/overview", label: "Dashboard Overview", icon: LayoutDashboard },
    { route: "/meta/overview", label: "Meta Overview", icon: BarChart3 },
    { route: "/meta/campaigns", label: "Campaigns", icon: Megaphone },
    { route: "/meta/adsets", label: "Ad Sets", icon: Layers },
    { route: "/meta/creatives", label: "Creatives", icon: ImageIcon },
    { route: "/meta/audience", label: "Audience", icon: Users },
    { route: "/meta/places", label: "Places", icon: MapPin },
  ];

  const settingsNavItems = [
    { route: "/settings/accounts", label: "Meta Accounts", icon: Settings2 },
  ];

  const handleLogout = () => {
    removeAccessToken();
    if (setUser) setUser(null);
    navigate("/login");
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "var(--color-background, #F8FAFC)", color: "var(--color-text-primary, #0F172A)" }}>
      {/* Fixed Desktop Sidebar */}
      <aside
        style={{
          width: "240px",
          backgroundColor: "#FFFFFF",
          borderRight: "1px solid var(--color-border, #E5E7EB)",
          padding: "24px 16px",
          display: "flex",
          flexDirection: "column",
          position: "sticky",
          top: 0,
          height: "100vh",
          flexShrink: 0,
          boxShadow: "var(--shadow-subtle, 0 1px 3px rgba(15, 23, 42, 0.03))",
        }}
      >
        {/* Brand Logo Header */}
        <div style={{ padding: "0 8px 24px 8px", borderBottom: "1px solid var(--color-border-subtle, #F1F5F9)" }}>
          <AppLogo size="md" />
        </div>

        {/* Navigation Groups */}
        <nav style={{ display: "flex", flexDirection: "column", gap: "20px", flex: 1, paddingTop: "20px", overflowY: "auto" }}>
          {/* Main Analytics Group */}
          <div>
            <span style={{ fontSize: "0.68rem", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.6px", color: "var(--color-text-muted, #94A3B8)", padding: "0 10px", display: "block", marginBottom: "8px" }}>
              Analytics
            </span>
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              {mainNavItems.map((item) => {
                const IconComponent = item.icon;
                return (
                  <NavLink
                    key={item.route}
                    to={item.route}
                    style={({ isActive }) => ({
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "8px 12px",
                      borderRadius: "8px",
                      textDecoration: "none",
                      backgroundColor: isActive ? "var(--color-surface-subtle, #F1F5F9)" : "transparent",
                      color: isActive ? "#0A84FF" : "var(--color-text-secondary, #64748B)",
                      fontSize: "0.85rem",
                      fontWeight: isActive ? "650" : "500",
                      transition: "all 0.15s ease",
                      borderLeft: isActive ? "3px solid #0A84FF" : "3px solid transparent",
                    })}
                  >
                    <IconComponent size={18} strokeWidth={2} />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </div>
          </div>

          {/* Settings Group */}
          <div>
            <span style={{ fontSize: "0.68rem", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.6px", color: "var(--color-text-muted, #94A3B8)", padding: "0 10px", display: "block", marginBottom: "8px" }}>
              Integrations
            </span>
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              {settingsNavItems.map((item) => {
                const IconComponent = item.icon;
                return (
                  <NavLink
                    key={item.route}
                    to={item.route}
                    style={({ isActive }) => ({
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "8px 12px",
                      borderRadius: "8px",
                      textDecoration: "none",
                      backgroundColor: isActive ? "var(--color-surface-subtle, #F1F5F9)" : "transparent",
                      color: isActive ? "#0A84FF" : "var(--color-text-secondary, #64748B)",
                      fontSize: "0.85rem",
                      fontWeight: isActive ? "650" : "500",
                      transition: "all 0.15s ease",
                      borderLeft: isActive ? "3px solid #0A84FF" : "3px solid transparent",
                    })}
                  >
                    <IconComponent size={18} strokeWidth={2} />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </div>
          </div>
        </nav>

        {/* Sidebar Footer User Area */}
        <div style={{ paddingTop: "16px", borderTop: "1px solid var(--color-border, #E5E7EB)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", overflow: "hidden" }}>
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                backgroundColor: "var(--color-primary-light, rgba(10, 132, 255, 0.08))",
                color: "#0A84FF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "700",
                fontSize: "0.8rem",
                flexShrink: 0,
              }}
            >
              {user && user.name ? user.name.charAt(0).toUpperCase() : <User size={16} />}
            </div>
            <div style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
              <span style={{ fontSize: "0.825rem", fontWeight: "650", color: "var(--color-text-primary, #0F172A)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {user ? user.name : "Vytalis User"}
              </span>
              <span style={{ fontSize: "0.72rem", color: "var(--color-text-muted, #94A3B8)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {user ? user.email : "admin@vytalis.com"}
              </span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            title="Log out"
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "6px",
              border: "1px solid var(--color-border, #E5E7EB)",
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
              e.currentTarget.style.backgroundColor = "rgba(220, 38, 38, 0.08)";
              e.currentTarget.style.color = "#DC2626";
              e.currentTarget.style.borderColor = "rgba(220, 38, 38, 0.2)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.color = "var(--color-text-secondary, #64748B)";
              e.currentTarget.style.borderColor = "var(--color-border, #E5E7EB)";
            }}
          >
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main style={{ flex: 1, padding: "32px 36px", overflowY: "auto", minWidth: 0 }}>
        <Outlet />
      </main>
    </div>
  );
};

export default DashboardLayout;
