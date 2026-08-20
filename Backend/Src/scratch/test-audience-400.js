const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
const dotenv = require("dotenv");
dotenv.config();

const mongoose = require("mongoose");
const connectDB = require("../config/db");
const cacheUtil = require("../utils/cache.util");
const User = require("../models/user.model");
const metaAnalyticsService = require("../services/meta-analytics.service");
const facebookAdapter = require("../adapters/facebook.adapter");

const testAudience = async () => {
  try {
    await connectDB();
    await cacheUtil.connect();

    // Find any user with meta integration or activeMetaAccount
    const user = await User.findOne({ "preferences.activeMetaAccount": { $exists: true, $ne: null } });
    if (!user) {
      console.log("No user found with activeMetaAccount");
      process.exit(1);
    }

    console.log("Testing getAnalyticsData for endpoint 'audience' with user activeMetaAccount:", user.preferences.activeMetaAccount);

    // Bypass redis cache for raw test
    try {
      const res = await metaAnalyticsService.getAnalyticsData({
        user,
        endpoint: "audience",
        query: { datePreset: "last_7d" },
      });
      console.log("SUCCESS! Returned rows count:", res.data ? res.data.length : 0);
      if (res.data && res.data.length > 0) {
        console.log("Sample Row:", res.data[0]);
      }
    } catch (err) {
      console.error("EXACT ERROR CAUSING 400:");
      console.error("Status:", err.statusCode || err.status || err.response?.status);
      console.error("Message:", err.message);
      console.error("Error Response Data:", err.response?.data || err.data || err.cause || err.stack);
    }

  } catch (err) {
    console.error("Script error:", err);
  } finally {
    mongoose.connection.close();
    process.exit(0);
  }
};

testAudience();
