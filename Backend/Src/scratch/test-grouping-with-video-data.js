const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });

const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const { fetchCreatives } = require("../adapters/facebook.adapter");

const getCreativeGroupKey = (record) => {
  if (!record) return "creative";

  const creativeId = record.creative_id || record.creativeId;
  if (
    creativeId !== null &&
    creativeId !== undefined &&
    String(creativeId).trim() !== "" &&
    String(creativeId) !== "null" &&
    String(creativeId) !== "undefined"
  ) {
    return `creative_${String(creativeId).trim()}`;
  }

  const videoId = record.video_id || record.videoId || record.object_story_spec?.video_data?.video_id;
  if (
    videoId !== null &&
    videoId !== undefined &&
    String(videoId).trim() !== "" &&
    String(videoId) !== "null" &&
    String(videoId) !== "undefined"
  ) {
    return `video_${String(videoId).trim()}`;
  }

  const adId = record.ad_id || record.adId || record.id;
  if (
    adId !== null &&
    adId !== undefined &&
    String(adId).trim() !== "" &&
    String(adId) !== "null" &&
    String(adId) !== "undefined"
  ) {
    return `ad_${String(adId).trim()}`;
  }

  return "creative_fallback";
};

const aggregateWithVideoDataKey = (records) => {
  const grouped = new Map();
  for (const r of records) {
    const key = getCreativeGroupKey(r);
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(r);
  }

  const result = [];
  grouped.forEach((group, key) => {
    const totalSpend = group.reduce((sum, item) => sum + (Number(item.spend) || 0), 0);
    const primary = group[0];
    result.push({
      groupKey: key,
      ad_name: primary.ad_name,
      video_id: primary.video_id || primary.object_story_spec?.video_data?.video_id,
      facebook_permalink_url: group.find(g => g.facebook_permalink_url)?.facebook_permalink_url || null,
      instagram_permalink_url: group.find(g => g.instagram_permalink_url)?.instagram_permalink_url || null,
      recordCount: group.length,
      spend: Math.round(totalSpend * 100) / 100,
    });
  });
  return result;
};

const runTest = async () => {
  const activeMetaAccount = "359804707990884";
  const raw17 = await fetchCreatives({ activeMetaAccount, dateFrom: "2026-08-17", dateTo: "2026-08-17" });
  const agg = aggregateWithVideoDataKey(raw17);

  console.log(`=== AGGREGATED CREATIVE CARDS FOR 2026-08-17 (${agg.length} cards) ===\n`);
  agg.forEach((c, i) => {
    console.log(`Card #${i + 1}: name="${c.ad_name}", video_id=${c.video_id}, spend=${c.spend}, FB_url=${c.facebook_permalink_url ? "YES" : "NO"}, IG_url=${c.instagram_permalink_url ? "YES" : "NO"}`);
  });

  process.exit(0);
};

runTest();
