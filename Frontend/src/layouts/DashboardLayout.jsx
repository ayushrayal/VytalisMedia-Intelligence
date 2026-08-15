import React, { useState, useEffect, useRef } from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
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
  ShoppingCart,
  Package,
  ChevronDown,
  ChevronRight,
  Target,
} from "lucide-react";

import metaLogoImg from "../assets/mobile.png";
import shopifyLogoImg from "../assets/shopify.png";

/**
 * Provider Icons from assets
 */
const MetaIcon = ({ size = 18 }) => (
  <img
    src={metaLogoImg}
    alt="Meta"
    style={{ width: `${size}px`, height: `${size}px`, objectFit: "contain", flexShrink: 0, borderRadius: "3px" }}
  />
);

const ShopifyIcon = ({ size = 18 }) => (
  <img
    src={shopifyLogoImg}
    alt="Shopify"
    style={{ width: `${size}px`, height: `${size}px`, objectFit: "contain", flexShrink: 0, borderRadius: "3px" }}
  />
);

const GoogleIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
    <path
      d="M22.56 12.25C22.56 11.47 22.49 10.72 22.36 10H12V14.26H17.92C17.67 15.63 16.89 16.79 15.73 17.57V20.34H19.28C21.36 18.42 22.56 15.6 22.56 12.25Z"
      fill="#4285F4"
    />
    <path
      d="M12 23C14.97 23 17.46 22.02 19.28 20.34L15.73 17.57C14.75 18.23 13.49 18.63 12 18.63C9.13 18.63 6.7 16.69 5.83 14.08H2.18V16.91C4 20.53 7.7 23 12 23Z"
      fill="#34A853"
    />
    <path
      d="M5.83 14.08C5.61 13.42 5.48 12.72 5.48 12C5.48 11.28 5.61 10.58 5.83 9.92V7.09H2.18C1.43 8.57 1 10.23 1 12C1 13.77 1.43 15.43 2.18 16.91L5.83 14.08Z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38C13.62 5.38 15.06 5.94 16.21 7.02L19.36 3.87C17.45 2.09 14.97 1 12 1C7.7 1 4 3.47 2.18 7.09L5.83 9.92C6.7 7.31 9.13 5.38 12 5.38Z"
      fill="#EA4335"
    />
  </svg>
);

/**
 * Configuration-driven Analytics Navigation Data
 */
const analyticsNavigation = [
  {
    key: "overview",
    label: "Overview",
    route: "/overview",
    icon: LayoutDashboard,
  },
  {
    key: "meta",
    label: "Meta",
    icon: MetaIcon,
    basePath: "/meta",
    children: [
      { route: "/meta/overview", label: "Overview", icon: BarChart3 },
      { route: "/meta/campaigns", label: "Campaigns", icon: Megaphone },
      { route: "/meta/adsets", label: "Ad Sets", icon: Layers },
      { route: "/meta/creatives", label: "Creatives", icon: ImageIcon },
      { route: "/meta/audience", label: "Audience", icon: Users },
      { route: "/meta/places", label: "Places", icon: MapPin },
    ],
  },
  {
    key: "shopify",
    label: "Shopify",
    icon: ShopifyIcon,
    basePath: "/shopify",
    children: [
      { route: "/shopify/overview", label: "Overview", icon: BarChart3 },
      { route: "/shopify/orders", label: "Orders", icon: ShoppingCart },
      { route: "/shopify/products", label: "Products", icon: Package },
      { route: "/shopify/customers", label: "Customers", icon: Users },
      { route: "/shopify/location", label: "Location", icon: MapPin },
    ],
  },
  {
    key: "attribution",
    label: "Attribution",
    route: "/attribution",
    icon: Target,
  },
];

/**
 * Configuration-driven Integrations Navigation Data
 */
const integrationsNavigation = [
  { route: "/integrations/meta", label: "Meta", icon: MetaIcon },
  { route: "/integrations/shopify", label: "Shopify", icon: ShopifyIcon },
  { route: "/integrations/google", label: "Google", icon: GoogleIcon },
];

/**
 * DashboardLayout wrapper for overall dashboard analytics & integration pages.
 * Features hidden scrollbar styling with fully functional scroll behavior.
 */
