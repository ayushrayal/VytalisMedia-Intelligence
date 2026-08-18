const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });

const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const { fetchCreatives } = require("../adapters/facebook.adapter");
const { aggregateCreativesData } = require("../../../Frontend/src/features/meta/utils/creativeAggregator");

const isCreativeVideo = (row) => {
  if (!row) return false;

  // 1. Explicit type/media_type field if provided by API/adapter
  const typeStr = String(row.media_type || row.creative_type || row.type || "").toLowerCase();
  if (typeStr === "video" || typeStr === "video_inline") return true;
  if (typeStr === "image" || typeStr === "photo" || typeStr === "static") return false;

  // 2. Presence of video_id or video_url metadata
  const vId = row.video_id || row.videoId;
  if (vId !== null && vId !== undefined && String(vId).trim() !== "" && String(vId) !== "null" && String(vId) !== "undefined") {
    return true;
  }

  const vUrl = row.video_url || row.videoUrl;
  if (vUrl !== null && vUrl !== undefined && String(vUrl).trim() !== "" && String(vUrl) !== "null" && String(vUrl) !== "undefined") {
    return true;
  }

  // 3. Inspect object_story_spec if available
  if (row.object_story_spec) {
    const specStr = typeof row.object_story_spec === "string" 
      ? row.object_story_spec 
      : JSON.stringify(row.object_story_spec);
    if (specStr.toLowerCase().includes("video_data") || specStr.toLowerCase().includes("video_id")) {
      return true;
    }
  }

  // 4. Explicit name keywords
  const nameStr = String(row.ad_name || row.creative_name || row.name || "").toLowerCase();
  if (nameStr.includes("static") || nameStr.includes("image") || nameStr.includes("photo") || nameStr.includes("banner")) {
    return false;
  }

  if (
    nameStr.includes("video") ||
    nameStr.includes(".mp4") ||
    nameStr.includes("reels") ||
    nameStr.includes("reel") ||
    nameStr.includes("short")
  ) {
    return true;
  }

  return false;
};

const testAllCards = async () => {
  const activeMetaAccount = "359804707990884";
  const rawRecords = await fetchCreatives({ activeMetaAccount, datePreset: "last_30d" });
  const aggregatedRecords = aggregateCreativesData(rawRecords, false);

  console.log("Checking isCreativeVideo classification for all 32 creative cards:\n");

  aggregatedRecords.forEach((cr, idx) => {
    const isVid = isCreativeVideo(cr);
    console.log(`Card #${idx + 1}: [${isVid ? "VIDEO " : "STATIC"}] - "${cr.ad_name}" (video_id: ${cr.video_id})`);
  });

  process.exit(0);
};

testAllCards();
