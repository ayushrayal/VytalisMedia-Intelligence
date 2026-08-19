const axios = require("axios");

const baseURL = "http://localhost:5000";

async function runSaveFlowTest() {
  console.log("==================================================");
  console.log("  KPI PREFERENCES SAVE FLOW & PERSISTENCE TEST   ");
  console.log("==================================================");

  try {
    // 1. Create a unique test user
    const testEmail = `save_test_${Date.now()}@vytalis.com`;
    const signupRes = await axios.post(`${baseURL}/api/auth/signup`, {
      name: "Save Flow Test User",
      email: testEmail,
      password: "TestPassword123!",
      accessCode: "vytalis@2026",
    });

    let cookie = signupRes.headers["set-cookie"];
    const user = signupRes.data.data.user;

    console.log("✓ TEST 1 PASS: User created successfully. ID:", user.id || user._id);

    // 2. Fetch initial preferences (should be defaults)
    const initialGet = await axios.get(`${baseURL}/api/profile/kpi-preferences`, {
      headers: { Cookie: cookie },
    });
    console.log("✓ TEST 2 PASS: Initial default preferences fetched:", initialGet.data.data);

    // 3. User customizes metrics via Save Changes (PUT /api/profile/kpi-preferences)
    const targetMeta = ["purchase-roas", "ctr", "purchases", "reach", "cpm"];
    const targetShopify = ["netSales", "orders", "aov", "customers", "prepaid"];

    const saveRes = await axios.put(
      `${baseURL}/api/profile/kpi-preferences`,
      { meta: targetMeta, shopify: targetShopify },
      { headers: { Cookie: cookie } }
    );

    console.log("✓ TEST 3 PASS: Save Changes request succeeded. Returned data:", saveRes.data.data);

    if (JSON.stringify(saveRes.data.data.meta) !== JSON.stringify(targetMeta)) {
      throw new Error("FAIL: Meta preferences saved incorrectly!");
    }
    if (JSON.stringify(saveRes.data.data.shopify) !== JSON.stringify(targetShopify)) {
      throw new Error("FAIL: Shopify preferences saved incorrectly!");
    }

    // 4. Verify browser refresh simulation (GET /api/profile/kpi-preferences)
    const refreshGet = await axios.get(`${baseURL}/api/profile/kpi-preferences`, {
      headers: { Cookie: cookie },
    });
    console.log("✓ TEST 4 PASS: Simulated browser refresh returns persisted preferences:", refreshGet.data.data);
    if (JSON.stringify(refreshGet.data.data.meta) !== JSON.stringify(targetMeta)) {
      throw new Error("FAIL: Meta preferences lost after refresh!");
    }

    // 5. Verify Logout -> Login -> Dashboard simulation
    const loginRes = await axios.post(`${baseURL}/api/auth/login`, {
      email: testEmail,
      password: "TestPassword123!",
    });
    cookie = loginRes.headers["set-cookie"];

    const postLoginGet = await axios.get(`${baseURL}/api/profile/kpi-preferences`, {
      headers: { Cookie: cookie },
    });

    console.log("✓ TEST 5 PASS: Simulated Logout -> Login preserves preferences:", postLoginGet.data.data);
    if (JSON.stringify(postLoginGet.data.data.meta) !== JSON.stringify(targetMeta)) {
      throw new Error("FAIL: Meta preferences lost after relogin!");
    }
    if (JSON.stringify(postLoginGet.data.data.shopify) !== JSON.stringify(targetShopify)) {
      throw new Error("FAIL: Shopify preferences lost after relogin!");
    }

    console.log("\n==================================================");
    console.log("  ALL SAVE FLOW VERIFICATION TESTS PASSED! 🎉    ");
    console.log("==================================================");
  } catch (err) {
    console.error("❌ TEST FAILED:", err.response?.data || err.message);
    process.exit(1);
  }
}

runSaveFlowTest();
