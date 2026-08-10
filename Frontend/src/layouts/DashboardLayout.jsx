import React from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import AppLogo from "../components/shared/AppLogo.jsx";
import { removeAccessToken } from "../lib/storage.js";

/**
 * DashboardLayout wrapper for overall dashboard & Meta analytics pages.
 * SaaS Layout: Sidebar #FFFFFF (250px, border #E8EAED), Active NavLink #EAF3FF / #0060DF.
 */
export const DashboardLayout = ({ user, setUser }) => {
  const navigate = useNavigate();

  const navItems = [
    { route: "/overview", label: "Dashboard Overview", icon: "📊" },
    { route: "/meta/overview", label: "Meta Overview", icon: "📱" },
    { route: "/meta/campaigns", label: "Campaigns", icon: "🚀" },
    { route: "/meta/adsets", label: "Ad Sets", icon: "📂" },
    { route: "/meta/creatives", label: "Creatives", icon: "🖼️" },
    { route: "/meta/audience", label: "Audience", icon: "👥" },
    { route: "/meta/places", label: "Places", icon: "📍" },
  ];

  const handleLogout = () => {
    removeAccessToken();
    if (setUser) setUser(null);
    navigate("/login");
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "var(--color-background, #FFFFFF)", color: "var(--color-text-primary, #111827)" }}>
      {/* Fixed Desktop Sidebar */}
      <aside
        style={{
          width: "250px",
          backgroundColor: "#FFFFFF",
          borderRight: "1px solid var(--color-border, #E8EAED)",
          padding: "28px 18px",
          display: "flex",
          flexDirection: "column",
          gap: "28px",
          position: "sticky",
          top: 0,
          height: "100vh",
          flexShrink: 0,
        }}
      >
        <AppLogo size="md" />

        <nav style={{ display: "flex", flexDirection: "column", gap: "4px", flex: 1 }}>
          {navItems.map((item) => (
            <NavLink
              key={item.route}
              to={item.route}
              style={({ isActive }) => ({
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "11px 16px",
                borderRadius: "var(--radius-nav, 10px)",
                textDecoration: "none",
                backgroundColor: isActive ? "var(--color-primary-light, #EAF3FF)" : "transparent",
                color: isActive ? "var(--color-primary-hover, #0060DF)" : "var(--color-text-secondary, #475569)",
                fontSize: "0.925rem",
                fontWeight: isActive ? "600" : "500",
                transition: "all 0.15s ease",
              })}
            >
              <span style={{ fontSize: "1.1rem" }}>{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div style={{ paddingTop: "18px", borderTop: "1px solid var(--color-border, #E8EAED)", display: "flex", flexDirection: "column", gap: "12px" }}>
          {user && (
            <div style={{ fontSize: "0.85rem" }}>
              <div style={{ fontWeight: "700", color: "var(--color-text-primary, #111827)" }}>{user.name}</div>
              <div style={{ color: "var(--color-text-muted, #94A3B8)", fontSize: "0.75rem", overflow: "hidden", textOverflow: "ellipsis" }}>{user.email}</div>
            </div>
          )}
          <button
            onClick={handleLogout}
            style={{
              padding: "9px 14px",
              borderRadius: "var(--radius-button, 10px)",
              border: "1px solid var(--color-border, #E8EAED)",
              backgroundColor: "var(--color-surface, #F7F9FC)",
              color: "var(--color-error, #E5484D)",
              fontSize: "0.85rem",
              fontWeight: "600",
              cursor: "pointer",
              textAlign: "center",
              transition: "all 0.15s ease",
            }}
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main style={{ flex: 1, padding: "36px 40px", overflowY: "auto", minWidth: 0 }}>
        <Outlet />
      </main>
    </div>
  );
};

export default DashboardLayout;
