const axios = require("axios");

const baseURL = "http://localhost:5000";

async function runKpiTest() {
  console.log("==================================================");
  console.log("  KPI PREFERENCES BACKEND & API VERIFICATION      ");
  console.log("==================================================");

  try {
    // 1. Create a test user
    const testEmail = `kpi_user_${Date.now()}@vytalis.com`;
    const signupRes = await axios.post(`${baseURL}/api/auth/signup`, {
      name: "KPI Preference User",
      email: testEmail,
      password: "TestPassword123!",
      accessCode: "vytalis@2026",
    });

    const cookie = signupRes.headers["set-cookie"];

    // 2. Fetch default KPI preferences
    const getRes = await axios.get(`${baseURL}/api/profile/kpi-preferences`, {
      headers: { Cookie: cookie },
    });

    console.log("✓ PASS 1: GET /api/profile/kpi-preferences returned defaults:", getRes.data.data);
    if (!Array.isArray(getRes.data.data.meta) || getRes.data.data.meta.length !== 5) {
      throw new Error("FAIL: Default meta preferences length is not 5!");
    }
    if (!Array.isArray(getRes.data.data.shopify) || getRes.data.data.shopify.length !== 5) {
      throw new Error("FAIL: Default shopify preferences length is not 5!");
    }

    // 3. Test validation: Empty selection should return 400
    try {
      await axios.put(
        `${baseURL}/api/profile/kpi-preferences`,
        { meta: [], shopify: ["netSales"] },
        { headers: { Cookie: cookie } }
      );
      throw new Error("FAIL: Expected 400 for empty meta array!");
    } catch (err) {
      if (err.response && err.response.status === 400) {
        console.log("✓ PASS 2: Empty selection correctly rejected with HTTP 400");
      } else {
        throw err;
      }
    }

    // 4. Test validation: Selection > 5 should return 400
    try {
      await axios.put(
        `${baseURL}/api/profile/kpi-preferences`,
        {
          meta: ["amount-spent", "impressions", "reach", "purchases", "purchase-value", "clicks"],
          shopify: ["netSales"],
        },
        { headers: { Cookie: cookie } }
      );
      throw new Error("FAIL: Expected 400 for meta array > 5!");
    } catch (err) {
      if (err.response && err.response.status === 400) {
        console.log("✓ PASS 3: Selection > 5 items correctly rejected with HTTP 400");
      } else {
        throw err;
      }
    }

    // 5. Test valid custom KPI preference update
    const customMeta = ["purchase-roas", "amount-spent", "purchases", "ctr"];
    const customShopify = ["netSales", "orders", "aov", "discounts", "prepaid"];

    const putRes = await axios.put(
      `${baseURL}/api/profile/kpi-preferences`,
      { meta: customMeta, shopify: customShopify },
      { headers: { Cookie: cookie } }
    );

    console.log("✓ PASS 4: PUT /api/profile/kpi-preferences updated preferences successfully:", putRes.data.data);
    if (JSON.stringify(putRes.data.data.meta) !== JSON.stringify(customMeta)) {
      throw new Error("FAIL: Meta preferences mismatch after update!");
    }

    // 6. Verify persistence via GET /api/profile/kpi-preferences
    const verifyRes = await axios.get(`${baseURL}/api/profile/kpi-preferences`, {
      headers: { Cookie: cookie },
    });
    console.log("✓ PASS 5: Preferences persisted across requests:", verifyRes.data.data);
    if (JSON.stringify(verifyRes.data.data.shopify) !== JSON.stringify(customShopify)) {
      throw new Error("FAIL: Shopify preferences mismatch on verification get!");
    }

    console.log("\nALL KPI PREFERENCE VERIFICATION TESTS PASSED SUCCESSFULLY! 🎉");
  } catch (err) {
    console.error("❌ TEST FAILED:", err.response?.data || err.message);
    process.exit(1);
  }
}

runKpiTest();
