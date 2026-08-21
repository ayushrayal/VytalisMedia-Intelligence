const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const connectDB = require("./config/db");
const User = require("./models/user.model");
const cacheUtil = require("./utils/cache.util");
const {
  calculateAllEffectivePermissions,
  calculateBatchEffectivePermissions,
  invalidateUserPermissionCache,
} = require("./utils/permission-calculator.util");

const runCacheMissRegressionTest = async () => {
  console.log("\n==================================================");
  console.log("REDIS EFF_PERMS CACHE MISS REGRESSION TEST SUITE");
  console.log("==================================================\n");

  await connectDB();

  const userDoc = await User.findOne({ role: { $in: ["client", "member"] } });
  if (!userDoc) {
    console.error("No client/member test user found in DB");
    process.exit(1);
  }

  const userId = userDoc._id.toString();
  console.log(`Test User ID: ${userId} (${userDoc.email}, Role: ${userDoc.role})`);

  const testKeys = ["dashboard.view", "meta.view", "meta.campaigns", "meta.adsets"];

  // Helper to simulate permission save (identical to admin/client-team controllers)
  const saveUserPermissions = async (permUpdates) => {
    const freshUser = await User.findById(userId);
    const existingMap = new Map();
    if (Array.isArray(freshUser.assignedPermissions)) {
      freshUser.assignedPermissions.forEach((p) => {
        if (p && p.key) existingMap.set(p.key, Boolean(p.allowed));
      });
    }

    Object.entries(permUpdates).forEach(([key, val]) => {
      existingMap.set(key, Boolean(val));
    });

    freshUser.assignedPermissions = Array.from(existingMap.entries()).map(([key, allowed]) => ({
      key,
      allowed,
    }));

    await freshUser.save();
    await invalidateUserPermissionCache(userId);
    return freshUser;
  };

  // Helper to clear Redis eff_perms cache specifically for this user
  const clearUserEffPermsCache = async () => {
    if (cacheUtil.isReady()) {
      const keys = await cacheUtil.keys(`eff_perms:${userId}:*`);
      if (keys && keys.length > 0) {
        for (const k of keys) {
          await cacheUtil.del(k);
        }
        console.log(`   Cleared ${keys.length} eff_perms Redis cache keys for user ${userId}`);
      } else {
        console.log(`   No existing eff_perms cache keys found to clear for user ${userId}`);
      }
    }
  };

  try {
    for (const testKey of testKeys) {
      console.log(`\n--- TESTING PERMISSION KEY: '${testKey}' ---`);

      // 1. Set permission OFF
      console.log(`[Step 1] Setting '${testKey}' to OFF...`);
      await saveUserPermissions({ [testKey]: false });

      // 2. Set permission ON
      console.log(`[Step 2 & 3] Setting '${testKey}' to ON...`);
      const updatedDocOn = await saveUserPermissions({ [testKey]: true });

      // Verify MongoDB stores ON
      const dbEntryOn = updatedDocOn.assignedPermissions.find((p) => p.key === testKey);
      console.log(`   MongoDB stored value for '${testKey}':`, dbEntryOn ? dbEntryOn.allowed : null);
      if (!dbEntryOn || dbEntryOn.allowed !== true) {
        throw new Error(`MongoDB failed to store '${testKey}' as true`);
      }

      // 4. Clear ONLY eff_perms cache for this user
      console.log(`[Step 4] Clearing Redis eff_perms cache for user ${userId}...`);
      await clearUserEffPermsCache();

      // 5 & 6. Request effective permissions again on CACHE MISS
      console.log(`[Step 5 & 6] Requesting effective permissions on CACHE MISS...`);
      const freshUserLean = await User.findById(userId).lean();
      const missCalc = await calculateAllEffectivePermissions(freshUserLean);
      const batchMissCalcMap = await calculateBatchEffectivePermissions([freshUserLean]);
      const batchMissCalc = batchMissCalcMap.get(userId);

      console.log(`   Single calculateAllEffectivePermissions '${testKey}':`, missCalc[testKey]?.allowed);
      console.log(`   Batch calculateBatchEffectivePermissions '${testKey}':`, batchMissCalc ? batchMissCalc[testKey]?.allowed : "MISSING");

      if (missCalc[testKey]?.allowed !== true || !batchMissCalc || batchMissCalc[testKey]?.allowed !== true) {
        throw new Error(`CACHE MISS calculation returned false for '${testKey}' when MongoDB stored true`);
      }

      // 7 & 8. Request again and verify warm-cache response is also ON
      console.log(`[Step 7 & 8] Requesting effective permissions on WARM CACHE HIT...`);
      const warmCalc = await calculateAllEffectivePermissions(freshUserLean);
      const batchWarmCalcMap = await calculateBatchEffectivePermissions([freshUserLean]);
      const batchWarmCalc = batchWarmCalcMap.get(userId);

      console.log(`   Warm cache calculateAllEffectivePermissions '${testKey}':`, warmCalc[testKey]?.allowed);
      console.log(`   Warm cache calculateBatchEffectivePermissions '${testKey}':`, batchWarmCalc ? batchWarmCalc[testKey]?.allowed : "MISSING");

      if (warmCalc[testKey]?.allowed !== true || !batchWarmCalc || batchWarmCalc[testKey]?.allowed !== true) {
        throw new Error(`WARM CACHE HIT returned false for '${testKey}' when MongoDB stored true`);
      }

      // 9 & 10. Toggle OFF & verify MongoDB and calculation return false
      console.log(`[Step 9 & 10] Toggling '${testKey}' to OFF...`);
      const updatedDocOff = await saveUserPermissions({ [testKey]: false });
      await clearUserEffPermsCache();

      const freshUserOffLean = await User.findById(userId).lean();
      const offCalc = await calculateAllEffectivePermissions(freshUserOffLean);
      console.log(`   After toggling OFF, calculated '${testKey}' allowed:`, offCalc[testKey]?.allowed);

      if (offCalc[testKey]?.allowed !== false) {
        throw new Error(`Toggling '${testKey}' to OFF failed to return false`);
      }
    }

    console.log("\n==================================================");
    console.log("ALL CACHE MISS & TOGGLE REGRESSION TESTS PASSED!");
    console.log("==================================================\n");
    process.exit(0);
  } catch (err) {
    console.error("Regression Test Failure:", err);
    process.exit(1);
  }
};

runCacheMissRegressionTest();
