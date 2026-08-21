const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });

const connectDB = require("../config/db");
const User = require("../models/user.model");
const Organization = require("../models/organization.model");
const AdminAssignment = require("../models/admin-assignment.model");
const cacheUtil = require("../utils/cache.util");
const {
  calculateEffectivePermission,
  calculateBatchEffectivePermissions,
} = require("../utils/permission-calculator.util");

async function traceCacheMiss() {
  console.log("\n==================================================");
  console.log("TRACE CACHE MISS PATH FOR CLIENT / MEMBER USER");
  console.log("==================================================\n");
  await connectDB();

  // Find a client/member user with assignedPermissions in DB
  const userDoc = await User.findOne({
    role: { $in: ["client", "member"] },
    "assignedPermissions.0": { $exists: true },
  });

  if (!userDoc) {
    console.log("No client/member user found with assignedPermissions in DB");
    process.exit(1);
  }

  const userObj = userDoc.toObject();
  console.log(`User ID: ${userObj._id}, Role: ${userObj.role}, Email: ${userObj.email}`);
  console.log("Raw MongoDB assignedPermissions sample:", JSON.stringify(userObj.assignedPermissions.slice(0, 5), null, 2));

  // Calculate single effective permission directly (bypassing Redis batch)
  console.log("\n--- Testing calculateEffectivePermission directly ---");
  for (const entry of userObj.assignedPermissions.slice(0, 5)) {
    const key = entry.key;
    const eff = await calculateEffectivePermission(userObj, key);
    console.log(`Key: '${key}', Stored allowed in DB: ${entry.allowed}, calculateEffectivePermission: ${eff.allowed}, source: ${eff.source}, reason: ${eff.reason}`);
  }

  // Test calculateBatchEffectivePermissions ON CACHE MISS
  console.log("\n--- Testing calculateBatchEffectivePermissions (Cache Miss) ---");
  const batchResult = await calculateBatchEffectivePermissions([userObj]);
  const userBatchPerms = batchResult.get(String(userObj._id));
  console.log("batchResult map returned for user:", userBatchPerms ? "FOUND" : "NOT FOUND");

  if (userBatchPerms) {
    for (const entry of userObj.assignedPermissions.slice(0, 5)) {
      const key = entry.key;
      const bRes = userBatchPerms[key];
      console.log(`Key: '${key}', Batch allowed: ${bRes ? bRes.allowed : "MISSING"}, source: ${bRes ? bRes.source : "N/A"}, reason: ${bRes ? bRes.reason : "N/A"}`);
    }
  }

  process.exit(0);
}

traceCacheMiss().catch((err) => {
  console.error("Trace Failure:", err);
  process.exit(1);
});
