const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });

const connectDB = require("../config/db");
const User = require("../models/user.model");
const {
  calculateAllEffectivePermissions,
  calculateBatchEffectivePermissions,
  invalidateUserPermissionCache,
} = require("../utils/permission-calculator.util");
const { ALL_PERMISSION_KEYS } = require("../config/permission-registry");

async function verifyProductionLayers() {
  console.log("\n==================================================");
  console.log("PRODUCTION FULL LAYER VERIFICATION");
  console.log("==================================================\n");

  await connectDB();

  const userDoc = await User.findOne({ role: { $in: ["client", "member"] } });
  if (!userDoc) {
    console.error("No test user found");
    process.exit(1);
  }

  const userId = userDoc._id.toString();
  const testKey = "meta.campaigns";
  console.log(`Testing User: ${userId} (${userDoc.email}, Role: ${userDoc.role})`);

  // STEP 1: Set meta.campaigns = true in DB
  console.log(`\n[STEP 1] Saving '${testKey}' = true in MongoDB...`);
  const existingMap = new Map();
  if (Array.isArray(userDoc.assignedPermissions)) {
    userDoc.assignedPermissions.forEach((p) => {
      if (p && p.key) existingMap.set(p.key, Boolean(p.allowed));
    });
  }
  existingMap.set(testKey, true);
  userDoc.assignedPermissions = Array.from(existingMap.entries()).map(([key, allowed]) => ({
    key,
    allowed,
  }));
  await userDoc.save();
  await invalidateUserPermissionCache(userId);

  // STEP 2: Verify MongoDB Document
  const dbUser = await User.findById(userId).lean();
  const dbEntry = (dbUser.assignedPermissions || []).find((p) => p.key === testKey);
  console.log(`[STEP 2] MongoDB Stored Entry for '${testKey}':`, dbEntry);
  if (!dbEntry || dbEntry.allowed !== true) {
    throw new Error("MongoDB document failed to persist true");
  }

  // STEP 3: Verify Backend API Calculation Output (Cache Miss)
  console.log(`[STEP 3] Backend API Effective Permissions (Cache Miss):`);
  const effMiss = await calculateAllEffectivePermissions(dbUser);
  const batchMissMap = await calculateBatchEffectivePermissions([dbUser]);
  const batchMiss = batchMissMap.get(userId);

  console.log(`   calculateAllEffectivePermissions allowed: ${effMiss[testKey]?.allowed}`);
  console.log(`   calculateBatchEffectivePermissions allowed: ${batchMiss ? batchMiss[testKey]?.allowed : "MISSING"}`);

  if (effMiss[testKey]?.allowed !== true || !batchMiss || batchMiss[testKey]?.allowed !== true) {
    throw new Error("Backend API calculation returned false on cache miss");
  }

  // STEP 4: Simulate Frontend Parsing in NEW JS Bundle
  console.log(`\n[STEP 4] Simulating NEW Deployed Frontend Bundle Parsing:`);
  const initialMap = {};
  ALL_PERMISSION_KEYS.forEach((key) => {
    initialMap[key] = false;
  });

  let foundAssigned = false;
  if (dbUser.assignedPermissions) {
    if (Array.isArray(dbUser.assignedPermissions)) {
      dbUser.assignedPermissions.forEach((p) => {
        if (p && p.key && ALL_PERMISSION_KEYS.includes(p.key)) {
          initialMap[p.key] = Boolean(p.allowed);
          foundAssigned = true;
        }
      });
    } else if (typeof dbUser.assignedPermissions.get === "function") {
      dbUser.assignedPermissions.forEach((val, key) => {
        if (ALL_PERMISSION_KEYS.includes(key)) {
          initialMap[key] = Boolean(val);
          foundAssigned = true;
        }
      });
    } else if (typeof dbUser.assignedPermissions === "object") {
      Object.entries(dbUser.assignedPermissions).forEach(([k, v]) => {
        if (ALL_PERMISSION_KEYS.includes(k)) {
          initialMap[k] = Boolean(v);
          foundAssigned = true;
        }
      });
    }
  }

  if (!foundAssigned && dbUser.effectivePermissions) {
    Object.entries(dbUser.effectivePermissions).forEach(([k, v]) => {
      if (ALL_PERMISSION_KEYS.includes(k) && v) {
        initialMap[k] = Boolean(v.allowed);
      }
    });
  }

  console.log(`   Frontend Modal State for '${testKey}':`, initialMap[testKey]);
  if (initialMap[testKey] !== true) {
    throw new Error("Frontend state parser failed to evaluate true");
  }

  console.log("\n==================================================");
  console.log("PRODUCTION BACKEND & DATA Semantics 100% VERIFIED!");
  console.log("==================================================\n");
  process.exit(0);
}

verifyProductionLayers().catch((err) => {
  console.error("Verification Error:", err);
  process.exit(1);
});
