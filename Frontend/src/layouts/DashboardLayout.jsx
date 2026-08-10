import React from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import AppLogo from "../components/shared/AppLogo.jsx";
import { removeAccessToken } from "../lib/storage.js";

/**
 * DashboardLayout wrapper for overall dashboard & Meta analytics pages.
 * Renders Sidebar navigation via NavLink and nested route content via Outlet.
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
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#0f172a", color: "#f8fafc" }}>
      {/* Sidebar */}
      <aside
        style={{
          width: "240px",
          backgroundColor: "#1e293b",
          borderRight: "1px solid #334155",
          padding: "24px 16px",
          display: "flex",
          flexDirection: "column",
          gap: "24px",
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
                gap: "10px",
                padding: "10px 14px",
                borderRadius: "8px",
                textDecoration: "none",
                backgroundColor: isActive ? "#6366f1" : "transparent",
                color: isActive ? "#ffffff" : "#94a3b8",
                fontSize: "0.9rem",
                fontWeight: isActive ? "600" : "500",
                transition: "all 0.15s ease",
              })}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User Info / Logout */}
        <div style={{ paddingTop: "16px", borderTop: "1px solid #334155", display: "flex", flexDirection: "column", gap: "12px" }}>
          {user && (
            <div style={{ fontSize: "0.85rem" }}>
              <div style={{ fontWeight: "600", color: "#f8fafc" }}>{user.name}</div>
              <div style={{ color: "#64748b", fontSize: "0.75rem", overflow: "hidden", textOverflow: "ellipsis" }}>{user.email}</div>
            </div>
          )}
          <button
            onClick={handleLogout}
            style={{
              padding: "8px 12px",
              borderRadius: "6px",
              border: "1px solid #334155",
              backgroundColor: "transparent",
              color: "#f87171",
              fontSize: "0.85rem",
              fontWeight: "600",
              cursor: "pointer",
              textAlign: "center",
            }}
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main style={{ flex: 1, padding: "32px", overflowY: "auto" }}>
        <Outlet />
      </main>
    </div>
  );
};

export default DashboardLayout;
