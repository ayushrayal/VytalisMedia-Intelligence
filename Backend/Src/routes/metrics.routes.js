/**
 * Metrics Routes for Vytalis Intelligence (Phase 2 - Task #9).
 * Defines API endpoints for retrieving Metric Registry metadata.
 */

const express = require("express");
const router = express.Router();
const metricsController = require("../controllers/metrics.controller");
const { protect } = require("../middleware/auth.middleware");

// Require JWT authentication for all metric registry lookups
router.use(protect);

router.get("/registry", metricsController.getMetricRegistry);
router.get("/registry/:metricId", metricsController.getMetricById);

module.exports = router;
