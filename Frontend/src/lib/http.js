/**
 * HTTP Client abstraction for Vytalis Intelligence frontend.
 * Built using native browser fetch API.
 * 
 * - Reads VITE_API_BASE_URL environment variable.
 * - Automatically attaches Authorization: Bearer <accessToken> header when token exists.
 * - Parses JSON responses cleanly into { success, data, meta, message, status }.
 * - Never logs access tokens.
 */

import { getAccessToken } from "./storage.js";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

const request = async (endpoint, options = {}) => {
  const url = `${BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  const token = getAccessToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const config = {
    method: options.method || "GET",
    headers,
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
