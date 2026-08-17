/**
 * HTTP Client abstraction for Vytalis Intelligence frontend.
 * Built using native browser fetch API with HttpOnly cookie support and automatic token refresh.
 * 
 * - Credentials mode: 'same-origin' (or 'include') so cookies are automatically transmitted.
 * - Single-flight refresh lock prevents multiple simultaneous refresh calls on concurrent 401s.
 * - Automatically retries failed requests ONCE following a successful token refresh.
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";
const CREDENTIALS_MODE = import.meta.env.VITE_API_CREDENTIALS || "same-origin";

// Module-level single-flight refresh lock promise
let refreshPromise = null;

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

const request = async (endpoint, options = {}) => {
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const url = `${BASE_URL}${cleanEndpoint}`;

  const headers = {
    "Content-Type": "application/json",
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

  try {
    const response = await fetch(url, config);
    const contentType = response.headers.get("content-type");

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
      throw error;
    }

    if (!response.ok) {
      const errorMessage = result?.message || result?.error || `HTTP error! Status: ${response.status}`;
      const error = new Error(errorMessage);
      error.status = response.status;
      error.errors = result?.errors || null;
      throw error;
    }

    return {
      success: result?.success ?? true,
      message: result?.message || "",
      data: result?.data !== undefined ? result.data : result,
      meta: result?.meta || null,
      status: response.status,
    };
  } catch (error) {
    if (!error.status) {
      error.status = 500;
    }
    throw error;
  }
};

export const http = {
  get: (endpoint, options = {}) => request(endpoint, { ...options, method: "GET" }),
  post: (endpoint, body, options = {}) => request(endpoint, { ...options, method: "POST", body }),
  patch: (endpoint, body, options = {}) => request(endpoint, { ...options, method: "PATCH", body }),
  delete: (endpoint, options = {}) => request(endpoint, { ...options, method: "DELETE" }),
};
