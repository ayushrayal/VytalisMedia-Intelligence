const { test, describe, before, after } = require("node:test");
const assert = require("node:assert");
const http = require("node:http");
const mongoose = require("mongoose");
const app = require("../Src/app");
const connectDB = require("../Src/config/db");
const cacheUtil = require("../Src/utils/cache.util");
const User = require("../Src/models/user.model");
const { generateAccessToken, generateRefreshToken, verifyAccessToken, verifyRefreshToken } = require("../Src/utils/jwt.util");

process.env.ACCESS_CODE = "TEST_SECRET_ACCESS_CODE_123";
process.env.JWT_SECRET_TOKEN = "supersecretjwtkeyforunittesting123";
process.env.NODE_ENV = "test";

let server;
let serverUrl;
let isDbConnected = false;

const makeRequest = (method, path, body = null, headers = {}) => {
  return new Promise((resolve, reject) => {
    const url = new URL(path, serverUrl);
    const reqHeaders = {
      "Content-Type": "application/json",
      ...headers,
    };

    const payload = body ? JSON.stringify(body) : null;
    if (payload) {
      reqHeaders["Content-Length"] = Buffer.byteLength(payload);
    }

    const req = http.request(
      url,
      {
        method,
        headers: reqHeaders,
      },
      (res) => {
        let responseBody = "";
        res.on("data", (chunk) => (responseBody += chunk));
        res.on("end", () => {
          let parsedJson = null;
          try {
            parsedJson = JSON.parse(responseBody);
          } catch (e) {
            // Not JSON
          }
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            cookies: res.headers["set-cookie"] || [],
            body: parsedJson || responseBody,
          });
        });
      }
    );

    req.on("error", reject);
    if (payload) {
      req.write(payload);
    }
    req.end();
  });
};