export const DashboardLayout = ({ user, setUser }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const logoutTriggerRef = useRef(null);

  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Group expansion state
  const [expandedGroups, setExpandedGroups] = useState({
    meta: true,
    shopify: true,
  });

  // Auto-expand active provider group on route change or refresh
  useEffect(() => {
    const path = location.pathname;
    if (path.startsWith("/meta")) {
      setExpandedGroups((prev) => ({ ...prev, meta: true }));
    } else if (path.startsWith("/shopify")) {
      setExpandedGroups((prev) => ({ ...prev, shopify: true }));
    }
  }, [location.pathname]);

  const toggleGroup = (groupKey) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupKey]: !prev[groupKey],
    }));
  };

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

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "var(--color-background, #F8FAFC)", color: "var(--color-text-primary, #0F172A)" }}>
      {/* Fixed Desktop Sidebar with Hidden Scrollbar */}
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

        {/* Navigation Section with Hidden Scrollbar */}
        <nav
          className="no-scrollbar"
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            paddingTop: "18px",
            overflowY: "auto",
            scrollbarWidth: "none", /* Firefox */
            msOverflowStyle: "none", /* IE and Edge */
          }}
        >
          {/* Inline CSS to hide WebKit scrollbar */}
          <style>{`
            .no-scrollbar::-webkit-scrollbar {
              display: none;
            }
          `}</style>

          {/* ANALYTICS SECTION */}
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
              Analytics
            </span>

            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              {analyticsNavigation.map((group) => {
                // Single Item (Global Overview)
                if (group.route) {
                  const IconComponent = group.icon;
                  return (
                    <NavLink
                      key={group.route}
                      to={group.route}
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
                      <span>{group.label}</span>
                    </NavLink>
                  );
                }

                // Collapsible Provider Group (Meta, Shopify)
                const isExpanded = expandedGroups[group.key] ?? true;
                const isGroupActive = location.pathname.startsWith(group.basePath);
                const GroupIcon = group.icon;

                return (
                  <div key={group.key} style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                    {/* Collapsible Header Button with Provider Branding Icon */}
                    <button
                      type="button"
                      onClick={() => toggleGroup(group.key)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "8px 10px",
                        borderRadius: "var(--radius-nav, 6px)",
                        backgroundColor: "transparent",
                        border: "none",
                        color: isGroupActive ? "#0A84FF" : "var(--color-text-secondary, #64748B)",
                        fontSize: "13px",
                        fontWeight: "600",
                        cursor: "pointer",
                        width: "100%",
                        textAlign: "left",
                        transition: "all 0.15s ease",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <GroupIcon size={18} />
                        <span>{group.label}</span>
                      </div>
                      {isExpanded ? (
                        <ChevronDown size={14} color="#94A3B8" />
                      ) : (
                        <ChevronRight size={14} color="#94A3B8" />
                      )}
                    </button>

                    {/* Collapsible Children Item List */}
                    {isExpanded && (
                      <div style={{ display: "flex", flexDirection: "column", gap: "2px", paddingLeft: "14px" }}>
                        {group.children.map((child) => {
                          const ChildIcon = child.icon;
                          return (
                            <NavLink
                              key={child.route}
                              to={child.route}
                              style={({ isActive }) => ({
                                display: "flex",
                                alignItems: "center",
                                gap: "10px",
                                padding: "7px 10px",
                                borderRadius: "var(--radius-nav, 6px)",
                                textDecoration: "none",
                                backgroundColor: isActive ? "var(--color-surface-subtle, #F1F5F9)" : "transparent",
                                color: isActive ? "#0A84FF" : "var(--color-text-secondary, #64748B)",
                                fontSize: "12.5px",
                                fontWeight: isActive ? "600" : "500",
                                transition: "all 0.15s ease",
                                borderLeft: isActive ? "2px solid #0A84FF" : "2px solid transparent",
                              })}
                            >
                              <ChildIcon size={16} strokeWidth={2} style={{ flexShrink: 0 }} />
                              <span>{child.label}</span>
                            </NavLink>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* INTEGRATIONS SECTION */}
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
              Integrations
            </span>
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              {integrationsNavigation.map((item) => {
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
                    <IconComponent size={18} />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </div>
          </div>
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
