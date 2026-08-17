const cacheUtil = require("../utils/cache.util");
const { sendError } = require("../utils/api-response.util");
const logger = require("../utils/logger.util");

/**
 * Normalizes client IP address string to ensure loopback IPv4/IPv6 variants
 * (::1, ::ffff:127.0.0.1) map to a consistent rate-limiting key.
 *
 * @param {string} ip - Raw IP string
 * @returns {string} Cleaned IP address
 */
const normalizeIp = (ip) => {
  if (!ip) return "127.0.0.1";
  let cleaned = String(ip).trim();
  if (cleaned.startsWith("::ffff:")) {
    cleaned = cleaned.substring(7);
  }
  if (cleaned === "::1") {
    cleaned = "127.0.0.1";
  }
  return cleaned;
};

/**
 * Safely extracts real client IP address respecting Express trust proxy settings
 * and proxy headers on cloud platforms like Render.
 *
 * @param {Object} req - Express request object
 * @returns {string} Cleaned client IP address
 */
const getClientIp = (req) => {
   console.log("[IP DIAGNOSTIC]", {
    reqIp: req.ip,
    reqIps: req.ips,
    xForwardedFor: req.headers["x-forwarded-for"],
    cfConnectingIp: req.headers["cf-connecting-ip"],
    socketIp: req.socket?.remoteAddress,
  });
  let rawIp = req.ip;

  // Fallback if req.ip is unpopulated or resolves to loopback when proxy headers exist
  if (!rawIp || rawIp === "127.0.0.1" || rawIp === "::1" || rawIp === "::ffff:127.0.0.1") {
    if (req.ips && req.ips.length > 0) {
      rawIp = req.ips[0];
    } else if (req.headers && req.headers["x-forwarded-for"]) {
      const forwarded = String(req.headers["x-forwarded-for"]).split(",");
      rawIp = forwarded[0].trim();
    } else if (req.socket?.remoteAddress) {
      rawIp = req.socket.remoteAddress;
    }
  }

  return normalizeIp(rawIp);
};

/**
 * Creates an Express rate-limiting middleware backed strictly by Redis.
 * Enforces production requirement: Redis is the single authoritative rate-limit store.
 *
 * @param {Object} options Configuration options
 * @param {number} options.windowMs Window size in milliseconds
 * @param {number} options.maxRequests Maximum allowed requests per window
 * @param {string} options.keyPrefix Redis key prefix (e.g. 'auth:login')
 * @param {string} [options.errorMessage] Custom non-sensitive error message
 * @returns {Function} Express middleware handler
 */
const createRateLimiter = ({
  windowMs = 15 * 60 * 1000,
  maxRequests = 5,
  keyPrefix = "general",
  errorMessage = "Too many requests, please try again later.",
}) => {
  const windowSeconds = Math.ceil(windowMs / 1000);

  return async (req, res, next) => {
    const clientIp = getClientIp(req);
    const redisKey = `ratelimit:${keyPrefix}:${clientIp}`;

    const rateLimitData = await cacheUtil.incrWithTtl(redisKey, windowSeconds);

    // Redis authoritative check: If Redis is unavailable
    if (!rateLimitData) {
      const isProd = process.env.NODE_ENV === "production";
      logger.error(`[Rate Limiter] Redis storage unavailable for key: ${redisKey}`);

      if (isProd) {
        // Fail-secure in production: Redis is mandatory for rate limiting
        return sendError(
          res,
          500,
          "Security configuration error: Rate limiting storage unavailable."
        );
      } else {
        // In dev/testing, warn but allow execution if Redis is not running
        return next();
      }
    }

    const { current, ttl } = rateLimitData;
    const remaining = Math.max(0, maxRequests - current);

    // Set standard RateLimit headers
    res.setHeader("RateLimit-Limit", maxRequests);
    res.setHeader("RateLimit-Remaining", remaining);
    res.setHeader("RateLimit-Reset", ttl);

    const reqId = req.headers?.["x-request-id"] || `srv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    logger.info(
      `[RateLimiter Diagnostic] reqId: ${reqId} | endpoint: ${req.originalUrl} | IP: ${clientIp} | Redis key: ${redisKey} | count: ${current} | remaining: ${remaining} | reset: ${ttl}`
    );

    if (current > maxRequests) {
      logger.warn(
        `[Rate Limiter Exceeded] IP: ${clientIp} Prefix: ${keyPrefix} Count: ${current}/${maxRequests}`
      );
      res.setHeader("Retry-After", ttl);
      return sendError(res, 429, errorMessage);
    }

    next();
  };
};

// Preset rate limiters with configurable environment fallbacks

const signupRateLimiter = createRateLimiter({
  windowMs: parseInt(process.env.SIGNUP_RATE_LIMIT_WINDOW_MS || "900000", 10), // 15 min
  maxRequests: parseInt(process.env.SIGNUP_RATE_LIMIT_MAX || "5", 10), // 5 requests
  keyPrefix: "auth:signup",
  errorMessage: "Too many signup attempts from this IP address. Please try again after 15 minutes.",
});

const loginRateLimiter = createRateLimiter({
  windowMs: parseInt(process.env.LOGIN_RATE_LIMIT_WINDOW_MS || "900000", 10), // 15 min
  maxRequests: parseInt(process.env.LOGIN_RATE_LIMIT_MAX || "5", 10), // 5 requests
  keyPrefix: "auth:login",
  errorMessage: "Too many login attempts from this IP address. Please try again after 15 minutes.",
});

const apiRateLimiter = createRateLimiter({
  windowMs: parseInt(process.env.API_RATE_LIMIT_WINDOW_MS || "900000", 10), // 15 min
  maxRequests: parseInt(process.env.API_RATE_LIMIT_MAX || "300", 10), // 300 requests (configurable)
  keyPrefix: "api:general",
  errorMessage: "General API rate limit exceeded. Please lower request frequency.",
});

module.exports = {
  createRateLimiter,
  signupRateLimiter,
  loginRateLimiter,
  apiRateLimiter,
  normalizeIp,
  getClientIp,
};
