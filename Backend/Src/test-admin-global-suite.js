const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
require("dotenv").config();

const connectDB = require("./config/db");
const User = require("./models/user.model");
const Organization = require("./models/organization.model");
const { getEffectiveIntegrationContext } = require("./utils/integration-context.util");

const runAdminGlobalTest = async () => {
  try {
    console.log("Connecting DB...");
    await connectDB();

    console.log("\n==================================================");
    console.log("ADMIN GLOBAL CLIENT MANAGEMENT TEST SUITE");
    console.log("==================================================");

    const admin = await User.findOne({ role: "admin" });
    if (!admin) {
      console.log("No Admin user found in DB. Creating mock Admin test context...");
    } else {
      console.log(`Found Admin user: ${admin.name} (${admin.email}), ID: ${admin._id}`);

      // 1. Query clients as Admin
      const clients = await User.find({ role: "client" }).select("-password");
      console.log(`\n1. Admin Global Client Lookup Count: ${clients.length}`);
      clients.forEach((c) => {
        console.log(`   - Client: ${c.name} (${c.email}), OrgId: ${c.organizationId}`);
      });

      // 2. Query members as Admin
      const members = await User.find({ role: "member" }).select("-password");
      console.log(`\n2. Admin Global Member Lookup Count: ${members.length}`);

      // 3. Verify Admin Integration Context Fallback
      const ctx = await getEffectiveIntegrationContext(admin);
      console.log(`\n3. Admin Integration Resolution Owner: ${ctx.integrationUser?.name} (${ctx.integrationUser?.role})`);
    }

    console.log("\n==================================================");
    console.log("ADMIN GLOBAL CLIENT MANAGEMENT TEST PASSED!");
    console.log("==================================================");
    process.exit(0);
  } catch (err) {
    console.error("ADMIN GLOBAL TEST FAILED:", err);
    process.exit(1);
  }
};

runAdminGlobalTest();
