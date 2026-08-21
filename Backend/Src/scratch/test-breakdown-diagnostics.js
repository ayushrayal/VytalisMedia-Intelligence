const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });

const connectDB = require("../config/db");
const metaAnalyticsService = require("../services/meta-analytics.service");
const facebookAdapter = require("../adapters/facebook.adapter");
const User = require("../models/user.model");

async function testDiagnostics() {
  console.log("=== CAMPAIGN BREAKDOWNS DIAGNOSTICS ===");
  await connectDB();

  const user = await User.findOne({ role: { $in: ["root_admin", "admin", "client"] } }).lean();
  if (!user) {
    console.log("No user found");
    process.exit(1);
  }
  user.preferences = user.preferences || {};
  const activeMetaAccount = user.preferences.activeMetaAccount || "227289117016624";
  user.preferences.activeMetaAccount = activeMetaAccount;

  console.log(`Testing with User: ${user._id}, Account: ${activeMetaAccount}`);

  // Test fetchCampaigns SCOPED to campaignId
  const testCampaignId = "120204652233510587"; // active campaign or test campaign ID
  console.log(`Fetching scoped campaign verification for ID: ${testCampaignId}...`);
  try {
    const verified = await facebookAdapter.fetchCampaigns({
      activeMetaAccount,
      campaignId: testCampaignId,
      datePreset: "last_7d",
    });
    console.log("Verified campaigns returned count:", verified ? verified.length : 0);
  } catch (err) {
    console.error("Scoped fetchCampaigns error:", err.message);
  }

  for (const cat of ["age", "gender", "placement"]) {
    console.log(`\nTesting Breakdown Category: '${cat}'...`);
    try {
      const res = await metaAnalyticsService.getCampaignBreakdowns({
        user,
        campaignId: testCampaignId,
        breakdown: cat,
        query: { datePreset: "last_7d" },
      });
      console.log(`SUCCESS [${cat}]! Data rows count: ${res.data.rows.length}`);
      if (res.data.rows.length > 0) {
        console.log(`Sample row [${cat}]:`, res.data.rows[0]);
      }
    } catch (err) {
      console.error(`ERROR [${cat}]:`, err.statusCode, err.message);
      if (err.stack) console.error(err.stack);
    }
  }

  process.exit(0);
}

testDiagnostics();
