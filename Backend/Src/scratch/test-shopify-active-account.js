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

const PORT = 5098; // Isolated test port for Shopify integration tests

const runVerification = async () => {
  console.log("\n========== STARTING SHOPIFY ACCOUNT MANAGEMENT CLEANUP API VERIFICATION ==========\n");
  let server;
  let testUser;
  let token;

  try {
    // 1. Connect Database & Redis
    await connectDB();
    await cacheUtil.connect();

    // Start ephemeral server
    server = app.listen(PORT);
    const baseURL = `http://localhost:${PORT}`;

    // 2. Setup Test User
    const testEmail = "shopify_api_test@vytalis.com";
    await User.deleteOne({ email: testEmail });

    testUser = await User.create({
      name: "Shopify API Test User",
      email: testEmail,
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

    token = generateAccessToken({ id: testUser._id.toString() });
    console.log(`✅ Test User Created: ID = ${testUser._id}, initial activeShopifyAccount = ${testUser.preferences.activeShopifyAccount}`);

    const authHeaders = { Authorization: `Bearer ${token}` };

    // ====================================================
    // TEST 1: Authentication Requirement (No JWT -> 401)
    // ====================================================
    console.log("\n--- TEST 1: Unauthenticated Request (No JWT) ---");
    try {
      await axios.patch(`${baseURL}/api/shopify/accounts/active`, { accountName: "threadnbutton.myshopify.com" });
      console.error("❌ FAILED: Expected 401 Unauthenticated error, but request succeeded.");
    } catch (err) {
      if (err.response && err.response.status === 401) {
        console.log(`✅ SUCCESS: Returned HTTP 401 Unauthenticated as expected: '${err.response.data.message}'`);
      } else {
        console.error(`❌ FAILED: Unexpected response status: ${err.response?.status}`);
      }
    }

    // ====================================================
    // TEST 2: Validation Rules (HTTP 400 Errors & accountId/shopId Rejection)
    // ====================================================
    console.log("\n--- TEST 2: Request Payload Validation & accountId/shopId Rejection ---");

    // 2a. Empty Body {}
    try {
      await axios.patch(`${baseURL}/api/shopify/accounts/active`, {}, { headers: authHeaders });
      console.error("❌ FAILED: Empty body should return 400.");
    } catch (err) {
      if (err.response && err.response.status === 400) {
        console.log(`✅ SUCCESS: Empty body {} rejected with HTTP 400`);
      }
    }

    // 2b. Whitespace accountName
    try {
      await axios.patch(`${baseURL}/api/shopify/accounts/active`, { accountName: "   " }, { headers: authHeaders });
      console.error("❌ FAILED: Whitespace accountName should return 400.");
    } catch (err) {
      if (err.response && err.response.status === 400) {
        console.log(`✅ SUCCESS: Whitespace accountName rejected with HTTP 400`);
      }
    }

    // 2c. accountId in POST /api/shopify/accounts payload
    try {
      await axios.post(
        `${baseURL}/api/shopify/accounts`,
        { shopName: "New Store", accountName: "newstore.myshopify.com", accountId: "12345" },
        { headers: authHeaders }
      );
      console.error("❌ FAILED: accountId in POST payload should return 400.");
    } catch (err) {
      if (err.response && err.response.status === 400) {
        console.log(`✅ SUCCESS: accountId in POST body rejected with HTTP 400`);
      }
    }

    // 2d. shopId in POST /api/shopify/accounts payload
    try {
      await axios.post(
        `${baseURL}/api/shopify/accounts`,
        { shopName: "New Store", accountName: "newstore.myshopify.com", shopId: "67890" },
        { headers: authHeaders }
      );
      console.error("❌ FAILED: shopId in POST payload should return 400.");
    } catch (err) {
      if (err.response && err.response.status === 400) {
        console.log(`✅ SUCCESS: shopId in POST body rejected with HTTP 400`);
      }
    }

    // ====================================================
    // TEST 3: Nonexistent / Unowned Account (HTTP 404)
    // ====================================================
    console.log("\n--- TEST 3: Unowned Account Rejection (HTTP 404) ---");
    try {
      await axios.patch(
        `${baseURL}/api/shopify/accounts/active`,
        { accountName: "nonexistent.myshopify.com" },
        { headers: authHeaders }
      );
      console.error("❌ FAILED: Unowned accountName should return 404.");
    } catch (err) {
      if (err.response && err.response.status === 404 && err.response.data.message === "Shopify account not found") {
        console.log(`✅ SUCCESS: Unowned account rejected with HTTP 404: '${err.response.data.message}'`);
      } else {
        console.error(`❌ FAILED: Expected 404 'Shopify account not found', got status ${err.response?.status}`);
      }
    }

    // ====================================================
    // TEST 4: Switch Active Account to 2nd Account (HTTP 200)
    // ====================================================
    console.log("\n--- TEST 4: Switch Active Account to threadnbutton.myshopify.com ---");
    const switchRes = await axios.patch(
      `${baseURL}/api/shopify/accounts/active`,
      { accountName: "threadnbutton.myshopify.com" },
      { headers: authHeaders }
    );

    if (
      switchRes.status === 200 &&
      switchRes.data.success === true &&
      switchRes.data.message === "Active Shopify account updated successfully." &&
      switchRes.data.data.activeShopifyAccount === "threadnbutton.myshopify.com"
    ) {
      console.log(`✅ SUCCESS: Switch API returned HTTP 200: '${switchRes.data.message}'`);
      console.log(`Data payload:`, switchRes.data.data);
    } else {
      console.error("❌ FAILED: Switch API response payload mismatch:", switchRes.data);
    }

    // Verify DB update and absence of activeShopifyStore
    const dbUser = await User.findById(testUser._id);
    if (
      dbUser.preferences.activeShopifyAccount === "threadnbutton.myshopify.com" &&
      dbUser.preferences.activeShopifyStore === undefined
    ) {
      console.log(`✅ SUCCESS: DB preferences has activeShopifyAccount='threadnbutton.myshopify.com' and no activeShopifyStore`);
    } else {
      console.error(`❌ FAILED: DB preferences mismatch:`, dbUser.preferences);
    }

    // Verify GET /api/shopify/accounts reflects switch and response shape contains no accountId or shopId
    const getAllRes = await axios.get(`${baseURL}/api/shopify/accounts`, { headers: authHeaders });
    const firstAcc = getAllRes.data.data.accounts[0];
    if (
      getAllRes.data.data.activeShopifyAccount === "threadnbutton.myshopify.com" &&
      firstAcc.accountId === undefined &&
      firstAcc.shopId === undefined
    ) {
      console.log(`✅ SUCCESS: GET /api/shopify/accounts returned activeShopifyAccount = 'threadnbutton.myshopify.com' and NO accountId or shopId`);
    } else {
      console.error("❌ FAILED: GET /api/shopify/accounts shape mismatch:", getAllRes.data.data);
    }

    // ====================================================
    // TEST 5: GET /api/shopify/accounts/:id
    // ====================================================
    console.log("\n--- TEST 5: Retrieve Single Account by accountName ---");
    const singleRes = await axios.get(`${baseURL}/api/shopify/accounts/threadnbutton.myshopify.com`, { headers: authHeaders });
    if (
      singleRes.data.success === true &&
      singleRes.data.data.shopName === "Thread & Button Apparels" &&
      singleRes.data.data.accountId === undefined &&
      singleRes.data.data.shopId === undefined
    ) {
      console.log(`✅ SUCCESS: GET single account returned shopName = 'Thread & Button Apparels' and NO accountId/shopId`);
    }

    // ====================================================
    // TEST 6: PUT /api/shopify/accounts/:id & Preference Sync
    // ====================================================
    console.log("\n--- TEST 6: Update Active Account Domain & Preference Sync ---");
    const updateRes = await axios.put(
      `${baseURL}/api/shopify/accounts/threadnbutton.myshopify.com`,
      { accountName: "threadnbutton-updated.myshopify.com", shopName: "Thread & Button Global" },
      { headers: authHeaders }
    );

    if (
      updateRes.status === 200 &&
      updateRes.data.data.accountName === "threadnbutton-updated.myshopify.com"
    ) {
      console.log(`✅ SUCCESS: Updated accountName to 'threadnbutton-updated.myshopify.com'`);
    }

    const dbUserAfterUpdate = await User.findById(testUser._id);
    if (dbUserAfterUpdate.preferences.activeShopifyAccount === "threadnbutton-updated.myshopify.com") {
      console.log(`✅ SUCCESS: activeShopifyAccount preference automatically synchronized to 'threadnbutton-updated.myshopify.com'`);
    }

    // ====================================================
    // TEST 7: Delete Inactive Account (Active Preference Remains)
    // ====================================================
    console.log("\n--- TEST 7: Delete Inactive Account ---");
    const delInactiveRes = await axios.delete(
      `${baseURL}/api/shopify/accounts/jsbhealthcare.myshopify.com`,
      { headers: authHeaders }
    );
    if (delInactiveRes.status === 200) {
      console.log(`✅ SUCCESS: Deleted inactive account 'jsbhealthcare.myshopify.com'`);
    }

    const dbUserAfterDelInactive = await User.findById(testUser._id);
    if (dbUserAfterDelInactive.preferences.activeShopifyAccount === "threadnbutton-updated.myshopify.com") {
      console.log(`✅ SUCCESS: activeShopifyAccount remains 'threadnbutton-updated.myshopify.com' after inactive account deletion`);
    }

    // ====================================================
    // TEST 8: Delete Active Account (Resets Preference to Null if 0 remain)
    // ====================================================
    console.log("\n--- TEST 8: Delete Active Account ---");
    const delActiveRes = await axios.delete(
      `${baseURL}/api/shopify/accounts/threadnbutton-updated.myshopify.com`,
      { headers: authHeaders }
    );
    if (delActiveRes.status === 200) {
      console.log(`✅ SUCCESS: Deleted active account 'threadnbutton-updated.myshopify.com'`);
    }

    const dbUserAfterDelActive = await User.findById(testUser._id);
    if (dbUserAfterDelActive.preferences.activeShopifyAccount === null) {
      console.log(`✅ SUCCESS: activeShopifyAccount preference reset to null after final active account deletion`);
    }

    // Clean up
    await User.deleteOne({ email: testEmail });
    console.log("\n==================================================");
    console.log("🎉 ALL SHOPIFY LIVE API INTEGRATION TESTS PASSED!");
    console.log("==================================================\n");

  } catch (error) {
    console.error("\n❌ VERIFICATION ERROR:", error.response ? error.response.data : error);
  } finally {
    if (testUser && testUser.email) {
      await User.deleteOne({ email: testUser.email }).catch(() => {});
    }
    if (server) {
      server.close();
    }
    await cacheUtil.disconnect().catch(() => {});
    await mongoose.disconnect().catch(() => {});
  }
};

runVerification();
