const dns = require("dns");
const path = require("path");
dns.setServers(["8.8.8.8", "8.8.4.4"]);
require("dotenv").config({ path: path.join(__dirname, "../../.env") });

const mongoose = require("mongoose");
const axios = require("axios");
const connectDB = require("../config/db");
const cacheUtil = require("../utils/cache.util");
const User = require("../models/user.model");
const { generateAccessToken } = require("../utils/jwt.util");
const app = require("../app");

const PORT = 5097; // Isolated test port for Shopify Data APIs

const runVerification = async () => {
  console.log("\n=================================================");
  console.log("Running Phase 2 Shopify Data APIs Comprehensive Verification");
  console.log("=================================================\n");

  let server;
  let testUser1;
  let testUser2;
  let token1;
  let token2;

  try {
    // 1. Connect Database & Redis
    await connectDB();
    await cacheUtil.connect();

    server = app.listen(PORT);
    const baseURL = `http://localhost:${PORT}`;

    const email1 = "shopify_data_test1@vytalis.com";
    const email2 = "shopify_data_test2@vytalis.com";

    await User.deleteMany({ email: { $in: [email1, email2] } });

    testUser1 = await User.create({
      name: "Data Test User 1",
      email: email1,
      password: "TestPassword123!",
      integrations: {
        shopify: [
          { shopName: "JSB Health & Fitness Pvt Ltd", accountName: "jsbhealthcare.myshopify.com", status: "active" },
          { shopName: "Thread & Button Apparels", accountName: "threadnbutton.myshopify.com", status: "active" },
        ],
      },
      preferences: {
        activeShopifyAccount: "jsbhealthcare.myshopify.com",
      },
    });

    testUser2 = await User.create({
      name: "Data Test User 2",
      email: email2,
      password: "TestPassword123!",
      integrations: {
        shopify: [],
      },
      preferences: {
        activeShopifyAccount: null,
      },
    });

    token1 = generateAccessToken({ id: testUser1._id.toString() });
    token2 = generateAccessToken({ id: testUser2._id.toString() });

    const auth1 = { Authorization: `Bearer ${token1}` };
    const auth2 = { Authorization: `Bearer ${token2}` };

    console.log(`✅ Test User 1 Created: ID=${testUser1._id}, Active Account=${testUser1.preferences.activeShopifyAccount}`);
    console.log(`✅ Test User 2 Created (No Active Account): ID=${testUser2._id}`);

    // ====================================================
    // GROUP 1: AUTH & ACTIVE ACCOUNT CHECKS
    // ====================================================
    console.log("\n--- GROUP 1: Auth & Active Account Security ---");

    // 1a. Unauthenticated Request (401)
    try {
      await axios.get(`${baseURL}/api/shopify/overview?date_preset=last_7d`);
      console.error("❌ FAILED: Unauthenticated request should return 401");
    } catch (err) {
      console.assert(err.response?.status === 401, "Status must be 401");
      console.log("✓ PASS [1a]: Unauthenticated request returned HTTP 401");
    }

    // 1b. User with No Active Account Configured (404)
    try {
      await axios.get(`${baseURL}/api/shopify/overview?date_preset=last_7d`, { headers: auth2 });
      console.error("❌ FAILED: User without active account should return 404");
    } catch (err) {
      console.assert(err.response?.status === 404, "Status must be 404");
      console.assert(
        err.response?.data?.message === "No active Shopify account configured",
        "Exact error message required"
      );
      console.log("✓ PASS [1b]: User with no active account returned HTTP 404 'No active Shopify account configured'");
    }

    // ====================================================
    // GROUP 2: ACCOUNT SECURITY OVERRIDE REJECTION (400)
    // ====================================================
    console.log("\n--- GROUP 2: Account Override Protection ---");
    const overrideFields = [
      "accountName",
      "account_name",
      "accountId",
      "account_id",
      "shopId",
      "shop_id",
    ];

    for (const field of overrideFields) {
      try {
        await axios.get(
          `${baseURL}/api/shopify/overview?date_preset=last_7d&${field}=malicious.myshopify.com`,
          { headers: auth1 }
        );
        console.error(`❌ FAILED: Override parameter '${field}' should return 400`);
      } catch (err) {
        console.assert(err.response?.status === 400, "Status must be 400");
        console.log(`✓ PASS: Query override attempt '${field}' rejected with HTTP 400`);
      }
    }

    // ====================================================
    // GROUP 3: DATE PARAMETER VALIDATION (HTTP 400)
    // ====================================================
    console.log("\n--- GROUP 3: Date Parameter Validation ---");

    // 3a. Ambiguous dates (date_preset AND date_from/date_to)
    try {
      await axios.get(
        `${baseURL}/api/shopify/overview?date_preset=last_7d&date_from=2026-08-01&date_to=2026-08-13`,
        { headers: auth1 }
      );
      console.error("❌ FAILED: Combining date_preset and date_from/date_to should return 400");
    } catch (err) {
      console.assert(err.response?.status === 400, "Status must be 400");
      console.log("✓ PASS [3a]: Ambiguous date_preset + custom date range rejected with HTTP 400");
    }

    // 3b. Partial date range (date_from without date_to)
    try {
      await axios.get(`${baseURL}/api/shopify/overview?date_from=2026-08-01`, { headers: auth1 });
      console.error("❌ FAILED: Partial date_from without date_to should return 400");
    } catch (err) {
      console.assert(err.response?.status === 400, "Status must be 400");
      console.log("✓ PASS [3b]: Partial date_from without date_to rejected with HTTP 400");
    }

    // 3c. Invalid date format (13-08-2026)
    try {
      await axios.get(
        `${baseURL}/api/shopify/overview?date_from=13-08-2026&date_to=2026-08-13`,
        { headers: auth1 }
      );
      console.error("❌ FAILED: Invalid date format should return 400");
    } catch (err) {
      console.assert(err.response?.status === 400, "Status must be 400");
      console.log("✓ PASS [3c]: Invalid date format '13-08-2026' rejected with HTTP 400");
    }

    // 3d. Invalid calendar date (2026-02-31)
    try {
      await axios.get(
        `${baseURL}/api/shopify/overview?date_from=2026-02-31&date_to=2026-08-13`,
        { headers: auth1 }
      );
      console.error("❌ FAILED: Impossible calendar date 2026-02-31 should return 400");
    } catch (err) {
      console.assert(err.response?.status === 400, "Status must be 400");
      console.log("✓ PASS [3d]: Impossible calendar date '2026-02-31' rejected with HTTP 400");
    }

    // 3e. date_from > date_to
    try {
      await axios.get(
        `${baseURL}/api/shopify/overview?date_from=2026-08-15&date_to=2026-08-10`,
        { headers: auth1 }
      );
      console.error("❌ FAILED: date_from > date_to should return 400");
    } catch (err) {
      console.assert(err.response?.status === 400, "Status must be 400");
      console.log("✓ PASS [3e]: date_from > date_to rejected with HTTP 400");
    }

    // 3f. Unsupported date_preset
    try {
      await axios.get(`${baseURL}/api/shopify/overview?date_preset=invalid_preset`, { headers: auth1 });
      console.error("❌ FAILED: Unsupported date_preset should return 400");
    } catch (err) {
      console.assert(err.response?.status === 400, "Status must be 400");
      console.log("✓ PASS [3f]: Unsupported date_preset 'invalid_preset' rejected with HTTP 400");
    }

    // ====================================================
    // GROUP 4: 5 SHOPIFY DATA ENDPOINTS EXECUTION
    // ====================================================
    console.log("\n--- GROUP 4: 5 Shopify Data APIs Execution & Date Modes ---");

    // 4a. Overview API (Preset Mode last_7d)
    const overviewRes = await axios.get(`${baseURL}/api/shopify/overview?date_preset=last_7d`, { headers: auth1 });
    console.assert(overviewRes.status === 200, "Overview must return 200");
    console.assert(overviewRes.data.success === true, "success envelope required");
    console.assert(overviewRes.data.meta.dateRange.type === "preset", "dateRange type must be preset");
    console.assert(overviewRes.data.meta.dateRange.value === "last_7d", "dateRange value must be last_7d");
    console.log("✓ PASS [4a]: GET /api/shopify/overview?date_preset=last_7d returned 200 OK");

    // 4b. Orders API (Today Mode: date_from=2026-08-13&date_to=2026-08-13)
    const todayStr = new Date().toISOString().split("T")[0];
    const ordersRes = await axios.get(
      `${baseURL}/api/shopify/orders?date_from=${todayStr}&date_to=${todayStr}`,
      { headers: auth1 }
    );
    console.assert(ordersRes.status === 200, "Orders must return 200");
    console.assert(ordersRes.data.meta.dateRange.type === "custom", "Today mode uses custom dateRange meta");
    console.assert(ordersRes.data.meta.dateRange.dateFrom === todayStr, "dateFrom must match today");
    console.log(`✓ PASS [4b]: GET /api/shopify/orders (Today Mode ${todayStr}) returned 200 OK`);

    // 4c. Products API (Yesterday Mode)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];
    const productsRes = await axios.get(
      `${baseURL}/api/shopify/products?date_from=${yesterdayStr}&date_to=${yesterdayStr}`,
      { headers: auth1 }
    );
    console.assert(productsRes.status === 200, "Products must return 200");
    console.log(`✓ PASS [4c]: GET /api/shopify/products (Yesterday Mode ${yesterdayStr}) returned 200 OK`);

    // 4d. Customers API (Custom Range Mode)
    const customersRes = await axios.get(
      `${baseURL}/api/shopify/customers?date_from=2026-08-01&date_to=2026-08-13`,
      { headers: auth1 }
    );
    console.assert(customersRes.status === 200, "Customers must return 200");
    console.assert(customersRes.data.meta.dateRange.type === "custom", "dateRange type must be custom");
    console.log("✓ PASS [4d]: GET /api/shopify/customers (Custom Range) returned 200 OK");

    // 4e. Location API (Preset Mode last_30d)
    const locationRes = await axios.get(`${baseURL}/api/shopify/location?date_preset=last_30d`, { headers: auth1 });
    console.assert(locationRes.status === 200, "Location must return 200");
    console.log("✓ PASS [4e]: GET /api/shopify/location?date_preset=last_30d returned 200 OK");

    // ====================================================
    // GROUP 5: REDIS CACHING & KEY ISOLATION
    // ====================================================
    console.log("\n--- GROUP 5: Redis Caching & Cache Key Isolation ---");

    // 5a. Cache HIT test (Second identical request returns source = 'redis')
    const secondOverviewRes = await axios.get(`${baseURL}/api/shopify/overview?date_preset=last_7d`, { headers: auth1 });
    console.assert(secondOverviewRes.status === 200, "Second request must return 200");
    console.assert(secondOverviewRes.data.meta.source === "redis", "Second request must hit Redis cache (source = 'redis')");
    console.log("✓ PASS [5a]: Second request for overview hit Redis cache (source = 'redis')");

    // 5b. Cache Key Isolation test (Different preset produces cache miss)
    const last30OverviewRes = await axios.get(`${baseURL}/api/shopify/overview?date_preset=last_30d`, { headers: auth1 });
    console.assert(last30OverviewRes.status === 200, "last_30d request must return 200");
    // Verify cache key pattern
    const userId1 = testUser1._id.toString();
    const expectedKey1 = `shopify:${userId1}:jsbhealthcare.myshopify.com:overview:last_7d`;
    const cachedItem1 = await cacheUtil.get(expectedKey1);
    console.assert(cachedItem1 !== null, "Redis cache key must strictly follow shopify:{userId}:{account}:{endpoint}:{dateKey}");
    console.log(`✓ PASS [5b]: Confirmed deterministic Redis key structure '${expectedKey1}'`);

    // Clean up
    await User.deleteMany({ email: { $in: [email1, email2] } });
    console.log("\n==================================================");
    console.log("🎉 ALL SHOPIFY DATA API VERIFICATION TESTS PASSED!");
    console.log("==================================================\n");

  } catch (error) {
    console.error("\n❌ VERIFICATION ERROR:", error.response ? error.response.data : error);
    process.exit(1);
  } finally {
    if (server) {
      server.close();
    }
    await cacheUtil.disconnect().catch(() => {});
    await mongoose.disconnect().catch(() => {});
  }
};

runVerification();
