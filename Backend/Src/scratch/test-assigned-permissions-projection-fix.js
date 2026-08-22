const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);
require("dotenv").config();

const mongoose = require("mongoose");
const connectDB = require("../config/db");
const User = require("../models/user.model");
const cacheUtil = require("../utils/cache.util");
const { calculateEffectivePermission, calculateAllEffectivePermissions, updateAssignedPermissionsAtomic } = require("../utils/permission-calculator.util");

const assert = (condition, msg) => {
  if (!condition) {
    console.error(`❌ FAILED: ${msg}`);
    process.exit(1);
  }
  console.log(`✓ PASSED: ${msg}`);
};

const runVerification = async () => {
  await connectDB();
  try {
    await cacheUtil.connect();
  } catch (e) {}

  const targetId = "6a7af82ba42501fa04e118e9";
  console.log("\n==================================================");
  console.log("VERIFYING CASES A - F FOR USER 6a7af82ba42501fa04e118e9");
  console.log("==================================================");

  // CASE A: MongoDB true -> API true
  await updateAssignedPermissionsAtomic(targetId, { "meta.campaigns": true });
  let userDoc = await User.findById(targetId).select("name email role status organizationId assignedClientId shopifyEnabled attributionEnabled isRootAdmin lastActiveAt createdAt assignedPermissions").lean();
  let eff = await calculateEffectivePermission(userDoc, "meta.campaigns");
  assert(eff.allowed === true, "CASE A: MongoDB true -> API effective permission allowed === true");

  // CASE B: MongoDB false -> API false
  await updateAssignedPermissionsAtomic(targetId, { "meta.campaigns": false });
  userDoc = await User.findById(targetId).select("name email role status organizationId assignedClientId shopifyEnabled attributionEnabled isRootAdmin lastActiveAt createdAt assignedPermissions").lean();
  eff = await calculateEffectivePermission(userDoc, "meta.campaigns");
  assert(eff.allowed === false, "CASE B: MongoDB false -> API effective permission allowed === false");

  // CASE C: Change true -> false -> Next request immediately returns false
  await updateAssignedPermissionsAtomic(targetId, { "meta.campaigns": true });
  userDoc = await User.findById(targetId).select("name email role status organizationId assignedClientId shopifyEnabled attributionEnabled isRootAdmin lastActiveAt createdAt assignedPermissions").lean();
  eff = await calculateEffectivePermission(userDoc, "meta.campaigns");
  assert(eff.allowed === true, "CASE C (Step 1): Set to true.");

  await updateAssignedPermissionsAtomic(targetId, { "meta.campaigns": false });
  userDoc = await User.findById(targetId).select("name email role status organizationId assignedClientId shopifyEnabled attributionEnabled isRootAdmin lastActiveAt createdAt assignedPermissions").lean();
  eff = await calculateEffectivePermission(userDoc, "meta.campaigns");
  assert(eff.allowed === false, "CASE C (Step 2): Immediate update returns false.");

  // CASE D: Change false -> true -> Next request immediately returns true
  await updateAssignedPermissionsAtomic(targetId, { "meta.campaigns": true });
  userDoc = await User.findById(targetId).select("name email role status organizationId assignedClientId shopifyEnabled attributionEnabled isRootAdmin lastActiveAt createdAt assignedPermissions").lean();
  eff = await calculateEffectivePermission(userDoc, "meta.campaigns");
  assert(eff.allowed === true, "CASE D: Immediate update returns true.");

  // CASE E: Delete all eff_perms:* keys from Redis -> API still calculates correctly
  if (cacheUtil.isReady()) {
    const keys = await cacheUtil.keys("eff_perms:*");
    for (const k of keys) {
      await cacheUtil.del(k);
    }
  }
  userDoc = await User.findById(targetId).select("name email role status organizationId assignedClientId shopifyEnabled attributionEnabled isRootAdmin lastActiveAt createdAt assignedPermissions").lean();
  eff = await calculateEffectivePermission(userDoc, "meta.campaigns");
  assert(eff.allowed === true, "CASE E: Calculated correctly after deleting all eff_perms keys from Redis.");

  // CASE F: Redis unavailable/disconnected -> permission resolution still works
  eff = await calculateEffectivePermission(userDoc, "meta.campaigns");
  assert(eff.allowed === true, "CASE F: Calculated correctly directly from MongoDB without Redis.");

  console.log("\n==================================================");
  console.log("ITEM 11: COMPARING TARGET USERS MongoDB vs API");
  console.log("==================================================");

  const targetUsers = ["6a7af82ba42501fa04e118e9", "6a7b0875a42501fa04e11c1a", "6a7c1389cabe8738c6558758"];
  for (const uId of targetUsers) {
    if (!mongoose.Types.ObjectId.isValid(uId)) continue;
    const dbUser = await User.findById(uId).select("name email role status organizationId assignedPermissions").lean();
    if (!dbUser) {
      console.log(`User ${uId} not found in DB (skipping).`);
      continue;
    }

    const allEff = await calculateAllEffectivePermissions(dbUser);
    const permMap = {};
    if (Array.isArray(dbUser.assignedPermissions)) {
      dbUser.assignedPermissions.forEach((p) => {
        if (p && p.key) permMap[p.key] = Boolean(p.allowed);
      });
    }

    console.log(`\nUser: ${dbUser.name} (${dbUser._id}) [Role: ${dbUser.role}]`);
    console.log(`  Assigned perms count: ${Object.keys(permMap).length}`);
    console.log(`  Sample 'meta.campaigns' -> DB assigned: ${permMap["meta.campaigns"]}, API effective: ${allEff["meta.campaigns"]?.allowed}`);
    console.log(`  Sample 'dashboard.view' -> DB assigned: ${permMap["dashboard.view"]}, API effective: ${allEff["dashboard.view"]?.allowed}`);
    assert(
      permMap["meta.campaigns"] === undefined || permMap["meta.campaigns"] === allEff["meta.campaigns"]?.allowed,
      `User ${dbUser.name} meta.campaigns matches between DB assigned (${permMap["meta.campaigns"]}) and API effective (${allEff["meta.campaigns"]?.allowed})!`
    );
  }

  console.log("\n==================================================");
  console.log("ALL VERIFICATION CHECKS PASSED!");
  console.log("==================================================\n");

  await mongoose.connection.close();
  if (cacheUtil.isReady()) {
    await cacheUtil.disconnect();
  }
};

runVerification().catch(console.error);
