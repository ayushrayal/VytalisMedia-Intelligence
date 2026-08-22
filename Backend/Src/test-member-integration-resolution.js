const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
require("dotenv").config();

const connectDB = require("./config/db");
const User = require("./models/user.model");
const Organization = require("./models/organization.model");
const metaService = require("./services/meta.service");
const shopifyService = require("./services/shopify.service");
const { getEffectiveIntegrationContext } = require("./utils/integration-context.util");
const { calculateEffectivePermission } = require("./utils/permission-calculator.util");

const runMemberIntegrationSuite = async () => {
  try {
    console.log("Connecting DB...");
    await connectDB();

    console.log("\n==================================================");
    console.log("MEMBER -> CLIENT -> INTEGRATION RESOLUTION SUITE");
    console.log("==================================================");

    // 1. Load Nitish (Member)
    const nitish = await User.findOne({ email: "rawatji658@gmail.com" });
    if (!nitish) {
      console.error("Nitish Rawat (Member) not found");
      process.exit(1);
    }

    const clientWithMeta = await User.findOne({
      "integrations.meta.0": { $exists: true },
    });

    if (clientWithMeta) {
      nitish.role = "member";
      nitish.assignedClientId = clientWithMeta._id;
      if (clientWithMeta.organizationId) {
        nitish.organizationId = clientWithMeta.organizationId;
      }
      await nitish.save();
    }

    // Resolve Integration Context
    const { integrationUser, organization } = await getEffectiveIntegrationContext(nitish);

    console.log(`\n[CHECK 1-3] MEMBER RELATIONSHIP RESOLUTION:`);
    console.log(`   User ID: ${nitish._id}`);
    console.log(`   Role: ${nitish.role}`);
    console.log(`   assignedClientId: ${nitish.assignedClientId}`);
    console.log(`   Resolved Client ID: ${integrationUser?._id}`);
    console.log(`   Resolved Client Name: ${integrationUser?.name}`);
    console.log(`   Resolved Organization ID: ${organization?._id}`);

    if (integrationUser?._id.toString() !== nitish.assignedClientId.toString()) {
      throw new Error("Member assignedClientId resolution mismatch!");
    }
    console.log(`   -> MEMBER RESOLVES ASSIGNED CLIENT PERFECTLY!`);

    // 2. Resolve Meta Accounts for Member
    console.log(`\n[CHECK 4 & 6] MEMBER META ACCOUNTS RESOLUTION:`);
    const metaRes = await metaService.getAllMetaAccounts(nitish);
    console.log(`   Meta Accounts Count: ${metaRes.accounts.length}`);
    console.log(`   Active Meta Account: ${metaRes.activeMetaAccount}`);
    metaRes.accounts.forEach((acc, i) => {
      console.log(`     Account [${i+1}]: ID=${acc.accountId}, Name=${acc.accountName}`);
    });

    if (metaRes.accounts.length === 0) {
      throw new Error("Member returned 0 Meta accounts even though Client has connected accounts!");
    }
    console.log(`   -> GET /api/meta/accounts RESOLVES CLIENT CONNECTED ACCOUNTS!`);

    // 3. Resolve Shopify Accounts for Member
    console.log(`\n[CHECK 13] MEMBER SHOPIFY ACCOUNTS RESOLUTION:`);
    const shopifyRes = await shopifyService.getAllShopifyAccounts(nitish);
    console.log(`   Shopify Accounts Count: ${shopifyRes.accounts.length}`);
    console.log(`   Active Shopify Account: ${shopifyRes.activeShopifyAccount}`);
    shopifyRes.accounts.forEach((acc, i) => {
      console.log(`     Account [${i+1}]: Domain=${acc.accountName}, Shop=${acc.shopName}`);
    });

    const expectedShopifyCount = integrationUser.integrations?.shopify?.length || 0;
    if (shopifyRes.accounts.length !== expectedShopifyCount) {
      throw new Error(`Member returned ${shopifyRes.accounts.length} Shopify accounts, expected ${expectedShopifyCount}!`);
    }
    console.log(`   -> SHOPIFY USES SAME MEMBER -> CLIENT RESOLUTION PERFECTLY!`);

    // 4. Test Cross-Tenant Security & explicitOrgId Tamper Safeguard
    console.log(`\n[CHECK 10-12 & 14] CROSS-TENANT & TAMPER SAFEGUARD:`);
    const maliciousOrgId = "60a7de432083b6ed11b27d99"; // Fake org ID
    const tamperedContext = await getEffectiveIntegrationContext(nitish, maliciousOrgId);
    console.log(`   Explicit Org ID Supplied: ${maliciousOrgId}`);
    console.log(`   Context Resolved Client ID: ${tamperedContext.integrationUser?._id}`);
    if (tamperedContext.integrationUser?._id.toString() !== nitish.assignedClientId.toString()) {
      throw new Error("Security breach: Member was allowed to override assigned Client via explicitOrgId!");
    }
    console.log(`   -> SERVER STRICTLY FORCES MEMBER TO ASSIGNED CLIENT (TAMPER PROOF)!`);

    // 5. Test Effective Permission Control (ON vs OFF)
    console.log(`\n[CHECK 7 & 8] MEMBER EFFECTIVE PERMISSION CONTROLS:`);
    const permAudience = await calculateEffectivePermission(nitish, "meta.audience");
    console.log(`   meta.audience effective allowed: ${permAudience.allowed} (Reason: ${permAudience.reason})`);

    const mockDisabledMember = {
      ...nitish.toObject(),
      assignedPermissions: nitish.assignedPermissions.map(p => p.key === "meta.audience" ? { key: "meta.audience", allowed: false } : p)
    };
    const disabledAudience = await calculateEffectivePermission(mockDisabledMember, "meta.audience");
    console.log(`   meta.audience = false -> allowed: ${disabledAudience.allowed} (Expected: false)`);

    if (disabledAudience.allowed !== false) {
      throw new Error("Permission OFF for Member failed to deny access!");
    }
    console.log(`   -> EFFECTIVE PERMISSION CHECKS WORK SEPARATELY FROM ACCOUNT RESOLUTION!`);

    console.log("\n==================================================");
    console.log("ALL MEMBER INTEGRATION RESOLUTION CHECKS PASSED!");
    console.log("==================================================");
    process.exit(0);
  } catch (err) {
    console.error("SUITE FAILED:", err);
    process.exit(1);
  }
};

runMemberIntegrationSuite();
