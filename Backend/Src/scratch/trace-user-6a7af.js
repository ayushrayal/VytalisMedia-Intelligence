const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);
require("dotenv").config();

const connectDB = require("../config/db");
const User = require("../models/user.model");
const Organization = require("../models/organization.model");
const AdminAssignment = require("../models/admin-assignment.model");
const GlobalSettings = require("../models/global-settings.model");
const cacheUtil = require("../utils/cache.util");
const {
  calculateEffectivePermission,
  calculateAllEffectivePermissions,
} = require("../utils/permission-calculator.util");

async function traceUser6a7af82ba42501fa04e118e9() {
  console.log("=== STEP 1: ENVIRONMENT CONFIGURATION ===");
  console.log("MONGODB_URI:", process.env.MONGODB_URI ? process.env.MONGODB_URI.replace(/:([^@]+)@/, ":****@") : "UNDEFINED");
  console.log("REDIS_URL:", process.env.REDIS_URL ? process.env.REDIS_URL.replace(/:([^@]+)@/, ":****@") : "UNDEFINED");
  console.log("NODE_ENV:", process.env.NODE_ENV || "development");
  console.log("PORT:", process.env.PORT || 5000);

  await connectDB();
  await cacheUtil.connect();

  const userId = "6a7af82ba42501fa04e118e9";
  console.log("\n=== STEP 3: TRACE THIS EXACT USER ===");
  const user = await User.findById(userId);
  if (!user) {
    console.log("User 6a7af82ba42501fa04e118e9 NOT FOUND in MongoDB!");
    process.exit(1);
  }

  console.log("User ID:", user._id);
  console.log("User Name:", user.name);
  console.log("User Email:", user.email);
  console.log("User Role:", user.role);
  console.log("User isRootAdmin:", Boolean(user.isRootAdmin));
  console.log("User Status:", user.status);
  console.log("User OrganizationId:", user.organizationId);
  console.log("User AssignedClientId:", user.assignedClientId);

  const entry = user.assignedPermissions.find((p) => p && p.key === "meta.campaigns");
  console.log("MongoDB assignedPermissions entry for meta.campaigns:", JSON.stringify(entry));

  console.log("\n=== STEP 7: CHECK ALL REDIS KEYS & VERSIONS FOR THIS USER ===");
  const userVer = (await cacheUtil.get(`perm_ver:user:${userId}`)) || 1;
  const orgVer = user.organizationId ? (await cacheUtil.get(`perm_ver:org:${user.organizationId}`)) || 1 : 1;
  const globalVer = (await cacheUtil.get("perm_ver:global")) || 1;

  console.log(`Version Counters -> perm_ver:user:${userId} =`, userVer);
  console.log(`Version Counters -> perm_ver:org:${user.organizationId} =`, orgVer);
  console.log("Version Counters -> perm_ver:global =", globalVer);

  const activeKey = `eff_perms:${userId}:u${userVer}:o${orgVer}:g${globalVer}`;
  console.log("Active expected Redis Key:", activeKey);
  const activeCachedVal = await cacheUtil.get(activeKey);
  console.log("Active Cached Value in Redis:", activeCachedVal ? activeCachedVal["meta.campaigns"] : "MISSING (CACHE MISS)");

  const staleKey = "eff_perms:6a7af82ba42501fa04e118e9:u3:o3:g1";
  const staleCachedVal = await cacheUtil.get(staleKey);
  console.log(`Stale Key (${staleKey}) Value in Redis:`, staleCachedVal ? staleCachedVal["meta.campaigns"] : "MISSING/EXPIRED");

  // Check TTL of stale key if client allows or read raw keys
  console.log("\n=== STEP 5: TRACE CACHE MISS STEP-BY-STEP FOR meta.campaigns ===");
  
  // Step 5A: getAssignedPermissionValue test
  const getAssignedPermissionValue = (u, permissionKey) => {
    if (!u || !u.assignedPermissions) return false;
    const perms = u.assignedPermissions;
    if (Array.isArray(perms)) {
      const e = perms.find((p) => p && p.key === permissionKey);
      return e ? Boolean(e.allowed) : false;
    }
    return false;
  };
  const assignedVal = getAssignedPermissionValue(user, "meta.campaigns");
  console.log("1. MongoDB assigned value for meta.campaigns:", entry ? entry.allowed : "N/A");
  console.log("2. getAssignedPermissionValue result:", assignedVal);

  // Step 5B: Organization Resolution
  let org = null;
  if (user.organizationId) {
    org = await Organization.findById(user.organizationId).lean();
  }
  console.log("3. Organization doc found:", org ? { id: org._id, name: org.name, status: org.status } : "NONE");

  // Step 5C: Supervising Admin Resolution (for Client role)
  let adminUser = null;
  if (user.role === "client" && org) {
    const activeAssignment = await AdminAssignment.findOne({ organizationId: org._id, status: "active" }).lean();
    console.log("4. AdminAssignment found for org:", activeAssignment);
    if (activeAssignment && activeAssignment.adminId) {
      adminUser = await User.findById(activeAssignment.adminId).lean();
    }
  }
  console.log("5. Supervising Admin found:", adminUser ? { id: adminUser._id, email: adminUser.email, role: adminUser.role } : "NONE");

  if (adminUser) {
    const adminEff = await calculateEffectivePermission(adminUser, "meta.campaigns");
    console.log("6. Supervising Admin effective permission for meta.campaigns:", adminEff);
  }

  // Step 5D: Global Denied Check
  const globalSettings = await GlobalSettings.findOne({}).lean();
  const globalDenied = globalSettings?.globalDeniedPermissions || [];
  console.log("7. Global Denied Permissions:", globalDenied);

  // Step 5E: Direct calculateEffectivePermission result
  const directEff = await calculateEffectivePermission(user, "meta.campaigns", { skipCacheLookup: true });
  console.log("8. Direct calculateEffectivePermission result:", directEff);

  // Step 5F: Calculate all effective permissions (bypassing cache)
  const allEff = await calculateAllEffectivePermissions(user, { skipCacheLookup: true });
  console.log("9. calculateAllEffectivePermissions (skipCache) for meta.campaigns:", allEff["meta.campaigns"]);

  process.exit(0);
}

traceUser6a7af82ba42501fa04e118e9().catch((err) => {
  console.error("Trace Error:", err);
  process.exit(1);
});
