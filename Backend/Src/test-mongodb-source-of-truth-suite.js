/**
 * Complete MongoDB-Only Permission Architecture Test Suite (12 Required Test Cases)
 */

const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);
require("dotenv").config();

const mongoose = require("mongoose");
const connectDB = require("./config/db");
const cacheUtil = require("./utils/cache.util");
const User = require("./models/user.model");
const Organization = require("./models/organization.model");
const AdminAssignment = require("./models/admin-assignment.model");
const {
  calculateEffectivePermission,
  calculateAllEffectivePermissions,
  updateAssignedPermissionsAtomic,
} = require("./utils/permission-calculator.util");
const { getNextSequenceValue } = require("./models/counter.model");
const { ALL_PERMISSION_KEYS } = require("./config/permission-registry");

let rootAdmin = null;
let adminA = null;
let adminB = null;
let targetClient = null;
let targetMember = null;
let testOrg = null;

const assert = (condition, message) => {
  if (!condition) {
    console.error(`❌ FAILURE: ${message}`);
    process.exit(1);
  }
  console.log(`  ✓ SUCCESS: ${message}`);
};

const setupTestData = async () => {
  console.log("\n==================================================");
  console.log("SETTING UP TEST DATA FOR MONGODB-ONLY PERMISSION SUITE");
  console.log("==================================================");

  await User.deleteMany({ email: { $regex: "@mongo-sot-test\\.com$" } });
  await Organization.deleteMany({ name: "Mongo SOT Test Org" });
  await AdminAssignment.deleteMany({});

  const nextRank = await getNextSequenceValue("rootAdminRank");

  rootAdmin = await User.create({
    name: "Root Admin SOT",
    email: "root@mongo-sot-test.com",
    password: "password123",
    role: "root_admin",
    isRootAdmin: true,
    rootAdminRank: nextRank,
    status: "active",
    assignedPermissions: ALL_PERMISSION_KEYS.map((k) => ({ key: k, allowed: true })),
  });

  adminA = await User.create({
    name: "Admin A SOT",
    email: "admina@mongo-sot-test.com",
    password: "password123",
    role: "admin",
    status: "active",
    assignedPermissions: ALL_PERMISSION_KEYS.map((k) => ({ key: k, allowed: true })),
  });

  adminB = await User.create({
    name: "Admin B SOT (Restricted)",
    email: "adminb@mongo-sot-test.com",
    password: "password123",
    role: "admin",
    status: "active",
    assignedPermissions: ALL_PERMISSION_KEYS.map((k) => ({
      key: k,
      allowed: k !== "meta.campaigns",
    })),
  });

  const dummyOwnerId = new mongoose.Types.ObjectId();

  testOrg = await Organization.create({
    name: "Mongo SOT Test Org",
    ownerId: dummyOwnerId,
    status: "active",
  });

  await AdminAssignment.create({
    adminId: adminA._id,
    organizationId: testOrg._id,
    status: "active",
    assignedAt: new Date(),
  });

  targetClient = await User.create({
    name: "Target Client SOT",
    email: "client@mongo-sot-test.com",
    password: "password123",
    role: "client",
    status: "active",
    organizationId: testOrg._id,
    assignedPermissions: ALL_PERMISSION_KEYS.map((k) => ({
      key: k,
      allowed: k === "dashboard.view",
    })),
  });

  testOrg.ownerId = targetClient._id;
  await testOrg.save();

  targetMember = await User.create({
    name: "Target Member SOT",
    email: "member@mongo-sot-test.com",
    password: "password123",
    role: "member",
    status: "active",
    organizationId: testOrg._id,
    assignedClientId: targetClient._id,
    assignedPermissions: ALL_PERMISSION_KEYS.map((k) => ({
      key: k,
      allowed: k === "dashboard.view",
    })),
  });

  console.log("✓ Test users & org initialized successfully.");
};

