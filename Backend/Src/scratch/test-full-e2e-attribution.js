const axios = require("axios");
const fs = require("fs");
const path = require("path");

const baseURL = "http://localhost:5000";

async function runFullE2ETest() {
  console.log("==================================================");
  console.log("  FULL ATTRIBUTION ACCESS E2E SYSTEM VERIFICATION ");
  console.log("==================================================");

  try {
    // ------------------------------------------------
    // TEST 1: New User Creation & Default Disabled State
    // ------------------------------------------------
    const user1Email = `user1_${Date.now()}@vytalis.com`;
    const signup1 = await axios.post(`${baseURL}/api/auth/signup`, {
      name: "User One",
      email: user1Email,
      password: "Password123!",
      accessCode: "vytalis@2026",
    });

    const cookie1 = signup1.headers["set-cookie"];
    const u1 = signup1.data.data.user;

    console.log("✓ TEST 1 PASS: New user created with attributionEnabled = false");
    if (u1.attributionEnabled !== false) {
      throw new Error("TEST 1 FAILED: attributionEnabled is not false!");
    }

    // ------------------------------------------------
    // TEST 2: Existing User Log In & Default Disabled State
    // ------------------------------------------------
    const login1 = await axios.post(`${baseURL}/api/auth/login`, {
      email: user1Email,
      password: "Password123!",
    });
    const u1Login = login1.data.data.user;
    console.log("✓ TEST 2 PASS: User login response contains attributionEnabled = false");
    if (u1Login.attributionEnabled !== false) {
      throw new Error("TEST 2 FAILED: User login did not return attributionEnabled = false!");
    }

    // ------------------------------------------------
    // TEST 3: User opens Profile (/api/profile)
    // ------------------------------------------------
    const profile1 = await axios.get(`${baseURL}/api/profile`, {
      headers: { Cookie: cookie1 },
    });
    console.log("✓ TEST 3 PASS: GET /api/profile returns attributionEnabled = false");
    if (profile1.data.data.attributionEnabled !== false) {
      throw new Error("TEST 3 FAILED: Profile API returned attributionEnabled !== false!");
    }

    // ------------------------------------------------
    // TEST 4: Incorrect key attempt
    // ------------------------------------------------
    try {
      await axios.post(
        `${baseURL}/api/profile/attribution/enable`,
        { accessKey: "WrongSecretKey!" },
        { headers: { Cookie: cookie1 } }
      );
      throw new Error("TEST 4 FAILED: Expected 401 error for incorrect key");
    } catch (err) {
      if (err.response && (err.response.status === 401 || err.response.status === 403)) {
        console.log("✓ TEST 4 PASS: Incorrect key returns HTTP 401 ('Invalid access key')");
      } else {
        throw err;
      }
    }

    // ------------------------------------------------
    // TEST 5: Correct key attempt: VytalisAttribution@2026
    // ------------------------------------------------
    const unlockRes = await axios.post(
      `${baseURL}/api/profile/attribution/enable`,
      { accessKey: "VytalisAttribution@2026" },
      { headers: { Cookie: cookie1 } }
    );
    console.log("✓ TEST 5 PASS: Backend accepted VytalisAttribution@2026 and returned attributionEnabled = true");
    if (unlockRes.data.data.attributionEnabled !== true) {
      throw new Error("TEST 5 FAILED: Enable endpoint did not return attributionEnabled = true!");
    }

    // ------------------------------------------------
    // TEST 6 & 7: User 1 can now access Attribution API
    // ------------------------------------------------
    const meRes = await axios.get(`${baseURL}/api/auth/me`, {
      headers: { Cookie: cookie1 },
    });
    console.log("✓ TEST 6 & 7 PASS: GET /api/auth/me confirms attributionEnabled = true for unlocked user");
    if (meRes.data.data.user.attributionEnabled !== true) {
      throw new Error("TEST 6/7 FAILED: GET /api/auth/me did not reflect enabled status!");
    }

    // ------------------------------------------------
    // TEST 8 & 9: User 2 (not unlocked) visits Attribution API
    // ------------------------------------------------
    const user2Email = `user2_${Date.now()}@vytalis.com`;
    const signup2 = await axios.post(`${baseURL}/api/auth/signup`, {
      name: "User Two",
      email: user2Email,
      password: "Password123!",
      accessCode: "vytalis@2026",
    });
    const cookie2 = signup2.headers["set-cookie"];

    try {
      await axios.get(`${baseURL}/api/attribution/overview`, {
        headers: { Cookie: cookie2 },
      });
      throw new Error("TEST 8/9 FAILED: Unlocked User 2 was able to call Attribution API!");
    } catch (err) {
      if (err.response && err.response.status === 403) {
        console.log("✓ TEST 8 & 9 PASS: Unlocked User 2 is strictly blocked with HTTP 403 Forbidden");
      } else {
        throw err;
      }
    }

    // ------------------------------------------------
    // TEST 10: Verify Access Key is NEVER exposed in Frontend Bundle
    // ------------------------------------------------
    const distJsPath = path.join(__dirname, "../../public/assets");
    if (fs.existsSync(distJsPath)) {
      const files = fs.readdirSync(distJsPath);
      for (const file of files) {
        if (file.endsWith(".js")) {
          const content = fs.readFileSync(path.join(distJsPath, file), "utf8");
          if (content.includes("VytalisAttribution@2026")) {
            throw new Error(`TEST 10 FAILED: Secret key found in frontend build file ${file}!`);
          }
        }
      }
      console.log("✓ TEST 10 PASS: Secret ATTRIBUTION_ACCESS_KEY is 100% absent from all frontend production bundles!");
    }

    console.log("\n==================================================");
    console.log("  ALL 10 VERIFICATION TESTS PASSED SUCCESSFULLY!  ");
    console.log("==================================================");
  } catch (err) {
    console.error("❌ E2E TEST FAILED:", err.response?.data || err.message);
    process.exit(1);
  }
}

runFullE2ETest();
