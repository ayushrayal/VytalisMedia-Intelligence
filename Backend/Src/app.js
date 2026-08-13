const express = require("express");
const cors = require("cors");
const path = require("path");

const authRoutes = require("./routes/auth.routes");
const metaRoutes = require("./routes/meta.routes");
const shopifyRoutes = require("./routes/shopify.routes");
const errorHandler = require("./middleware/error.middleware");

const app = express();


// ==========================================
// MIDDLEWARES
// ==========================================

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// ==========================================
// HEALTH CHECK
// ==========================================



// ==========================================
// API ROUTES
// ==========================================

app.use("/api/auth", authRoutes);
app.use("/api/meta", metaRoutes);
app.use("/api/shopify", shopifyRoutes);


// ==========================================
// REACT FRONTEND
// ==========================================

// React build files are inside:
// backend/public/

const frontendPath = path.join(__dirname, "public");

app.use(express.static(frontendPath));


// ==========================================
// REACT ROUTER FALLBACK
// ==========================================

// If request is not an API request,
// serve React's index.html.
//
// This allows routes like:
// /meta/overview
// /meta/campaigns
// /meta/adsets
// /meta/creatives

app.use((req, res, next) => {
  if (req.method !== "GET") {
    return next();
  }

  // Never send API requests to React
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