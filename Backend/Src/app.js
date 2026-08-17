const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const path = require("path");

const authRoutes = require("./routes/auth.routes");
const metaRoutes = require("./routes/meta.routes");
const shopifyRoutes = require("./routes/shopify.routes");
const attributionRoutes = require("./routes/attribution.routes");
const errorHandler = require("./middleware/error.middleware");
const { apiRateLimiter } = require("./middleware/rate-limit.middleware");
const { sendSuccess } = require("./utils/api-response.util");

const app = express();

// Set Trust Proxy safely based on environment configuration
// (e.g. false, 1, or loopback) to ensure req.ip cannot be spoofed
if (process.env.TRUST_PROXY) {
  const trustProxyVal = process.env.TRUST_PROXY;
  if (trustProxyVal === "true") app.set("trust proxy", true);
  else if (trustProxyVal === "false") app.set("trust proxy", false);
  else if (!isNaN(Number(trustProxyVal))) app.set("trust proxy", Number(trustProxyVal));
  else app.set("trust proxy", trustProxyVal);
} else {
  app.set("trust proxy", false);
}

// ==========================================
// MIDDLEWARES
// ==========================================

// Strict credentialed CORS handling (never wildcard '*')
const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(",").map((o) => o.trim())
  : ["http://localhost:5173", "http://localhost:3000", "http://localhost:5000"];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or same-origin static frontend)
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("CORS policy violation: origin not allowed"), false);
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