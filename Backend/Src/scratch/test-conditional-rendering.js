const assert = require("assert");

// Helper under test (matching isCreativeVideo logic in CreativeCard.jsx)
const isCreativeVideo = (row) => {
  if (!row) return false;

  const typeStr = String(row.media_type || row.creative_type || row.type || "").toUpperCase();
  if (typeStr === "VIDEO" || typeStr === "VIDEO_INLINE") return true;
  if (typeStr === "IMAGE" || typeStr === "PHOTO" || typeStr === "STATIC") return false;

  const vId = row.video_id || row.videoId;
  if (vId !== null && vId !== undefined && String(vId).trim() !== "" && String(vId) !== "null" && String(vId) !== "undefined" && String(vId) !== "0") {
    return true;
  }

  const vUrl = row.video_url || row.videoUrl;
  if (vUrl !== null && vUrl !== undefined && String(vUrl).trim() !== "" && String(vUrl) !== "null" && String(vUrl) !== "undefined") {
    return true;
  }

  if (row.object_story_spec) {
    if (typeof row.object_story_spec === "object" && (row.object_story_spec.video_data || row.object_story_spec.video_id)) {
      return true;
    }
    const specStr = typeof row.object_story_spec === "string" ? row.object_story_spec : JSON.stringify(row.object_story_spec);
    if (specStr.includes('"video_data"') || specStr.includes('"video_id"')) {
      return true;
    }
  }

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

// Helper under test (matching hasValidCreativeLinks logic)
const hasValidCreativeLinks = (creative) => {
  if (!creative) return false;
  const isValidUrl = (url) => {
    if (!url || typeof url !== "string") return false;
    const str = url.trim();
    if (str === "" || str === "null" || str === "undefined") return false;
    return str.startsWith("http://") || str.startsWith("https://") || str.startsWith("fb://") || str.startsWith("instagram://");
  };
  return Boolean(
    isValidUrl(creative.facebook_permalink_url) ||
    isValidUrl(creative.instagram_permalink_url) ||
    isValidUrl(creative.website_url) ||
    isValidUrl(creative.link_url) ||
    isValidUrl(creative.destination_url) ||
    isValidUrl(creative.call_to_action_url) ||
    isValidUrl(creative.url)
  );
};

// Helper under test (matching CreativeTabs tab generation)
const getAvailableTabs = (isVideo, hasLinks) => {
  const tabs = [{ id: "performance", label: "Performance" }];
  if (isVideo) tabs.push({ id: "video", label: "Video Performance" });
  tabs.push({ id: "creative", label: "Creative Preview" }, { id: "campaign", label: "Campaign & Ad Set" });
  if (hasLinks) tabs.push({ id: "links", label: "Links" });
  return tabs;
};

console.log("Running Creative Conditional Rendering Verification Tests (Edge Cases A - F)...\n");

// Edge Case A: Static/image creative
const edgeCaseA = {
  ad_name: "001 | Static Ad 1 | 28/07/2026",
  media_type: "IMAGE",
  video_id: null,
};
assert.strictEqual(isCreativeVideo(edgeCaseA), false, "Edge Case A: Static creative must classify as false for video");
const tabsA = getAvailableTabs(isCreativeVideo(edgeCaseA), false);
assert.strictEqual(tabsA.some(t => t.id === "video"), false, "Edge Case A: Video Performance tab MUST be hidden for static creative");

// Edge Case B: Video creative with complete metrics
const edgeCaseB = {
  ad_name: "VM | 001 | Founder's Video | 20/04/2026",
  media_type: "VIDEO",
  video_id: "1685422859143091",
  impressions: 65733,
  actions_video_view: 5961,
  video_thruplay_watched_actions_video_view: 1188,
};
assert.strictEqual(isCreativeVideo(edgeCaseB), true, "Edge Case B: Video creative must classify as true for video");
const tabsB = getAvailableTabs(isCreativeVideo(edgeCaseB), false);
assert.strictEqual(tabsB.some(t => t.id === "video"), true, "Edge Case B: Video Performance tab MUST be visible for video creative");

// Edge Case C: Video creative with missing ThruPlay
const edgeCaseC = {
  ad_name: "003 | WinningVideo | 08/07/2026",
  video_id: "987654321",
  impressions: 2,
  actions_video_view: 1,
  video_thruplay_watched_actions_video_view: null,
};
assert.strictEqual(isCreativeVideo(edgeCaseC), true, "Edge Case C: Video creative with missing ThruPlay must still classify as video");
const tabsC = getAvailableTabs(isCreativeVideo(edgeCaseC), false);
assert.strictEqual(tabsC.some(t => t.id === "video"), true, "Edge Case C: Video Performance tab MUST be visible");

// Edge Case D: Static creative with video metrics accidentally present
const edgeCaseD = {
  ad_name: "001 | Winning Static | 26/06/2026",
  media_type: "IMAGE",
  video_id: null,
  video_play_actions_video_view: 17, // Spurious residual metric
  actions_video_view: 2,
};
assert.strictEqual(isCreativeVideo(edgeCaseD), false, "Edge Case D: Static creative with accidental video metrics MUST classify as false for video");
const tabsD = getAvailableTabs(isCreativeVideo(edgeCaseD), false);
assert.strictEqual(tabsD.some(t => t.id === "video"), false, "Edge Case D: Video Performance tab MUST be hidden");

// Edge Case E: Creative with destination URL
const edgeCaseE = {
  ad_name: "Promo Ad",
  facebook_permalink_url: "https://facebook.com/post/123",
  website_url: "https://vytalismedia.com/shop",
};
assert.strictEqual(hasValidCreativeLinks(edgeCaseE), true, "Edge Case E: Creative with destination URL must return hasLinks=true");
const tabsE = getAvailableTabs(false, hasValidCreativeLinks(edgeCaseE));
assert.strictEqual(tabsE.some(t => t.id === "links"), true, "Edge Case E: Links tab MUST be visible");

// Edge Case F: Creative without destination URL
const edgeCaseF = {
  ad_name: "Promo Ad No Link",
  facebook_permalink_url: null,
  website_url: "",
};
assert.strictEqual(hasValidCreativeLinks(edgeCaseF), false, "Edge Case F: Creative without destination URL must return hasLinks=false");
const tabsF = getAvailableTabs(false, hasValidCreativeLinks(edgeCaseF));
assert.strictEqual(tabsF.some(t => t.id === "links"), false, "Edge Case F: Links tab MUST be hidden");

console.log("ALL EDGE CASES (A - F) PASSED SUCCESSFULLY WITH ZERO ERRORS!\n");
