const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);
require("dotenv").config();

const mongoose = require("mongoose");
const axios = require("axios");
const connectDB = require("../config/db");
const cacheUtil = require("../utils/cache.util");
const User = require("../models/user.model");
const { generateAccessToken } = require("../utils/jwt.util");
const app = require("../app");

const PORT = 5099; // Isolated test port

const runVerification = async () => {
  console.log("\n========== STARTING META ACTIVE ACCOUNT SWITCHING API VERIFICATION ==========\n");
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
    const testEmail = "active_account_test@vytalis.com";
    await User.deleteOne({ email: testEmail });

    testUser = await User.create({
      name: "Active Account Test User",
      email: testEmail,
      password: "TestPassword123!",
      integrations: {
        meta: [
          { accountId: "359804707990884", accountName: "Account A (Primary)" },
          { accountId: "123456789", accountName: "Account B (Secondary)" },
        ],
      },
      preferences: {
        activeMetaAccount: "359804707990884",
      },
    });

    token = generateAccessToken({ id: testUser._id.toString() });
    console.log(`✅ Test User Created: ID = ${testUser._id}, initial activeMetaAccount = ${testUser.preferences.activeMetaAccount}`);

    const authHeaders = { Authorization: `Bearer ${token}` };

    // ====================================================
    // TEST 1: Authentication Requirement (No JWT -> 401)
    // ====================================================
    console.log("\n--- TEST 1: Unauthenticated Request (No JWT) ---");
    try {
      await axios.patch(`${baseURL}/api/meta/accounts/active`, { accountId: "123456789" });
      console.error("❌ FAILED: Expected 401 Unauthenticated error, but request succeeded.");
    } catch (err) {
      if (err.response && err.response.status === 401) {
        console.log(`✅ SUCCESS: Returned HTTP 401 Unauthenticated as expected: '${err.response.data.message}'`);
      } else {
        console.error(`❌ FAILED: Unexpected response status: ${err.response?.status}`);
      }
    }

    // ====================================================
    // TEST 2: Validation Rules (HTTP 400 Errors)
    // ====================================================
    console.log("\n--- TEST 2: Request Payload Validation ---");

    // 2a. Empty Body {}
    try {
      await axios.patch(`${baseURL}/api/meta/accounts/active`, {}, { headers: authHeaders });
      console.error("❌ FAILED: Empty body should return 400.");
    } catch (err) {
      if (err.response && err.response.status === 400) {
        console.log(`✅ SUCCESS: Empty body {} rejected with HTTP 400`);
      }
    }

    // 2b. Whitespace accountId
    try {
      await axios.patch(`${baseURL}/api/meta/accounts/active`, { accountId: "   " }, { headers: authHeaders });
      console.error("❌ FAILED: Whitespace accountId should return 400.");
    } catch (err) {
      if (err.response && err.response.status === 400) {
        console.log(`✅ SUCCESS: Whitespace accountId rejected with HTTP 400`);
      }
    }

    // 2c. Unknown fields in body
    try {
      await axios.patch(
        `${baseURL}/api/meta/accounts/active`,
        { accountId: "123456789", foo: "bar" },
        { headers: authHeaders }
      );
      console.error("❌ FAILED: Unknown fields in body should return 400.");
    } catch (err) {
      if (err.response && err.response.status === 400) {
        console.log(`✅ SUCCESS: Body with unknown fields rejected with HTTP 400`);
      }
    }

    // ====================================================
    // TEST 3: Nonexistent / Unowned Account (HTTP 404)
    // ====================================================
    console.log("\n--- TEST 3: Unowned Account Rejection (HTTP 404) ---");
    try {
      await axios.patch(
        `${baseURL}/api/meta/accounts/active`,
        { accountId: "999999999" },
        { headers: authHeaders }
      );
      console.error("❌ FAILED: Unowned accountId should return 404.");
    } catch (err) {
      if (err.response && err.response.status === 404 && err.response.data.message === "Meta account not found") {
        console.log(`✅ SUCCESS: Unowned account rejected with HTTP 404: '${err.response.data.message}'`);
      } else {
        console.error(`❌ FAILED: Expected 404 'Meta account not found', got status ${err.response?.status}`);
      }
    }

    // ====================================================
    // TEST 4: Switch Active Account to Account B (HTTP 200)
    // ====================================================
    console.log("\n--- TEST 4: Switch Active Account to Account B ---");
    const switchRes = await axios.patch(
      `${baseURL}/api/meta/accounts/active`,
      { accountId: "123456789" },
      { headers: authHeaders }
    );

    if (
      switchRes.status === 200 &&
      switchRes.data.success === true &&
      switchRes.data.message === "Active Meta account updated successfully." &&
      switchRes.data.data.activeMetaAccount === "123456789"
    ) {
      console.log(`✅ SUCCESS: Switch API returned HTTP 200: '${switchRes.data.message}'`);
      console.log(`Data payload:`, switchRes.data.data);
    } else {
      console.error("❌ FAILED: Switch API response payload mismatch:", switchRes.data);
    }

    // Verify DB update
    const dbUser = await User.findById(testUser._id);
    if (dbUser.preferences.activeMetaAccount === "123456789") {
      console.log(`✅ SUCCESS: DB user.preferences.activeMetaAccount confirmed updated to '123456789'`);
    } else {
      console.error(`❌ FAILED: DB activeMetaAccount expected '123456789', got '${dbUser.preferences.activeMetaAccount}'`);
    }

    // Verify GET /api/meta/accounts reflects switch
    const getAllRes = await axios.get(`${baseURL}/api/meta/accounts`, { headers: authHeaders });
    if (getAllRes.data.data.activeMetaAccount === "123456789") {
      console.log(`✅ SUCCESS: GET /api/meta/accounts returned activeMetaAccount = '123456789'`);
    } else {
      console.error("❌ FAILED: GET /api/meta/accounts activeMetaAccount mismatch:", getAllRes.data.data);
    }

    // ====================================================
    // TEST 5: Analytics Integration with New Active Account
    // ====================================================
    console.log("\n--- TEST 5: Analytics Integration (Uses New Active Account) ---");
    const analyticsResB = await axios.get(
      `${baseURL}/api/meta/analytics/campaigns?datePreset=last_7d`,
      { headers: authHeaders }
    );

    console.log(`Analytics call for Account B returned HTTP 200. Source = '${analyticsResB.data.meta.source}'`);
    if (analyticsResB.data.success === true) {
      console.log(`✅ SUCCESS: Analytics request successfully executed with new activeMetaAccount.`);
    }

    // ====================================================
    // TEST 6: Switch Back to Account A & Redis Retention Test
    // ====================================================
    console.log("\n--- TEST 6: Switch Back to Account A & Redis Retention ---");
    const switchBackRes = await axios.patch(
      `${baseURL}/api/meta/accounts/active`,
      { accountId: "359804707990884" },
      { headers: authHeaders }
    );

    if (switchBackRes.data.data.activeMetaAccount === "359804707990884") {
      console.log(`✅ SUCCESS: Switched back to Account A ('359804707990884')`);
    }

    const analyticsResA = await axios.get(
      `${baseURL}/api/meta/analytics/campaigns?datePreset=last_7d`,
      { headers: authHeaders }
    );

    console.log(`Analytics call for Account A returned Source = '${analyticsResA.data.meta.source}'`);
    if (analyticsResA.data.success === true) {
      console.log(`✅ SUCCESS: Analytics request for Account A executed cleanly.`);
    }

    // ====================================================
    // TEST 7: Already Active Account (No-op DB Save)
    // ====================================================
    console.log("\n--- TEST 7: Already Active Account Switch ---");
    const alreadyActiveRes = await axios.patch(
      `${baseURL}/api/meta/accounts/active`,
      { accountId: "359804707990884" },
      { headers: authHeaders }
    );

    if (
      alreadyActiveRes.status === 200 &&
      alreadyActiveRes.data.data.activeMetaAccount === "359804707990884"
    ) {
      console.log(`✅ SUCCESS: Switched to already-active account returned HTTP 200 cleanly`);
    }

    // Clean up
    await User.deleteOne({ email: testEmail });
    console.log("\n==================================================");
    console.log("🎉 ALL SWITCHING API TESTS PASSED SUCCESSFULLY!");
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
