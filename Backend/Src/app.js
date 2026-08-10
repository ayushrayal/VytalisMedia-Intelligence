const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/auth.routes");
const metaRoutes = require("./routes/meta.routes");
const errorHandler = require("./middleware/error.middleware");

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Vytalis Intelligence API is running 🚀",
    data: null,
    meta: null,
    errors: null,
  });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/meta", metaRoutes);

// Global Error Handler Middleware
app.use(errorHandler);

module.exports = app;