/**
 * HTTP Client abstraction for Vytalis Intelligence frontend.
 * Built using native browser fetch API with HttpOnly cookie support, automatic token refresh,
 * and rate-limit header parsing.
 * 
 * - Credentials mode: 'same-origin' (or 'include') so cookies are automatically transmitted.
 * - Single-flight refresh lock prevents multiple simultaneous refresh calls on concurrent 401s.
 * - Parses RateLimit headers (RateLimit-Limit, RateLimit-Remaining, RateLimit-Reset, Retry-After).
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";
const CREDENTIALS_MODE = import.meta.env.VITE_API_CREDENTIALS || "same-origin";

// Module-level single-flight refresh lock promise
let refreshPromise = null;

/**
 * Extracts and normalizes rate-limit headers from response.
 *
 * @param {Headers} headers - Fetch Response headers
 * @returns {Object|null} Rate limit info object or null
 */
const parseRateLimitHeaders = (headers) => {
  if (!headers) return null;

  const rawLimit = headers.get("RateLimit-Limit") || headers.get("ratelimit-limit");
  const rawRemaining = headers.get("RateLimit-Remaining") || headers.get("ratelimit-remaining");
  const rawReset = headers.get("RateLimit-Reset") || headers.get("ratelimit-reset");
  const rawRetryAfter = headers.get("Retry-After") || headers.get("retry-after");

  const limit = rawLimit !== null ? parseInt(rawLimit, 10) : null;
  const remaining = rawRemaining !== null ? parseInt(rawRemaining, 10) : null;
  const reset = rawReset !== null ? parseInt(rawReset, 10) : null;
  const retryAfter = rawRetryAfter !== null ? parseInt(rawRetryAfter, 10) : null;

  if (limit === null && remaining === null && reset === null && retryAfter === null) {
    return null;
  }

  return {
    limit,
    remaining,
    reset,
    retryAfter,
  };
};

/**
 * Performs a single token refresh request with in-flight deduplication.
 *
 * @returns {Promise<boolean>} True if token refresh succeeded
 */
const executeTokenRefresh = async () => {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const refreshUrl = `${BASE_URL}/auth/refresh`;
        const res = await fetch(refreshUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: CREDENTIALS_MODE,
        });

        if (!res.ok) {
          return false;
        }

        const data = await res.json();
        return data?.success === true;
      } catch (err) {
        return false;
      } finally {
        refreshPromise = null;
      }
    })();
  }

  return refreshPromise;
};

// Module-level single-flight request deduplication map for GET requests
const inFlightFrontendRequests = new Map();

const request = async (endpoint, options = {}) => {
  const method = (options.method || "GET").toUpperCase();
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const url = `${BASE_URL}${cleanEndpoint}`;

  // Only deduplicate idempotent GET requests
  const dedupKey = method === "GET" && !options.skipDedup ? `${method}:${url}` : null;
  if (dedupKey && inFlightFrontendRequests.has(dedupKey)) {
    return inFlightFrontendRequests.get(dedupKey);
  }

  const executeRequest = async () => {
    const requestId = options.requestId || `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const headers = {
      "Content-Type": "application/json",
      "X-Request-ID": requestId,
      ...options.headers,
    };

    const config = {
      method: options.method || "GET",
      headers,
      credentials: CREDENTIALS_MODE,
      ...options,
    };

    if (options.body && typeof options.body === "object" && !(options.body instanceof FormData)) {
      config.body = JSON.stringify(options.body);
    }

    const response = await fetch(url, config);
    const contentType = response.headers.get("content-type");
    const rateLimit = parseRateLimitHeaders(response.headers);

    let result = null;
    if (contentType && contentType.includes("application/json")) {
      result = await response.json();
    } else {
      const text = await response.text();
      result = { message: text };
    }

    // Handle 401 Unauthorized & Attempt Automatic Token Refresh
    if (response.status === 401) {
      const isAuthEndpoint =
        cleanEndpoint.startsWith("/auth/login") ||
        cleanEndpoint.startsWith("/auth/signup") ||
        cleanEndpoint.startsWith("/auth/refresh");

      // If not an auth route and has not been retried yet, attempt single refresh
      if (!isAuthEndpoint && !options._retry) {
        const refreshSuccess = await executeTokenRefresh();

        if (refreshSuccess) {
          // Retry the original request ONCE with new HttpOnly cookies
          return request(endpoint, {
            ...options,
            _retry: true,
          });
        } else {
          // Refresh failed: dispatch event so AuthContext/Router can handle logout/redirection
          if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("vytalis:auth-expired"));
          }
        }
      }

      const errorMessage = result?.message || "Authentication required";
      const error = new Error(errorMessage);
      error.status = 401;
      error.errors = result?.errors || null;
      error.rateLimit = rateLimit;
      error.requestId = requestId;
      error.endpoint = cleanEndpoint;
      error.timestamp = new Date().toISOString();
      throw error;
    }

    if (!response.ok) {
      const errorMessage = result?.message || result?.error || `HTTP error! Status: ${response.status}`;
      const error = new Error(errorMessage);
      error.status = response.status;
      error.errors = result?.errors || null;
      error.rateLimit = rateLimit;
      error.requestId = requestId;
      error.endpoint = cleanEndpoint;
      error.timestamp = new Date().toISOString();
      throw error;
    }

    return {
      success: result?.success ?? true,
      message: result?.message || "",
      data: result?.data !== undefined ? result.data : result,
      meta: result?.meta || null,
      status: response.status,
      rateLimit: rateLimit,
      requestId: requestId,
      endpoint: cleanEndpoint,
    };
  };

  const promise = executeRequest().finally(() => {
    if (dedupKey) {
      inFlightFrontendRequests.delete(dedupKey);
    }
  });

  if (dedupKey) {
    inFlightFrontendRequests.set(dedupKey, promise);
  }

  return promise;
};

export const http = {
  get: (endpoint, options = {}) => request(endpoint, { ...options, method: "GET" }),
  post: (endpoint, body, options = {}) => request(endpoint, { ...options, method: "POST", body }),
  put: (endpoint, body, options = {}) => request(endpoint, { ...options, method: "PUT", body }),
  patch: (endpoint, body, options = {}) => request(endpoint, { ...options, method: "PATCH", body }),
  delete: (endpoint, options = {}) => request(endpoint, { ...options, method: "DELETE" }),
};
