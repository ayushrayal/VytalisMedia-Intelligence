/**
 * Dedicated parser utility for order_custom_attributes in Vytalis Intelligence.
 *
 * Rules:
 * 1. Splits outer attribute string on ";"
 * 2. Splits each key/value pair on the FIRST "=" only.
 * 3. Keeps the FIRST occurrence of duplicate keys.
 * 4. Extracts: utm_source, utm_medium, utm_campaign, utm_content, orig_referrer, full_url.
 * 5. Safely extracts query parameters from full_url to identify click IDs and parameters.
 * 6. Normalizes whitespace and treats empty strings as missing.
 */

/**
 * Safely parses raw order_custom_attributes into a structured key-value map and extracted parameters.
 *
 * @param {string|Object|Array} rawAttributes - Raw order_custom_attributes value from Windsor
 * @returns {Object} Structured attribution data
 */
const parseOrderCustomAttributes = (rawAttributes) => {
  const result = {
    utm_source: null,
    utm_medium: null,
    utm_campaign: null,
    utm_content: null,
    orig_referrer: null,
    full_url: null,
    // Click / Tracking parameters
    fbclid: null,
    gclid: null,
    gbraid: null,
    wbraid: null,
    gad_source: null,
    gad_campaignid: null,
    ad_id: null,
    campaign_id: null,
    campaignid: null,
    srsltid: null,
    raw_map: {},
  };

  if (!rawAttributes) {
    return result;
  }

  let str = "";
  if (typeof rawAttributes === "string") {
    str = rawAttributes;
  } else if (Array.isArray(rawAttributes)) {
    // If Windsor returns array of { name, value } or string tuples
    const pairs = [];
    for (const item of rawAttributes) {
      if (typeof item === "string") {
        pairs.push(item);
      } else if (item && typeof item === "object") {
        const k = item.name || item.key || item.name_ || "";
        const v = item.value || item.val || "";
        if (k) pairs.push(`${k}=${v}`);
      }
    }
    str = pairs.join(";");
  } else if (typeof rawAttributes === "object") {
    const pairs = [];
    for (const [k, v] of Object.entries(rawAttributes)) {
      pairs.push(`${k}=${v}`);
    }
    str = pairs.join(";");
  }

  str = str.trim();
  if (!str) {
    return result;
  }

  // 1. Split outer attribute string on ";"
  const pairs = str.split(";");
  const seenKeys = new Set();

  for (const pair of pairs) {
    const trimmedPair = pair.trim();
    if (!trimmedPair) continue;

    // 2. Split key/value pair on the FIRST "=" only
    const eqIdx = trimmedPair.indexOf("=");
    if (eqIdx === -1) continue;

    const rawKey = trimmedPair.slice(0, eqIdx).trim();
    const rawVal = trimmedPair.slice(eqIdx + 1).trim();

    if (!rawKey) continue;

    const lowerKey = rawKey.toLowerCase();

    // 3. Keep the FIRST occurrence of duplicate keys
    if (seenKeys.has(lowerKey)) {
      continue;
    }
    seenKeys.add(lowerKey);

    const val = rawVal || null;
    result.raw_map[lowerKey] = val;

    // 4. Extract required keys
    if (lowerKey === "utm_source") result.utm_source = val;
    else if (lowerKey === "utm_medium") result.utm_medium = val;
    else if (lowerKey === "utm_campaign") result.utm_campaign = val;
    else if (lowerKey === "utm_content") result.utm_content = val;
    else if (lowerKey === "orig_referrer") result.orig_referrer = val;
    else if (lowerKey === "full_url") result.full_url = val;
    else if (lowerKey === "fbclid") result.fbclid = val;
    else if (lowerKey === "gclid") result.gclid = val;
    else if (lowerKey === "gbraid") result.gbraid = val;
    else if (lowerKey === "wbraid") result.wbraid = val;
    else if (lowerKey === "gad_source") result.gad_source = val;
    else if (lowerKey === "gad_campaignid") result.gad_campaignid = val;
    else if (lowerKey === "ad_id") result.ad_id = val;
    else if (lowerKey === "campaign_id") result.campaign_id = val;
    else if (lowerKey === "campaignid") result.campaignid = val;
    else if (lowerKey === "srsltid") result.srsltid = val;
  }

  // 5. If full_url is present, extract query string parameters to populate missing click IDs / UTMs
  if (result.full_url) {
    try {
      const parsedUrl = new URL(result.full_url);
      const searchParams = parsedUrl.searchParams;

      const setIfMissing = (targetKey, paramKey) => {
        if (!result[targetKey] && searchParams.has(paramKey)) {
          const v = searchParams.get(paramKey)?.trim();
          if (v) result[targetKey] = v;
        }
      };

      setIfMissing("fbclid", "fbclid");
      setIfMissing("gclid", "gclid");
      setIfMissing("gbraid", "gbraid");
      setIfMissing("wbraid", "wbraid");
      setIfMissing("gad_source", "gad_source");
      setIfMissing("gad_campaignid", "gad_campaignid");
      setIfMissing("ad_id", "ad_id");
      setIfMissing("campaign_id", "campaign_id");
      setIfMissing("campaignid", "campaignid");
      setIfMissing("srsltid", "srsltid");

      setIfMissing("utm_source", "utm_source");
      setIfMissing("utm_medium", "utm_medium");
      setIfMissing("utm_campaign", "utm_campaign");
      setIfMissing("utm_content", "utm_content");
    } catch {
      // If full_url is not a valid URL object, fallback regex search for URL parameters
      const extractParamByRegex = (paramName) => {
        const regex = new RegExp(`[?&]${paramName}=([^&]+)`, "i");
        const match = result.full_url.match(regex);
        return match ? decodeURIComponent(match[1].trim()) : null;
      };

      if (!result.fbclid) result.fbclid = extractParamByRegex("fbclid");
      if (!result.gclid) result.gclid = extractParamByRegex("gclid");
      if (!result.gbraid) result.gbraid = extractParamByRegex("gbraid");
      if (!result.wbraid) result.wbraid = extractParamByRegex("wbraid");
      if (!result.gad_source) result.gad_source = extractParamByRegex("gad_source");
      if (!result.gad_campaignid) result.gad_campaignid = extractParamByRegex("gad_campaignid");
      if (!result.ad_id) result.ad_id = extractParamByRegex("ad_id");
      if (!result.campaign_id) result.campaign_id = extractParamByRegex("campaign_id");
      if (!result.campaignid) result.campaignid = extractParamByRegex("campaignid");
      if (!result.srsltid) result.srsltid = extractParamByRegex("srsltid");
    }
  }

  return result;
};

module.exports = {
  parseOrderCustomAttributes,
};
