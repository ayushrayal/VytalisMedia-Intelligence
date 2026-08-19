const axios = require("axios");

const baseURL = "http://localhost:5000";

async function runTest() {
  console.log("=== ATTRIBUTION ACCESS SYSTEM BACKEND VERIFICATION ===");

  try {
    // 1. Create a unique test user
    const testEmail = `test_attr_${Date.now()}@vytalis.com`;
    const signupRes = await axios.post(`${baseURL}/api/auth/signup`, {
      name: "Attribution Test User",
      email: testEmail,
      password: "TestPassword123!",
      accessCode: "vytalis@2026",
    });

    const cookieHeader = signupRes.headers["set-cookie"];
    const user = signupRes.data.data.user;

    console.log("✓ Test User Created:", {
      id: user.id || user._id,
      email: user.email,
      attributionEnabled: user.attributionEnabled,
    });

    if (user.attributionEnabled !== false) {
      throw new Error("FAIL: attributionEnabled should default to false!");
    }
    console.log("✓ PASS 1: attributionEnabled defaults to false");

    // 2. Attempt calling GET /api/attribution/overview without unlock
    try {
      await axios.get(`${baseURL}/api/attribution/overview`, {
        headers: { Cookie: cookieHeader },
      });
      throw new Error("FAIL: Expected 403 error when attributionEnabled is false!");
    } catch (err) {
      if (err.response && err.response.status === 403) {
        console.log("✓ PASS 2: GET /api/attribution/overview correctly blocked with HTTP 403 Forbidden");
      } else {
        throw err;
      }
    }

    // 3. Attempt unlock with invalid key
    try {
      await axios.post(
        `${baseURL}/api/profile/attribution/enable`,
        { accessKey: "WrongKey123" },
        { headers: { Cookie: cookieHeader } }
      );
      throw new Error("FAIL: Expected 401 error for invalid access key!");
    } catch (err) {
      if (err.response && (err.response.status === 401 || err.response.status === 403)) {
        console.log("✓ PASS 3: Unlock with invalid key correctly returned HTTP 401/403");
      } else {
        throw err;
      }
    }

    // 4. Unlock with valid key: VytalisAttribution@2026
    const unlockRes = await axios.post(
      `${baseURL}/api/profile/attribution/enable`,
      { accessKey: "VytalisAttribution@2026" },
      { headers: { Cookie: cookieHeader } }
    );

    if (unlockRes.data.data.attributionEnabled !== true) {
      throw new Error("FAIL: attributionEnabled was not set to true after unlock!");
    }
    console.log("✓ PASS 4: Unlock with valid key succeeded, attributionEnabled = true");

    // 5. Verify /api/auth/me now returns attributionEnabled: true
    const meRes = await axios.get(`${baseURL}/api/auth/me`, {
      headers: { Cookie: cookieHeader },
    });
    if (meRes.data.data.user.attributionEnabled !== true) {
      throw new Error("FAIL: GET /api/auth/me did not reflect attributionEnabled: true");
    }
    console.log("✓ PASS 5: GET /api/auth/me reflects attributionEnabled: true");

    console.log("\nALL BACKEND VERIFICATION TESTS PASSED SUCCESSFULLY! 🎉");
  } catch (err) {
    console.error("❌ TEST FAILED:", err.response?.data || err.message);
    process.exit(1);
  }
}

runTest();
