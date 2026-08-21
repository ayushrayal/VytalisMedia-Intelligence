const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });

const connectDB = require("../config/db");
const User = require("../models/user.model");
const cacheUtil = require("../utils/cache.util");
const {
  calculateAllEffectivePermissions,
  calculateBatchEffectivePermissions,
} = require("../utils/permission-calculator.util");

async function traceProductionLayer() {
  console.log("\n==================================================");
  console.log("PRODUCTION VS LOCAL DIAGNOSTIC LAYER TRACE");
  console.log("==================================================\n");

  await connectDB();

  // Find a target user (e.g. client or member)
  const targetUser = await User.findOne({ role: { $in: ["client", "member"] } });
  if (!targetUser) {
    console.error("No test user found in DB");
    process.exit(1);
  }

  const userId = targetUser._id.toString();
  console.log(`Checking User: ${userId} (${targetUser.email}, Role: ${targetUser.role})`);

  // LAYER A: Check raw MongoDB document
  console.log("\n[LAYER A] MongoDB Raw assignedPermissions:");
  console.log(JSON.stringify(targetUser.assignedPermissions, null, 2));

  // LAYER B & C: Check Redis version & cache keys
  if (cacheUtil.isReady()) {
    const uVerKey = `perm_ver:user:${userId}`;
    const uVer = await cacheUtil.get(uVerKey);
    console.log(`\n[LAYER C] Redis User Version (${uVerKey}):`, uVer || "1 (Not Set)");

    const effKeys = await cacheUtil.keys(`eff_perms:${userId}:*`);
    console.log(`   Existing eff_perms keys for ${userId}:`, effKeys);

    for (const k of effKeys) {
      const cachedVal = await cacheUtil.get(k);
      console.log(`   Cached content for ${k}:`, {
        "dashboard.view": cachedVal ? cachedVal["dashboard.view"]?.allowed : undefined,
        "meta.campaigns": cachedVal ? cachedVal["meta.campaigns"]?.allowed : undefined,
      });
    }
  } else {
    console.log("\n[LAYER C] Redis is not connected or cacheUtil not ready");
  }

  // LAYER B: Check API response representation
  console.log("\n[LAYER B] Backend Effective Permission Calculation Output:");
  const eff = await calculateAllEffectivePermissions(targetUser);
  console.log("   meta.campaigns allowed:", eff["meta.campaigns"]?.allowed);
  console.log("   dashboard.view allowed:", eff["dashboard.view"]?.allowed);

  const jsonUser = targetUser.toJSON();
  jsonUser.effectivePermissions = eff;

  console.log("\n--- Simulating API JSON Response Structure ---");
  console.log("   jsonUser.assignedPermissions is Array:", Array.isArray(jsonUser.assignedPermissions));
  console.log("   jsonUser.assignedPermissions length:", jsonUser.assignedPermissions.length);
  console.log("   jsonUser.effectivePermissions keys count:", Object.keys(jsonUser.effectivePermissions).length);

  process.exit(0);
}

traceProductionLayer().catch((err) => {
  console.error("Diagnostic Trace Error:", err);
  process.exit(1);
});
