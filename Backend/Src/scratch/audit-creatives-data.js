const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });

const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const { fetchCreatives } = require("../adapters/facebook.adapter");
const { aggregateCreativesData } = require("../../../Frontend/src/features/meta/utils/creativeAggregator");

const inspectAllCreatives = async () => {
  try {
    const activeMetaAccount = "359804707990884";
    const rawRecords = await fetchCreatives({ activeMetaAccount, datePreset: "last_30d" });
    const aggregatedRecords = aggregateCreativesData(rawRecords, false);

    console.log(`Total aggregated creative cards: ${aggregatedRecords.length}\n`);

    aggregatedRecords.forEach((cr, idx) => {
      console.log(`=== CARD #${idx + 1} ===`);
      console.log(`ad_name: "${cr.ad_name}"`);
      console.log(`creative_name: "${cr.creative_name}"`);
      console.log(`media_type: ${JSON.stringify(cr.media_type)}`);
      console.log(`creative_type: ${JSON.stringify(cr.creative_type)}`);
      console.log(`type: ${JSON.stringify(cr.type)}`);
      console.log(`video_id: ${JSON.stringify(cr.video_id)}`);
      console.log(`video_url: ${JSON.stringify(cr.video_url)}`);
      console.log(`image_url: ${JSON.stringify(cr.image_url ? cr.image_url.slice(0, 40) + "..." : null)}`);
      console.log(`thumbnail_url: ${JSON.stringify(cr.thumbnail_url ? cr.thumbnail_url.slice(0, 40) + "..." : null)}`);
      console.log(`object_story_spec keys: ${cr.object_story_spec ? Object.keys(cr.object_story_spec) : "null"}`);
      if (cr.object_story_spec) {
        console.log(`object_story_spec: ${JSON.stringify(cr.object_story_spec).slice(0, 100)}`);
      }
      console.log("-----------------------------------\n");
    });

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

inspectAllCreatives();
