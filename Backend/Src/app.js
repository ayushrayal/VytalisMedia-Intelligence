const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const path = require("path");

const authRoutes = require("./routes/auth.routes");
const metaRoutes = require("./routes/meta.routes");
const shopifyRoutes = require("./routes/shopify.routes");
const attributionRoutes = require("./routes/attribution.routes");
const profileRoutes = require("./routes/profile.routes");
const adminRoutes = require("./routes/admin.routes");
const clientTeamRoutes = require("./routes/client-team.routes");
const metricsRoutes = require("./routes/metrics.routes");
const dashboardRoutes = require("./routes/dashboard.routes");
const errorHandler = require("./middleware/error.middleware");
const { apiRateLimiter } = require("./middleware/rate-limit.middleware");
const { sendSuccess } = require("./utils/api-response.util");

const app = express();


// Set Trust Proxy safely based on environment configuration.
// Defaults to 1 (trust 1 proxy hop e.g. Render / Cloud reverse proxy) in production.
if (process.env.TRUST_PROXY !== undefined) {
  const trustProxyVal = process.env.TRUST_PROXY;
  if (trustProxyVal === "true") app.set("trust proxy", true);
  else if (trustProxyVal === "false") app.set("trust proxy", false);
  else if (!isNaN(Number(trustProxyVal))) app.set("trust proxy", Number(trustProxyVal));
  else app.set("trust proxy", trustProxyVal);
} else {
  // Production default: Trust 1 proxy hop (Render reverse proxy)
  const isProd = process.env.NODE_ENV === "production" || Boolean(process.env.RENDER);
  app.set("trust proxy", isProd ? 1 : false);
}

// ==========================================
// MIDDLEWARES
// ==========================================

// Strict credentialed CORS handling (never wildcard '*')
const defaultOrigins = [
  "https://vytalismedia-intelligence.onrender.com",
  "http://localhost:5173",
  "http://localhost:5000",
];

const envOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(",").map((o) => o.trim()).filter(Boolean)
  : [];

const allowedOriginsList = Array.from(new Set([...defaultOrigins, ...envOrigins]));

app.use(
  cors({
    origin: (origin, callback) => {
      // 1. Allow requests with no origin header (same-origin GET, static assets, server calls)
      if (!origin) {
        return callback(null, true);
      }

      // 2. Allow if origin is explicitly in allowedOriginsList
      if (allowedOriginsList.includes(origin)) {
        return callback(null, true);
      }

      // 3. Allow same-origin or trusted domain matches (e.g. any *.onrender.com or localhost dev)
      try {
        const originUrl = new URL(origin);
        if (
          originUrl.hostname === "localhost" ||
          originUrl.hostname === "127.0.0.1" ||
          originUrl.hostname.endsWith(".onrender.com")
        ) {
          return callback(null, true);
        }
      } catch (e) {
        // Invalid origin URL format
      }

      // 4. Safely reject disallowed origins without throwing an Express 500 error
      return callback(null, false);
    },
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==========================================
// HEALTH CHECK (Excluded from Rate Limiting)
// ==========================================

app.get("/api/health", (req, res) => {
  return sendSuccess(res, 200, "Vytalis Intelligence API Healthy", {
    status: "healthy",
    timestamp: new Date().toISOString(),
  });
});

// ==========================================
// API ROUTES
// ==========================================

// Authentication endpoints have dedicated strict rate limiters
app.use("/api/auth", authRoutes);

// General authenticated business API routes protected by configurable API rate limiter
app.use("/api/meta", apiRateLimiter, metaRoutes);
app.use("/api/shopify", apiRateLimiter, shopifyRoutes);
app.use("/api/attribution", apiRateLimiter, attributionRoutes);
app.use("/api/profile", apiRateLimiter, profileRoutes);
app.use("/api/admin", apiRateLimiter, adminRoutes);
app.use("/api/client", apiRateLimiter, clientTeamRoutes);
app.use("/api/metrics", apiRateLimiter, metricsRoutes);
app.use("/api/dashboard", apiRateLimiter, dashboardRoutes);


// ==========================================
// REACT FRONTEND
// ==========================================

const frontendPath = path.join(__dirname, "public");
app.use(express.static(frontendPath));

// ==========================================
// REACT ROUTER FALLBACK
// ==========================================

app.use((req, res, next) => {
  if (req.method !== "GET") {
    return next();
  }

  if (req.path.startsWith("/api/")) {
    return next();
  }

  res.sendFile(path.join(frontendPath, "index.html"));
});

// ==========================================
// GLOBAL ERROR HANDLER
// ==========================================

app.use(errorHandler);

module.exports = app;