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

async function testPermissionsSequence() {
  console.log("=== REPRODUCING & TESTING PERMISSION SAVE & READ SEQUENCE ===");
  await connectDB();

  const testUser = await User.findOne({ role: "client" });
  if (!testUser) {
    console.log("No client user found");
    process.exit(1);
  }

  console.log(`Target User: ${testUser._id} (${testUser.email})`);

  // Step A: Read initial permissions
  const initialPerms = await calculateAllEffectivePermissions(testUser);
  console.log("Initial dashboard.view allowed:", initialPerms["dashboard.view"]?.allowed);

  // Step B: Toggle dashboard.view ON -> Save to MongoDB & Invalidate Cache
  const existingMap = new Map();
  if (Array.isArray(testUser.assignedPermissions)) {
    testUser.assignedPermissions.forEach((p) => {
      if (p && p.key) existingMap.set(p.key, Boolean(p.allowed));
    });
  }

  const newTargetState = !(existingMap.get("dashboard.view") || false);
  console.log(`Toggling dashboard.view to: ${newTargetState}`);

  existingMap.set("dashboard.view", newTargetState);
  testUser.assignedPermissions = Array.from(existingMap.entries()).map(([key, allowed]) => ({
    key,
    allowed,
  }));

  await testUser.save();
  await invalidateUserPermissionCache(testUser._id);

  // Step C: Re-read user from DB and check MongoDB document
  const refreshedUser = await User.findById(testUser._id).lean();
  console.log("Refreshed User assignedPermissions from DB:", refreshedUser.assignedPermissions);

  const entryInDb = refreshedUser.assignedPermissions.find((p) => p.key === "dashboard.view");
  console.log("MongoDB entry for dashboard.view:", entryInDb);

  // Step D: Calculate permissions again (checking Redis cache invalidation)
  const updatedPerms = await calculateAllEffectivePermissions(refreshedUser);
  console.log("Updated dashboard.view allowed from backend calculation:", updatedPerms["dashboard.view"]?.allowed);

  // Step E: Simulate Frontend Parsing in UserPermissionsModal
  console.log("\nSimulating Frontend Modal parsing of targetUser.assignedPermissions:");

  // OLD BROKEN FRONTEND LOGIC (Missing Array.isArray check)
  const oldFrontendMap = {};
  if (refreshedUser.assignedPermissions) {
    if (typeof refreshedUser.assignedPermissions.get === "function") {
      refreshedUser.assignedPermissions.forEach((val, key) => {
        oldFrontendMap[key] = Boolean(val);
      });
    } else if (typeof refreshedUser.assignedPermissions === "object") {
      Object.entries(refreshedUser.assignedPermissions).forEach(([k, v]) => {
        oldFrontendMap[k] = Boolean(v);
      });
    }
  }
  console.log("OLD FRONTEND PARSED MAP for dashboard.view:", oldFrontendMap["dashboard.view"]);

  // NEW FIXED FRONTEND LOGIC (With Array.isArray check)
  const newFrontendMap = {};
  if (refreshedUser.assignedPermissions) {
    if (Array.isArray(refreshedUser.assignedPermissions)) {
      refreshedUser.assignedPermissions.forEach((p) => {
        if (p && p.key) newFrontendMap[p.key] = Boolean(p.allowed);
      });
    } else if (typeof refreshedUser.assignedPermissions.get === "function") {
      refreshedUser.assignedPermissions.forEach((val, key) => {
        newFrontendMap[key] = Boolean(val);
      });
    } else if (typeof refreshedUser.assignedPermissions === "object") {
      Object.entries(refreshedUser.assignedPermissions).forEach(([k, v]) => {
        newFrontendMap[k] = Boolean(v);
      });
    }
  }
  console.log("NEW FIXED FRONTEND PARSED MAP for dashboard.view:", newFrontendMap["dashboard.view"]);

  process.exit(0);
}

testPermissionsSequence();
