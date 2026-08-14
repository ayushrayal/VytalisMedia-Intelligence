/**
 * Attribution Controller for Vytalis Intelligence.
 * Handles HTTP requests for Attribution overview and order-level attribution data.
 */

const attributionService = require("../services/attribution.service");
const { sendSuccess } = require("../utils/api-response.util");

/**
 * Handles GET /api/attribution/overview
 */
const getOverview = async (req, res, next) => {
  try {
    const result = await attributionService.getAttributionOverview({
      user: req.user,
      query: req.query,
    });

    return sendSuccess(
      res,
      200,
      "Attribution overview retrieved successfully.",
      result.data,
      result.meta
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Handles GET /api/attribution/orders
 */
const getOrders = async (req, res, next) => {
  try {
    const result = await attributionService.getAttributionOrders({
      user: req.user,
      query: req.query,
    });

    return sendSuccess(
      res,
      200,
      "Attribution orders retrieved successfully.",
      result.data,
      result.meta
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getOverview,
  getOrders,
};
