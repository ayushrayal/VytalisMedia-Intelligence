/**
 * Dashboard Aggregation Controller for Vytalis Intelligence (Phase 3 - Task #16).
 * Serves aggregated dashboard endpoints for consolidated client analytics.
 */

const dashboardService = require("../services/dashboard-aggregation.service");
const { sendSuccess } = require("../utils/api-response.util");

/**
 * Handles request for aggregated dashboard overview data.
 * Endpoint: GET /api/dashboard/overview
 */
const getOverviewAggregation = async (req, res, next) => {
  try {
    const result = await dashboardService.getDashboardOverviewAggregation({
      user: req.user,
      query: req.query,
    });

    return sendSuccess(
      res,
      200,
      "Aggregated dashboard overview retrieved successfully.",
      result
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getOverviewAggregation,
};
