import React, { useState, useEffect, useCallback } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
  useNavigate,
} from "react-router-dom";
import { http } from "../lib/http.js";
import { useRateLimitState } from "../hooks/useRateLimitState.js";
import AuthLayout from "../layouts/AuthLayout.jsx";
import DashboardLayout from "../layouts/DashboardLayout.jsx";
import Welcome from "../features/onboarding/pages/Welcome.jsx";
import DashboardOverview from "../features/dashboard/pages/DashboardOverview.jsx";
import MetaOverview from "../features/meta/pages/MetaOverview.jsx";
import Campaigns from "../features/meta/pages/Campaigns.jsx";
import AdSets from "../features/meta/pages/AdSets.jsx";
import Creatives from "../features/meta/pages/Creatives.jsx";
import WinningCreatives from "../features/meta/pages/WinningCreatives.jsx";
import PoorPerformers from "../features/meta/pages/PoorPerformers.jsx";
import Audience from "../features/meta/pages/Audience.jsx";
import Places from "../features/meta/pages/Places.jsx";
import MetaAccounts from "../features/meta/pages/MetaAccounts.jsx";
import ShopifyOverview from "../features/shopify/pages/ShopifyOverview.jsx";
import ShopifyOrders from "../features/shopify/pages/ShopifyOrders.jsx";
import ShopifyProducts from "../features/shopify/pages/ShopifyProducts.jsx";
import ShopifyCustomers from "../features/shopify/pages/ShopifyCustomers.jsx";
import ShopifyLocation from "../features/shopify/pages/ShopifyLocation.jsx";
import ShopifyAccounts from "../features/shopify/pages/ShopifyAccounts.jsx";
import AttributionOverview from "../features/attribution/pages/AttributionOverview.jsx";
import Profile from "../features/profile/pages/Profile.jsx";
import GoogleIntegration from "../features/integrations/pages/GoogleIntegration.jsx";
import UserManagement from "../features/admin/pages/UserManagement.jsx";
import Input from "../components/ui/Input.jsx";
import Button from "../components/ui/Button.jsx";

// ==========================================
// AUTH FORM COMPONENTS
// ==========================================

