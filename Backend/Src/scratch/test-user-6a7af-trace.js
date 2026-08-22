const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);
require("dotenv").config();

const mongoose = require("mongoose");
const connectDB = require("../config/db");
const User = require("../models/user.model");
const { calculateEffectivePermission } = require("../utils/permission-calculator.util");

const traceUser = async () => {
  await connectDB();
  const userId = "6a7af82ba42501fa04e118e9";
  
  console.log("=== TRACING USER 6a7af82ba42501fa04e118e9 ===");

  // 1. Without assignedPermissions in select (OLD query in getAllClients)
  const userWithoutSelect = await User.findById(userId)
    .select("name email role status organizationId assignedClientId shopifyEnabled attributionEnabled isRootAdmin lastActiveAt createdAt")
    .lean();

  console.log("\n1. User object WITHOUT assignedPermissions in select:");
  console.log("   user._id:", userWithoutSelect?._id);
  console.log("   user.assignedPermissions:", userWithoutSelect?.assignedPermissions);
  console.log("   typeof user.assignedPermissions:", typeof userWithoutSelect?.assignedPermissions);
  const effWithout = await calculateEffectivePermission(userWithoutSelect, "meta.campaigns");
  console.log("   Effective meta.campaigns (without select):", effWithout);

  // 2. WITH assignedPermissions in select (NEW query)
  const userWithSelect = await User.findById(userId)
    .select("name email role status organizationId assignedClientId shopifyEnabled attributionEnabled isRootAdmin lastActiveAt createdAt assignedPermissions")
    .lean();

  console.log("\n2. User object WITH assignedPermissions in select:");
  console.log("   user._id:", userWithSelect?._id);
  console.log("   user.assignedPermissions (sample 3):", Array.isArray(userWithSelect?.assignedPermissions) ? userWithSelect.assignedPermissions.slice(0, 3) : userWithSelect?.assignedPermissions);
  console.log("   typeof user.assignedPermissions:", typeof userWithSelect?.assignedPermissions);
  console.log("   Array.isArray(user.assignedPermissions):", Array.isArray(userWithSelect?.assignedPermissions));

  const matchingEntry = Array.isArray(userWithSelect?.assignedPermissions)
    ? userWithSelect.assignedPermissions.find((p) => p && p.key === "meta.campaigns")
    : null;
  console.log("   matchingPermission object for meta.campaigns:", matchingEntry);
  console.log("   extracted allowed value:", matchingEntry ? Boolean(matchingEntry.allowed) : null);

  const effWith = await calculateEffectivePermission(userWithSelect, "meta.campaigns");
  console.log("   Effective meta.campaigns (with select):", effWith);

  await mongoose.connection.close();
};

traceUser().catch(console.error);
