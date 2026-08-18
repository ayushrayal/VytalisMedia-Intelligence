const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });

const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const { fetchCreatives } = require("../adapters/facebook.adapter");
const { aggregateCreativesData } = require("../../../Frontend/src/features/meta/utils/creativeAggregator");

const testSpecBug = async () => {
  const activeMetaAccount = "359804707990884";
  const rawRecords = await fetchCreatives({ activeMetaAccount, datePreset: "last_30d" });
  const aggregatedRecords = aggregateCreativesData(rawRecords, false);

  aggregatedRecords.forEach((cr, idx) => {
    if (cr.ad_name.includes("Static")) {
      console.log(`Static Ad Card #${idx + 1}: "${cr.ad_name}"`);
      console.log(`video_id: ${JSON.stringify(cr.video_id)}`);
      const spec = cr.object_story_spec;
      console.log(`object_story_spec: ${JSON.stringify(spec)}`);
      const specStr = typeof spec === "string" ? spec : JSON.stringify(spec);
      console.log(`specStr includes "video": ${specStr.toLowerCase().includes("video")}`);
      console.log(`specStr includes "video_id": ${specStr.toLowerCase().includes("video_id")}`);
      console.log(`specStr includes "video_data": ${specStr.toLowerCase().includes("video_data")}`);
    }
  });

  process.exit(0);
};

testSpecBug();