const LoginPage = ({ setUser }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { rateLimit, isLocked, countdownStr, handleApiError } = useRateLimitState();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLocked) return;

    if (!email || !password) {
      setError("Email and password are required.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      const res = await http.post("/auth/login", { email, password });
      if (res.data && res.data.user) {
        setUser(res.data.user);

        if (res.data.user?.preferences?.activeMetaAccount) {
          navigate("/overview");
        } else {
          navigate("/welcome");
        }
      }
    } catch (err) {
      handleApiError(err);
      if (err.status === 429 || err.rateLimit?.retryAfter) {
        setError("Too many login attempts.");
      } else {
        setError(err.message || "Invalid email or password.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <h2 style={{ margin: "0 0 8px 0", color: "var(--color-text-primary, #111827)", fontSize: "1.5rem", fontWeight: "700" }}>Welcome Back</h2>
      <p style={{ margin: "0 0 24px 0", color: "var(--color-text-secondary, #475569)", fontSize: "0.875rem" }}>
        Sign in to access your business analytics
      </p>

      {error && (
        <div style={{ padding: "10px 14px", backgroundColor: "var(--color-error-light, rgba(229, 72, 77, 0.10))", border: "1px solid rgba(229, 72, 77, 0.25)", borderRadius: "var(--radius-input, 8px)", color: "var(--color-error, #E5484D)", fontSize: "0.85rem", marginBottom: "16px" }}>
          <div>{error}</div>
          {isLocked && countdownStr && (
            <div style={{ marginTop: "6px", fontWeight: "600", fontSize: "0.85rem" }}>
              Try again in {countdownStr}
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <Input label="Email Address" type="email" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={isLocked || loading} />
        <Input label="Password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required disabled={isLocked || loading} />

        {rateLimit && rateLimit.remaining !== null && !isLocked && (
          <div style={{ fontSize: "0.8rem", color: "var(--color-text-secondary, #64748B)", textAlign: "center", marginTop: "-4px" }}>
            {rateLimit.remaining} {rateLimit.remaining === 1 ? "attempt" : "attempts"} remaining
          </div>
        )}

        <Button type="submit" isLoading={loading} disabled={isLocked || loading} style={{ marginTop: "8px" }}>
          {isLocked ? `Locked · ${countdownStr}` : "Sign In →"}
        </Button>
      </form>

      <div style={{ marginTop: "24px", textAlign: "center", fontSize: "0.875rem", color: "var(--color-text-secondary, #475569)" }}>
        Don't have an account?{" "}
        <button
          onClick={() => navigate("/signup")}
          style={{ background: "none", border: "none", color: "var(--color-primary, #0A84FF)", cursor: "pointer", fontWeight: "600" }}
        >
          Sign Up
        </button>
      </div>
    </AuthLayout>
  );
};

const SignupPage = ({ setUser }) => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { rateLimit, isLocked, countdownStr, handleApiError } = useRateLimitState();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLocked) return;

    if (!name || !email || !password || !accessCode) {
      setError("All fields are required.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      const res = await http.post("/auth/signup", { name, email, password, accessCode });
      if (res.data && res.data.user) {
        setUser(res.data.user);
        navigate("/welcome");
      }
    } catch (err) {
      handleApiError(err);
      if (err.status === 429 || err.rateLimit?.retryAfter) {
        setError("Too many signup attempts.");
      } else {
        setError(err.message || "Registration failed.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <h2 style={{ margin: "0 0 8px 0", color: "var(--color-text-primary, #111827)", fontSize: "1.5rem", fontWeight: "700" }}>Create Vytalis Account</h2>
      <p style={{ margin: "0 0 24px 0", color: "var(--color-text-secondary, #475569)", fontSize: "0.875rem" }}>
        Register using your system access code
      </p>

      {error && (
        <div style={{ padding: "10px 14px", backgroundColor: "var(--color-error-light, rgba(229, 72, 77, 0.10))", border: "1px solid rgba(229, 72, 77, 0.25)", borderRadius: "var(--radius-input, 8px)", color: "var(--color-error, #E5484D)", fontSize: "0.85rem", marginBottom: "16px" }}>
          <div>{error}</div>
          {isLocked && countdownStr && (
            <div style={{ marginTop: "6px", fontWeight: "600", fontSize: "0.85rem" }}>
              Try again in {countdownStr}
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <Input label="Full Name" placeholder="Jane Doe" value={name} onChange={(e) => setName(e.target.value)} required disabled={isLocked || loading} />
        <Input label="Email Address" type="email" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={isLocked || loading} />
        <Input label="Password" type="password" placeholder="At least 6 characters" value={password} onChange={(e) => setPassword(e.target.value)} required disabled={isLocked || loading} />
        <Input label="System Access Code" placeholder="System access verification code" value={accessCode} onChange={(e) => setAccessCode(e.target.value)} required disabled={isLocked || loading} />

        {rateLimit && rateLimit.remaining !== null && !isLocked && (
          <div style={{ fontSize: "0.8rem", color: "var(--color-text-secondary, #64748B)", textAlign: "center", marginTop: "-4px" }}>
            {rateLimit.remaining} {rateLimit.remaining === 1 ? "attempt" : "attempts"} remaining
          </div>
        )}

        <Button type="submit" isLoading={loading} disabled={isLocked || loading} style={{ marginTop: "8px" }}>
          {isLocked ? `Locked · ${countdownStr}` : "Create Account →"}
        </Button>
      </form>

      <div style={{ marginTop: "24px", textAlign: "center", fontSize: "0.875rem", color: "var(--color-text-secondary, #475569)" }}>
        Already registered?{" "}
        <button
          onClick={() => navigate("/login")}
          style={{ background: "none", border: "none", color: "var(--color-primary, #0A84FF)", cursor: "pointer", fontWeight: "600" }}
        >
          Sign In
        </button>
      </div>
    </AuthLayout>
  );
};

// ==========================================
// ROUTE GUARDS & WRAPPERS
// ==========================================

const LoadingScreen = () => (
  <div style={{ minHeight: "100vh", backgroundColor: "var(--color-background, #FFFFFF)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-primary, #0A84FF)", fontSize: "1.2rem", fontWeight: "600" }}>
    Loading Vytalis Intelligence...
  </div>
);

const PublicRoute = ({ user, authLoading }) => {
  if (authLoading) return <LoadingScreen />;

  if (user) {
    if (user.preferences?.activeMetaAccount) {
      return <Navigate to="/overview" replace />;
    }
    return <Navigate to="/welcome" replace />;
  }

  return <Outlet />;
};

const WelcomeRoute = ({ user, authLoading, restoreSession }) => {
  const navigate = useNavigate();

  if (authLoading) return <LoadingScreen />;

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.preferences?.activeMetaAccount) {
    return <Navigate to="/overview" replace />;
  }

  return (
    <Welcome
      onOnboarded={async () => {
        await restoreSession();
        navigate("/overview");
      }}
    />
  );
};

const ProtectedRoute = ({ user, setUser, authLoading }) => {
  if (authLoading) return <LoadingScreen />;

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!user.preferences?.activeMetaAccount) {
    return <Navigate to="/welcome" replace />;
  }

  return <DashboardLayout user={user} setUser={setUser} />;
};

const AdminRouteGuard = ({ user }) => {
  if (!user || user.role !== "admin") {
    return <Navigate to="/overview" replace />;
  }
  return <UserManagement />;
};

const ShopifyRouteGuard = ({ user }) => {
  const isShopifyEnabled = user && (user.role === "admin" || Boolean(user.shopifyEnabled) === true);
  if (!isShopifyEnabled) {
    return <Navigate to="/overview" replace />;
  }
  return <Outlet />;
};

const AttributionRouteGuard = ({ user }) => {
  const isAttributionEnabled = user && (user.role === "admin" || Boolean(user.attributionEnabled) === true);
  if (!isAttributionEnabled) {
    return <Navigate to="/overview" replace />;
  }
  return <AttributionOverview />;
};

const FallbackRoute = ({ user, authLoading }) => {
  if (authLoading) return null;
  if (user) {
    if (user.preferences?.activeMetaAccount) {
      return <Navigate to="/overview" replace />;
    }
    return <Navigate to="/welcome" replace />;
  }
  return <Navigate to="/login" replace />;
};

// ==========================================
// MAIN ROUTER COMPONENT
// ==========================================

export const Router = () => {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const restoreSession = useCallback(async () => {
    try {
      setAuthLoading(true);
      const res = await http.get("/auth/me");
      if (res.data && res.data.user) {
        setUser(res.data.user);
      } else {
        setUser(null);
      }
    } catch (err) {
      setUser(null);
    } finally {
      setAuthLoading(false);
    }
  }, []);

  useEffect(() => {
    restoreSession();

    const handleAuthExpired = () => {
      setUser(null);
    };

    window.addEventListener("vytalis:auth-expired", handleAuthExpired);
    return () => {
      window.removeEventListener("vytalis:auth-expired", handleAuthExpired);
    };
  }, [restoreSession]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Auth Routes */}
        <Route element={<PublicRoute user={user} authLoading={authLoading} />}>
          <Route path="/login" element={<LoginPage setUser={setUser} />} />
          <Route path="/signup" element={<SignupPage setUser={setUser} />} />
        </Route>

        {/* Onboarding Route */}
        <Route
          path="/welcome"
          element={
            <WelcomeRoute
              user={user}
              authLoading={authLoading}
              restoreSession={restoreSession}
            />
          }
        />

        {/* Protected Dashboard Shell Routes */}
        <Route element={<ProtectedRoute user={user} setUser={setUser} authLoading={authLoading} />}>
          {/* Global Analytics Overview */}
          <Route path="/overview" element={<DashboardOverview user={user} />} />

          {/* Profile Route */}
          <Route path="/profile" element={<Profile user={user} setUser={setUser} />} />

          {/* Protected Admin Route */}
          <Route path="/admin/users" element={<AdminRouteGuard user={user} />} />
          <Route path="/admin" element={<Navigate to="/admin/users" replace />} />

          {/* Protected Attribution Route */}
          <Route path="/attribution" element={<AttributionRouteGuard user={user} />} />

          {/* Meta Analytics Routes */}
          <Route path="/meta/overview" element={<MetaOverview />} />
          <Route path="/meta/campaigns" element={<Campaigns />} />
          <Route path="/meta/adsets" element={<AdSets />} />
          <Route path="/meta/creatives" element={<Creatives />} />
          <Route path="/meta/winning-creatives" element={<WinningCreatives />} />
          <Route path="/meta/poor-performers" element={<PoorPerformers />} />
          <Route path="/meta/audience" element={<Audience />} />
          <Route path="/meta/places" element={<Places />} />
          <Route path="/meta" element={<Navigate to="/meta/overview" replace />} />

          {/* Protected Shopify Analytics & Integration Routes */}
          <Route element={<ShopifyRouteGuard user={user} />}>
            <Route path="/shopify/overview" element={<ShopifyOverview />} />
            <Route path="/shopify/orders" element={<ShopifyOrders />} />
            <Route path="/shopify/products" element={<ShopifyProducts />} />
            <Route path="/shopify/customers" element={<ShopifyCustomers />} />
            <Route path="/shopify/location" element={<ShopifyLocation />} />
            <Route path="/shopify" element={<Navigate to="/shopify/overview" replace />} />
            <Route path="/integrations/shopify" element={<ShopifyAccounts />} />
          </Route>

          {/* Integrations Routes */}
          <Route path="/integrations/meta" element={<MetaAccounts />} />
          <Route path="/integrations/google" element={<GoogleIntegration />} />
          <Route path="/integrations" element={<Navigate to="/integrations/meta" replace />} />

          {/* Backwards Compatibility Redirects */}
          <Route path="/settings/accounts" element={<Navigate to="/integrations/meta" replace />} />
          <Route path="/settings" element={<Navigate to="/integrations/meta" replace />} />
        </Route>

        {/* Fallback Catch-all Route */}
        <Route path="*" element={<FallbackRoute user={user} authLoading={authLoading} />} />
      </Routes>
    </BrowserRouter>
  );
};

export default Router;