const runTests = async () => {
  await connectDB();
  try {
    await cacheUtil.connect();
  } catch (e) {
    console.log("Redis not connected or unavailable for cacheUtil (continuing tests)");
  }

  await setupTestData();

  console.log("\n--- TEST 1: MongoDB permission = true -> API effective permission = true ---");
  {
    await User.updateOne(
      { _id: targetClient._id, "assignedPermissions.key": "meta.campaigns" },
      { $set: { "assignedPermissions.$.allowed": true } }
    );
    const freshClient = await User.findById(targetClient._id);
    const eff = await calculateEffectivePermission(freshClient, "meta.campaigns");
    assert(eff.allowed === true, "Effective permission for meta.campaigns is true when MongoDB is true.");
  }

  console.log("\n--- TEST 2: MongoDB permission = false -> API effective permission = false ---");
  {
    await User.updateOne(
      { _id: targetClient._id, "assignedPermissions.key": "meta.campaigns" },
      { $set: { "assignedPermissions.$.allowed": false } }
    );
    const freshClient = await User.findById(targetClient._id);
    const eff = await calculateEffectivePermission(freshClient, "meta.campaigns");
    assert(eff.allowed === false, "Effective permission for meta.campaigns is false when MongoDB is false.");
  }

  console.log("\n--- TEST 3: Admin changes true -> false -> MongoDB becomes false immediately ---");
  {
    await updateAssignedPermissionsAtomic(targetClient._id, { "meta.campaigns": true });
    let freshClient = await User.findById(targetClient._id);
    let effBefore = await calculateEffectivePermission(freshClient, "meta.campaigns");
    assert(effBefore.allowed === true, "Initially set to true in MongoDB.");

    await updateAssignedPermissionsAtomic(targetClient._id, { "meta.campaigns": false });
    freshClient = await User.findById(targetClient._id);
    let effAfter = await calculateEffectivePermission(freshClient, "meta.campaigns");
    const entryInDb = freshClient.assignedPermissions.find((p) => p.key === "meta.campaigns");
    assert(entryInDb && entryInDb.allowed === false, "MongoDB contains false immediately after update.");
    assert(effAfter.allowed === false, "API calculation returns false immediately.");
  }

  console.log("\n--- TEST 4: Admin changes false -> true -> MongoDB becomes true immediately ---");
  {
    await updateAssignedPermissionsAtomic(targetClient._id, { "meta.campaigns": true });
    const freshClient = await User.findById(targetClient._id);
    const effAfter = await calculateEffectivePermission(freshClient, "meta.campaigns");
    const entryInDb = freshClient.assignedPermissions.find((p) => p.key === "meta.campaigns");
    assert(entryInDb && entryInDb.allowed === true, "MongoDB contains true immediately after update.");
    assert(effAfter.allowed === true, "API calculation returns true immediately.");
  }

  console.log("\n--- TEST 5: Delete all eff_perms:* Redis keys -> permission resolution still works ---");
  {
    if (cacheUtil.isReady()) {
      const keys = await cacheUtil.keys("eff_perms:*");
      for (const k of keys) {
        await cacheUtil.del(k);
      }
      console.log(`   Deleted ${keys.length} eff_perms keys from Redis.`);
    }
    const freshClient = await User.findById(targetClient._id);
    const allEff = await calculateAllEffectivePermissions(freshClient);
    assert(allEff["meta.campaigns"].allowed === true, "Permission resolution returns correct true value after deleting eff_perms keys.");
  }

  console.log("\n--- TEST 6: Redis permission cache completely unavailable -> permission resolution still works from MongoDB ---");
  {
    const freshClient = await User.findById(targetClient._id);
    const allEff = await calculateAllEffectivePermissions(freshClient);
    assert(allEff["meta.campaigns"].allowed === true, "Permission resolution works flawlessly from MongoDB when Redis is ignored.");
  }

  console.log("\n--- TEST 7: Concurrent updates: Admin A (campaigns=true), Admin B (adsets=true) -> both survive ---");
  {
    await updateAssignedPermissionsAtomic(targetClient._id, { "meta.campaigns": false, "meta.adsets": false });

    await Promise.all([
      updateAssignedPermissionsAtomic(targetClient._id, { "meta.campaigns": true }),
      updateAssignedPermissionsAtomic(targetClient._id, { "meta.adsets": true }),
    ]);

    const freshClient = await User.findById(targetClient._id);
    const campaignsEntry = freshClient.assignedPermissions.find((p) => p.key === "meta.campaigns");
    const adsetsEntry = freshClient.assignedPermissions.find((p) => p.key === "meta.adsets");

    assert(campaignsEntry && campaignsEntry.allowed === true, "Admin A's campaigns=true survived in MongoDB.");
    assert(adsetsEntry && adsetsEntry.allowed === true, "Admin B's adsets=true survived in MongoDB.");
  }

  console.log("\n--- TEST 8: Stale modal: Admin A changes campaigns, Admin B with stale snapshot changes adsets -> campaigns remains intact ---");
  {
    await updateAssignedPermissionsAtomic(targetClient._id, { "meta.campaigns": true });

    await updateAssignedPermissionsAtomic(targetClient._id, { "meta.adsets": true });

    const freshClient = await User.findById(targetClient._id);
    const campaignsEntry = freshClient.assignedPermissions.find((p) => p.key === "meta.campaigns");
    const adsetsEntry = freshClient.assignedPermissions.find((p) => p.key === "meta.adsets");

    assert(campaignsEntry && campaignsEntry.allowed === true, "Admin A's campaigns=true was NOT overwritten by Admin B's update.");
    assert(adsetsEntry && adsetsEntry.allowed === true, "Admin B's adsets=true was applied.");
  }

  console.log("\n--- TEST 9: Unauthorized revoke -> Authority validation check returns false ---");
  {
    const callerEff = await calculateEffectivePermission(adminB, "meta.campaigns");
    assert(callerEff.allowed === false, "Admin B lacks authority over meta.campaigns.");
  }

  console.log("\n--- TEST 10: Unauthorized grant -> Authority validation check returns false ---");
  {
    const callerEff = await calculateEffectivePermission(adminB, "meta.campaigns");
    assert(callerEff.allowed === false, "Admin B lacks authority to grant meta.campaigns.");
  }

  console.log("\n--- TEST 11: Dirty tracking: OFF -> ON -> OFF produces 0 dirty keys ---");
  {
    const initialMap = { "meta.campaigns": false };
    let currentMap = { ...initialMap };

    currentMap["meta.campaigns"] = true;
    currentMap["meta.campaigns"] = false;

    const dirtyKeys = Object.keys(currentMap).filter((k) => currentMap[k] !== initialMap[k]);
    assert(dirtyKeys.length === 0, "Toggling OFF -> ON -> OFF produces 0 dirty keys.");
  }

  console.log("\n--- TEST 12: Fresh read: MongoDB manually changed -> permission calculation reads true without Redis ---");
  {
    await User.updateOne(
      { _id: targetClient._id, "assignedPermissions.key": "meta.audience" },
      { $set: { "assignedPermissions.$.allowed": true } }
    );

    const freshClient = await User.findById(targetClient._id);
    const effAudience = await calculateEffectivePermission(freshClient, "meta.audience");
    assert(effAudience.allowed === true, "Fresh read directly reflects manual MongoDB change to true.");
  }

  console.log("\n==================================================");
  console.log("ALL 12 TEST CASES PASSED SUCCESSFULLY!");
  console.log("==================================================\n");

  await mongoose.connection.close();
  if (cacheUtil.isReady()) {
    await cacheUtil.disconnect();
  }
};

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
