const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
const dotenv = require("dotenv");
dotenv.config();

const facebookAdapter = require("../adapters/facebook.adapter");

async function testCampaignDetails() {
  try {
    console.log("=== FETCHING CAMPAIGNS LIST ===");
    const campaigns = await facebookAdapter.fetchCampaigns({
      activeMetaAccount: "359804707990884",
      datePreset: "last_7d",
    });

    console.log(`Found ${campaigns.length} campaigns`);
    if (campaigns.length > 0) {
      const targetCampaign = campaigns[0];
      const targetId = targetCampaign.campaign_id || targetCampaign.id || targetCampaign.campaign;
      console.log("Testing fetchCampaignDetails for campaign ID:", targetId);

      const details = await facebookAdapter.fetchCampaignDetails({
        activeMetaAccount: "359804707990884",
        campaignId: targetId,
        datePreset: "last_7d",
      });

      console.log("=== CAMPAIGN DETAILS RESULT ===");
      console.log("Campaign:", details.campaign);
      console.log(`AdSets count: ${details.adSets.length}`);
      console.log(`Creatives count: ${details.creatives.length}`);
      console.log("Performance summary:", details.performance);
    }
  } catch (err) {
    console.error("Error testing campaign details:", err);
  }
}

testCampaignDetails();
