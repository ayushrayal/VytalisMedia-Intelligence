const mongoose = require("mongoose");

const User = require("../models/user.model");

const runRbacMigration = async () => {
  try {
    const nonAdminResult = await User.updateMany(
      { role: { $ne: "admin" }, rbacMigrated: { $ne: true } },
      {
        $set: {
          role: "client",
          shopifyEnabled: false,
          attributionEnabled: false,
          rbacMigrated: true,
        },
      }
    );
    const adminResult = await User.updateMany(
      { role: "admin", rbacMigrated: { $ne: true } },
      {
        $set: {
          rbacMigrated: true,
        },
      }
    );
    if (nonAdminResult.modifiedCount > 0 || adminResult.modifiedCount > 0) {
      console.log(
        `✅ RBAC One-Time Migration: Processed ${nonAdminResult.modifiedCount} client(s) and ${adminResult.modifiedCount} admin(s).`
      );
    }
  } catch (err) {
    console.error("⚠️ RBAC Migration Error (non-fatal):", err.message);
  }
};

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    await runRbacMigration();
  } catch (error) {
    console.error("❌ MongoDB Connection Failed");
    console.error(error.message);

    process.exit(1);
  }
};

module.exports = connectDB;