const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
const dotenv = require("dotenv");
dotenv.config();

const facebookAdapter = require("../adapters/facebook.adapter");

async function inspectWindsorRows() {
  try {
    const activeMetaAccount = "359804707990884"; // or default test account
    console.log("=== STEP 1: FETCH CAMPAIGNS ===");
    const campaigns = await facebookAdapter.fetchCampaigns({
      activeMetaAccount,
      datePreset: "last_7d",
    });

    console.log(`Found ${campaigns.length} campaigns`);
    campaigns.forEach((c, idx) => {
      console.log(`[${idx}] ID: ${c.campaign_id || c.id} | Name: ${c.campaign || c.name}`);
    });

    // Find campaign matching "VM (Prev ATCO)" or first campaign
    const targetCampaign = campaigns.find(c => (c.campaign || c.name || "").includes("VM (Prev ATCO)")) || campaigns[0];
    if (!targetCampaign) {
      console.log("No campaign found.");
      return;
    }

    const campaignId = String(targetCampaign.campaign_id || targetCampaign.id || targetCampaign.campaign);
    console.log("\n=== STEP 2: INSPECT ADSETS FOR CAMPAIGN:", campaignId, "| Name:", targetCampaign.campaign);

    const rawAdsets = await facebookAdapter.fetchAdsets({
      activeMetaAccount,
      datePreset: "last_30d",
      campaignId,
    });

    console.log(`\nRaw fetchAdsets returned ${rawAdsets.length} rows`);
    rawAdsets.forEach((row, idx) => {
      console.log(`Row [${idx}]: adset_id=${row.adset_id || row.id}, adset_name=${row.adset_name || row.name}, spend=${row.spend}, impressions=${row.impressions}, reach=${row.reach}, clicks=${row.clicks}, status=${row.adset_status || row.effective_status}`);
    });

    // Check unique adset_ids
    const adsetIdCounts = {};
    rawAdsets.forEach(row => {
      const id = String(row.adset_id || row.id);
      adsetIdCounts[id] = (adsetIdCounts[id] || 0) + 1;
    });
    console.log("\nAdSet ID Frequencies:", adsetIdCounts);

  } catch (err) {
    if (err.response) {
      console.error("Windsor Response Error Data:", err.response.data);
    }
    console.error("Error inspecting Windsor rows:", err.message);
  }
}

inspectWindsorRows();
