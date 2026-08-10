/**
 * Verification test suite for Windsor Provider & Redis Cache Foundation.
 * Tests configuration purity, date normalization, TTL jitter, request building,
 * cache key determinism, service orchestration, and validator rules.
 */

const { META_ENDPOINTS, ALLOWED_META_ENDPOINTS } = require("../config/meta-endpoints.config");
const { calculateJitteredTtl } = require("../config/cache.config");
const { normalizeDateParams } = require("../utils/date-normalizer.util");
const { buildWindsorRequest, buildFacebookRequest } = require("../utils/request-builder.util");
const facebookAdapter = require("../adapters/facebook.adapter");
const metaAnalyticsService = require("../services/meta-analytics.service");
const { validateAnalyticsRequest } = require("../validators/meta-analytics.validator");

async function runVerificationTests() {
  console.log("==================================================");
  console.log("🧪 STARTING FOUNDATION VERIFICATION TEST SUITE");
  console.log("==================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition, testName) {
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName}`);
      failed++;
    }
  }

  // 1. Config Purity: meta-endpoints.config.js contains no Windsor fields
  const sampleEndpoint = META_ENDPOINTS.campaigns;
  assert(
    sampleEndpoint && sampleEndpoint.adapterMethod === "fetchCampaigns" && sampleEndpoint.fields === undefined,
    "1. meta-endpoints.config.js contains adapterMethod and baseTtl but NO Windsor field arrays"
  );

  // 2. Adapter Field Ownership: facebook.adapter.js has functions for all 6 endpoints
  assert(
    typeof facebookAdapter.fetchOverview === "function" &&
      typeof facebookAdapter.fetchCampaigns === "function" &&
      typeof facebookAdapter.fetchAdsets === "function" &&
      typeof facebookAdapter.fetchCreatives === "function" &&
      typeof facebookAdapter.fetchAudience === "function" &&
      typeof facebookAdapter.fetchPlaces === "function",
    "2. facebook.adapter.js exposes methods for all 6 analytics endpoints"
  );

  // 3. Service Purity: metaAnalyticsService has getAnalyticsData function
  assert(
    typeof metaAnalyticsService.getAnalyticsData === "function",
    "3. meta-analytics.service.js exposes getAnalyticsData orchestration method"
  );

  // 4. Date Normalization: presets & ISO date bounds
  const norm1 = normalizeDateParams({ datePreset: " last_7d " });
  assert(
    norm1.dateRangeKey === "last_7d",
    "4a. normalizeDateParams trims preset strings correctly ('last_7d')"
  );

  const norm2 = normalizeDateParams({ dateFrom: "2026-08-01", dateTo: "2026-08-08" });
  assert(
    norm2.dateRangeKey === "2026-08-01_2026-08-08",
    "4b. normalizeDateParams converts explicit dateFrom & dateTo to '2026-08-01_2026-08-08'"
  );

  // 5. TTL Jitter Verification (±10%)
  const baseTtl = 300;
  let jitterAllValid = true;
  for (let i = 0; i < 100; i++) {
    const jittered = calculateJitteredTtl(baseTtl);
    if (jittered < 270 || jittered > 330) {
      jitterAllValid = false;
      break;
    }
  }
  assert(
    jitterAllValid,
    "5. calculateJitteredTtl(300) correctly outputs random TTL values strictly between 270 and 330 seconds"
  );

  // 6. Request Builder Verification
  process.env.WINDSOR_API_KEY = "test_key_123";
  const url = buildFacebookRequest({
    fields: ["date", "spend"],
    filters: [["account_id", "eq", "359804707990884"]],
  });
  assert(
    url.includes("api_key=test_key_123") &&
      url.includes("fields=date%2Cspend") &&
      url.includes("filter=%5B%5B%22account_id%22%2C%22eq%22%2C%22359804707990884%22%5D%5D"),
    "6. request-builder.util.js generates properly encoded Windsor API URL"
  );

  // 7. Rejection of missing activeMetaAccount in Service
  let accountRejected = false;
  try {
    await metaAnalyticsService.getAnalyticsData({
      user: { _id: "user123", preferences: { activeMetaAccount: null } },
      endpoint: "overview",
    });
  } catch (err) {
    if (err.statusCode === 400 && err.message.includes("No active Meta account")) {
      accountRejected = true;
    }
  }
  assert(accountRejected, "7. Service rejects requests when user has no activeMetaAccount with HTTP 400");

  // 8. Rejection of unsupported endpoints in Service
  let endpointRejected = false;
  try {
    await metaAnalyticsService.getAnalyticsData({
      user: { _id: "user123", preferences: { activeMetaAccount: "act_101" } },
      endpoint: "unsupported_endpoint",
    });
  } catch (err) {
    if (err.statusCode === 400 && err.message.includes("Unsupported analytics endpoint")) {
      endpointRejected = true;
    }
  }
  assert(endpointRejected, "8. Service rejects unsupported endpoints with HTTP 400");

  // 9. Rejection of client-supplied accountId in Validator Middleware
  let validatorRejectedAccountId = false;
  const mockReq = {
    query: { accountId: "client_supplied_id" },
    params: { endpoint: "campaigns" },
  };
  const mockRes = {
    status: function (code) {
      if (code === 400) {
        return {
          json: function (body) {
            if (body.errors && body.errors[0].field === "accountId") {
              validatorRejectedAccountId = true;
            }
          },
        };
      }
      return this;
    },
  };
  validateAnalyticsRequest(mockReq, mockRes, () => {});
  assert(
    validatorRejectedAccountId,
    "9. Validator middleware rejects client-supplied accountId with HTTP 400 error payload"
  );

  // 10. Validator Pass on Valid Endpoint & Query
  let validatorPassed = false;
  const mockReqValid = {
    query: { datePreset: "last_7d" },
    params: { endpoint: "campaigns" },
  };
  validateAnalyticsRequest(mockReqValid, mockRes, () => {
    validatorPassed = true;
  });
  assert(
    validatorPassed,
    "10. Validator middleware passes valid analytics request to next()"
  );

  console.log("\n==================================================");
  console.log(`📊 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("==================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runVerificationTests();
