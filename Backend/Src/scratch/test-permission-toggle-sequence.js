const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });

const connectDB = require("../config/db");
const User = require("../models/user.model");
const {
  calculateAllEffectivePermissions,
  invalidateUserPermissionCache,
} = require("../utils/permission-calculator.util");

async function runPermissionToggleTest() {
  console.log("\n==================================================");
  console.log("PERMISSION TOGGLE & CACHE INVALIDATION TEST");
  console.log("==================================================\n");
  await connectDB();

  const user = await User.findOne({ role: { $in: ["client", "member"] } });
  if (!user) {
    console.error("No test user found");
    process.exit(1);
  }

  console.log(`Testing with User: ${user._id} (${user.email})`);

  // Helper function to update assigned permissions
  const updatePermissionKey = async (targetKey, newValue) => {
    const existingMap = new Map();
    if (Array.isArray(user.assignedPermissions)) {
      user.assignedPermissions.forEach((p) => {
        if (p && p.key) existingMap.set(p.key, Boolean(p.allowed));
      });
    }
    existingMap.set(targetKey, Boolean(newValue));
    user.assignedPermissions = Array.from(existingMap.entries()).map(([key, allowed]) => ({
      key,
      allowed,
    }));
    await user.save();
    await invalidateUserPermissionCache(user._id);
  };

  const testKey = "dashboard.view";

  // Step A: Read permissions -> Cache them
  console.log(`Step A: Reading initial permissions for '${testKey}'...`);
  const stepA = await calculateAllEffectivePermissions(user);
  console.log(`   Initial '${testKey}' allowed: ${stepA[testKey]?.allowed}`);

  // Step B & C: Change dashboard.view -> ON & Save
  console.log(`\nStep B & C: Setting '${testKey}' to ON (true) & Saving...`);
  await updatePermissionKey(testKey, true);

  // Step D: Read permissions again
  console.log(`Step D: Re-reading permissions for '${testKey}'...`);
  const stepD = await calculateAllEffectivePermissions(user);
  console.log(`   Second read '${testKey}' allowed: ${stepD[testKey]?.allowed} (Expected: true)`);
  if (stepD[testKey]?.allowed !== true) {
    throw new Error(`Step D Failed: '${testKey}' did not revert/update to true`);
  }

  // Step E & F: Change dashboard.view -> OFF & Save
  console.log(`\nStep E & F: Setting '${testKey}' to OFF (false) & Saving...`);
  await updatePermissionKey(testKey, false);

  // Step G: Read permissions again
  console.log(`Step G: Re-reading permissions for '${testKey}'...`);
  const stepG = await calculateAllEffectivePermissions(user);
  console.log(`   Third read '${testKey}' allowed: ${stepG[testKey]?.allowed} (Expected: false)`);
  if (stepG[testKey]?.allowed !== false) {
    throw new Error(`Step G Failed: '${testKey}' did not revert/update to false`);
  }

  console.log("\n==================================================");
  console.log("PERMISSION TOGGLE & CACHE INVALIDATION TEST PASSED!");
  console.log("==================================================\n");
  process.exit(0);
}

runPermissionToggleTest().catch((err) => {
  console.error("Test Failure:", err);
  process.exit(1);
});
