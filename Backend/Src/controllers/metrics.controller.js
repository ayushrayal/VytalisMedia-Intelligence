/**
 * Metrics Controller for Vytalis Intelligence (Phase 2 - Task #9).
 * Exposes read-only metric registry metadata without executing metric calculations or querying external providers.
 */

const { METRIC_REGISTRY } = require("../config/metric-registry.config");
const { sendSuccess } = require("../utils/api-response.util");

/**
 * GET /api/metrics/registry (or /api/admin/metric-registry)
 * Returns authoritative metadata entries from Metric Registry.
 */
const getMetricRegistry = async (req, res, next) => {
  try {
    const { platform, category, type } = req.query || {};
    let metricsList = Object.values(METRIC_REGISTRY);

    if (platform) {
      const cleanPlatform = String(platform).toLowerCase().trim();
      metricsList = metricsList.filter((m) => m.platform === cleanPlatform);
    }

    if (category) {
      const cleanCategory = String(category).toLowerCase().trim();
      metricsList = metricsList.filter((m) => m.category === cleanCategory);
    }

    if (type) {
      const cleanType = String(type).toLowerCase().trim();
      metricsList = metricsList.filter((m) => m.type === cleanType);
    }

    return sendSuccess(res, 200, "Metric Registry retrieved successfully", {
      total: metricsList.length,
      metrics: metricsList,
      metricsMap: METRIC_REGISTRY,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/metrics/registry/:metricId
 * Returns metadata for a specific metric by canonical ID.
 */
const getMetricById = async (req, res, next) => {
  try {
    const { metricId } = req.params;
    const entry = METRIC_REGISTRY[metricId];

    if (!entry) {
      const error = new Error(`Metric with ID '${metricId}' not found in Metric Registry`);
      error.statusCode = 404;
      throw error;
    }

    return sendSuccess(res, 200, `Metric '${metricId}' retrieved successfully`, {
      metric: entry,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMetricRegistry,
  getMetricById,
};