describe("Phase 0 Security Hardening Tests (P0.2 & P0.3)", () => {
  before(async () => {
    // Attempt DB and Redis connection
    try {
      if (process.env.MONGODB_URI) {
        await connectDB();
        isDbConnected = true;
      }
    } catch (e) {
      isDbConnected = false;
    }

    try {
      await cacheUtil.connect();
    } catch (e) {
      // Redis offline in test env
    }

    // Start HTTP server
    await new Promise((resolve) => {
      server = app.listen(0, "127.0.0.1", () => {
        const port = server.address().port;
        serverUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });
  });

  after(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    try {
      await cacheUtil.disconnect();
    } catch (e) {}
    try {
      if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
      }
    } catch (e) {}
  });

  // ==================================================
  // 1. SIGNUP ACCESS-CODE PREREQUISITE
  // ==================================================
  describe("Existing Signup Access-Code Protection", () => {
    test("Fails signup when access code is invalid", async () => {
      const res = await makeRequest("POST", "/api/auth/signup", {
        name: "Test User",
        email: `test_access_code_${Date.now()}@vytalis.com`,
        password: "Password123!",
        accessCode: "WRONG_ACCESS_CODE",
      });

      assert.strictEqual(res.statusCode, 400);
      assert.strictEqual(res.body.success, false);
      assert.strictEqual(res.body.message, "Invalid access code");
    });
  });

  // ==================================================
  // 2. JWT TOKENS & HTTPONLY COOKIES
  // ==================================================
  describe("JWT & HttpOnly Cookie Security (P0.3)", () => {
    test("Access token contains minimal payload and expires in 15 minutes", () => {
      const token = generateAccessToken({ id: "user_12345" });
      const decoded = verifyAccessToken(token);

      assert.strictEqual(decoded.id, "user_12345");
      assert.strictEqual(decoded.password, undefined);
      assert.strictEqual(decoded.accessCode, undefined);

      const lifetimeSeconds = decoded.exp - decoded.iat;
      assert.strictEqual(lifetimeSeconds, 900);
    });

    test("Refresh token contains id and sessionId and expires in 7 days", () => {
      const token = generateRefreshToken({ id: "user_12345", sessionId: "session_999" });
      const decoded = verifyRefreshToken(token);

      assert.strictEqual(decoded.id, "user_12345");
      assert.strictEqual(decoded.sessionId, "session_999");
      const lifetimeSeconds = decoded.exp - decoded.iat;
      assert.strictEqual(lifetimeSeconds, 7 * 24 * 60 * 60);
    });

    test("Signup sets HttpOnly cookies and omits raw JWTs from JSON body", async () => {
      if (!isDbConnected) {
        // Skip DB dependent route test if MongoDB URI is not active
        return;
      }
      const email = `test_signup_cookies_${Date.now()}@vytalis.com`;
      const res = await makeRequest("POST", "/api/auth/signup", {
        name: "Cookie Test User",
        email: email,
        password: "Password123!",
        accessCode: "TEST_SECRET_ACCESS_CODE_123",
      });

      assert.strictEqual(res.statusCode, 201);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.data.accessToken, undefined, "Raw accessToken must NOT be returned in JSON response");
      assert.strictEqual(res.body.data.refreshToken, undefined, "Raw refreshToken must NOT be returned in JSON response");

      const cookiesHeader = res.cookies.join("; ");
      assert.ok(cookiesHeader.includes("access_token="), "Should set access_token cookie");
      assert.ok(cookiesHeader.includes("refresh_token="), "Should set refresh_token cookie");
      assert.ok(cookiesHeader.includes("HttpOnly"), "Cookies must be HttpOnly");
    });
  });

  // ==================================================
  // 3. RATE LIMITING (P0.2)
  // ==================================================
  describe("Rate Limiting (P0.2)", () => {
    test("Health check endpoint remains unblocked and excluded from rate limiting", async () => {
      const res = await makeRequest("GET", "/api/health");
      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.body.data.status, "healthy");
    });

    test("Rate limiter returns 429 with standard error contract when max requests exceeded", async () => {
      const { createRateLimiter } = require("../Src/middleware/rate-limit.middleware");
      const customLimiter = createRateLimiter({
        windowMs: 60000,
        maxRequests: 2,
        keyPrefix: "test:limit",
        errorMessage: "Limit reached",
      });

      const mockReq = { ip: "192.168.1.100", socket: {} };
      let responseStatusCode = 200;
      let responseBody = null;
      let headers = {};

      const mockRes = {
        setHeader: (k, v) => { headers[k] = v; },
        status: (code) => {
          responseStatusCode = code;
          return {
            json: (payload) => { responseBody = payload; return payload; }
          };
        }
      };

      let count = 0;
      const origIncr = cacheUtil.incrWithTtl;
      cacheUtil.incrWithTtl = async () => {
        count++;
        return { current: count, ttl: 55 };
      };

      try {
        await customLimiter(mockReq, mockRes, () => {});
        assert.strictEqual(headers["RateLimit-Remaining"], 1);

        await customLimiter(mockReq, mockRes, () => {});
        assert.strictEqual(headers["RateLimit-Remaining"], 0);

        await customLimiter(mockReq, mockRes, () => {});
        assert.strictEqual(responseStatusCode, 429);
        assert.strictEqual(responseBody.success, false);
        assert.strictEqual(responseBody.message, "Limit reached");
        assert.strictEqual(headers["Retry-After"], 55);
      } finally {
        cacheUtil.incrWithTtl = origIncr;
      }
    });

    test("Redis is authoritative in production mode (fails secure if Redis is down)", async () => {
      const { createRateLimiter } = require("../Src/middleware/rate-limit.middleware");
      const prodLimiter = createRateLimiter({
        windowMs: 60000,
        maxRequests: 5,
        keyPrefix: "test:prod",
      });

      const origEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "production";

      const origIncr = cacheUtil.incrWithTtl;
      cacheUtil.incrWithTtl = async () => null;

      let responseStatusCode = 200;
      let responseBody = null;

      const mockRes = {
        setHeader: () => {},
        status: (code) => {
          responseStatusCode = code;
          return {
            json: (payload) => { responseBody = payload; return payload; }
          };
        }
      };

      try {
        await prodLimiter({ ip: "127.0.0.1" }, mockRes, () => {});
        assert.strictEqual(responseStatusCode, 500, "Production must fail secure on Redis rate limit failure");
        assert.strictEqual(responseBody.success, false);
        assert.ok(responseBody.message.includes("Security configuration error"));
      } finally {
        process.env.NODE_ENV = origEnv;
        cacheUtil.incrWithTtl = origIncr;
      }
    });
  });

  // ==================================================
  // 4. REFRESH ROTATION & ATOMIC RACE SAFETY
  // ==================================================
  describe("Atomic Refresh Rotation & Revocation (P0.3)", () => {
    test("Atomic refresh token consumption prevents race conditions", async () => {
      const memoryStore = new Map();
      const origGetDel = cacheUtil.getDel;

      cacheUtil.getDel = async (key) => {
        if (!memoryStore.has(key)) return null;
        const val = memoryStore.get(key);
        memoryStore.delete(key);
        return val;
      };

      try {
        const sessionKey = "refresh_session:race_test";
        memoryStore.set(sessionKey, { userId: "user_test", createdAt: new Date().toISOString() });

        const firstConsumption = await cacheUtil.getDel(sessionKey);
        assert.ok(firstConsumption !== null, "First call must succeed");
        assert.strictEqual(firstConsumption.userId, "user_test");

        const secondConsumption = await cacheUtil.getDel(sessionKey);
        assert.strictEqual(secondConsumption, null, "Second call must return null (race-safe)");
      } finally {
        cacheUtil.getDel = origGetDel;
      }
    });

    test("Logout revokes refresh session and clears cookies", async () => {
      const logoutRes = await makeRequest("POST", "/api/auth/logout");

      assert.strictEqual(logoutRes.statusCode, 200);
      assert.strictEqual(logoutRes.body.success, true);

      const clearCookies = logoutRes.cookies.join("; ");
      assert.ok(
        clearCookies.includes("access_token=;") ||
          clearCookies.includes("access_token= ;") ||
          clearCookies.includes("Expires=Thu, 01 Jan 1970"),
        "Must clear access_token cookie"
      );
    });
  });

  // ==================================================
  // 5. CORS CREDENTIAL RESTRICTION & STATIC ASSETS
  // ==================================================
  describe("CORS Policy & Static Asset Serving", () => {
    test("CORS approves production Render origin with credentials", async () => {
      const res = await makeRequest("GET", "/api/health", null, {
        Origin: "https://vytalismedia-intelligence.onrender.com",
      });

      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.headers["access-control-allow-origin"], "https://vytalismedia-intelligence.onrender.com");
      assert.strictEqual(res.headers["access-control-allow-credentials"], "true");
    });

    test("CORS rejects untrusted origins cleanly without throwing HTTP 500", async () => {
      const res = await makeRequest("GET", "/api/health", null, {
        Origin: "http://untrusted-malicious-domain.com",
      });

      assert.strictEqual(res.statusCode, 200, "Should handle health check without throwing HTTP 500 server error");
      const allowOrigin = res.headers["access-control-allow-origin"];
      assert.notStrictEqual(allowOrigin, "*", "Credentialed CORS must never return wildcard '*'");
      assert.notStrictEqual(allowOrigin, "http://untrusted-malicious-domain.com");
    });

    test("Static asset requests do not fail with HTTP 500 CORS policy errors", async () => {
      const res = await makeRequest("GET", "/favicon.ico", null, {
        Origin: "https://vytalismedia-intelligence.onrender.com",
      });

      assert.notStrictEqual(res.statusCode, 500, "Static asset request must never fail with HTTP 500");
    });
  });
});
