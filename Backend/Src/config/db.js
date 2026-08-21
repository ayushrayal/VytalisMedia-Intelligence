const mongoose = require("mongoose");

const User = require("../models/user.model");

const { getNextSequenceValue } = require("../models/counter.model");

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

const runRootAdminRankMigration = async () => {
  try {
    const unrankedRootAdmins = await User.find({
      $or: [{ role: "root_admin" }, { isRootAdmin: true }],
      rootAdminRank: { $eq: null },
    }).sort({ createdAt: 1 });

    if (unrankedRootAdmins.length > 0) {
      for (const rootAdmin of unrankedRootAdmins) {
        const nextRank = await getNextSequenceValue("rootAdminRank");
        rootAdmin.rootAdminRank = nextRank;
        await rootAdmin.save();
        console.log(`✅ Root Admin Rank Migration: Assigned rank #${nextRank} to Root Admin ${rootAdmin.email}`);
      }
    }
  } catch (err) {
    console.error("⚠️ Root Admin Rank Migration Error (non-fatal):", err.message);
  }
};

const connectDB = async () => {
  try {
    const options = {
      maxPoolSize: process.env.MONGODB_MAX_POOL_SIZE ? parseInt(process.env.MONGODB_MAX_POOL_SIZE, 10) : 25,
      minPoolSize: process.env.MONGODB_MIN_POOL_SIZE ? parseInt(process.env.MONGODB_MIN_POOL_SIZE, 10) : 5,
      maxIdleTimeMS: 30000,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };
    await mongoose.connect(process.env.MONGODB_URI, options);
    await runRbacMigration();
    await runRootAdminRankMigration();
  } catch (error) {
    console.error("❌ MongoDB Connection Failed");
    console.error(error.message);

    process.exit(1);
  }
};


module.exports = connectDB;