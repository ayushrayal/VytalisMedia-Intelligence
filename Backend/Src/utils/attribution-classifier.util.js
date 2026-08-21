/**
 * Attribution Classifier Utility for Vytalis Intelligence.
 *
 * Implements strict 7-rule classification logic in exact order (FIRST MATCH WINS):
 * A. Meta Ads
 * B. Google Ads (evaluated BEFORE Google Organic)
 * C. Google Organic
 * D. CRM / WhatsApp / Email
 * E. AI / LLM Referral
 * F. Other (Tagged)
 * G. Not Attributed
 *
 * Maps each raw channel label to top-level UI group ("meta", "google", "not_attribution").
 */

const ATTRIBUTION_CONSTANTS = require("../config/attribution-constants.config");

/**
 * Safely extracts host or domain from a referrer URL string.
 *
 * @param {string} referrerUrl
 * @returns {string} Cleaned lowercase referrer string
 */
const normalizeReferrer = (referrerUrl) => {
  if (!referrerUrl || typeof referrerUrl !== "string") return "";
  const trimmed = referrerUrl.trim().toLowerCase();
  try {
    const url = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
    return url.hostname.toLowerCase();
  } catch {
    return trimmed;
  }
};

/**
 * Classifies a parsed order into one of 7 raw attribution channels and maps to a top-level group.
 *
 * @param {Object} parsedAttr - Parsed attribution data from parseOrderCustomAttributes
 * @param {Array<string>} [merchantDomains=[]] - Optional array of verified merchant domains
 * @returns {Object} { channel, topLevelGroup, hadClickId }
 */
const classifyAttributionOrder = (parsedAttr, merchantDomains = []) => {
  const {
    utm_source,
    utm_medium,
    utm_campaign,
    utm_content,
    orig_referrer,
    full_url,
    fbclid,
    gclid,
    gbraid,
    wbraid,
    gad_source,
    gad_campaignid,
    ad_id,
    campaign_id,
    campaignid,
    srsltid,
  } = parsedAttr || {};

  const normSource = utm_source ? utm_source.trim().toLowerCase() : "";
  const normMedium = utm_medium ? utm_medium.trim().toLowerCase() : "";
  const normReferrer = normalizeReferrer(orig_referrer);

  const hadClickId = !!(fbclid || gclid || gbraid || wbraid || gad_source || gad_campaignid || ad_id);

  // --------------------------------------------------
  // A. META ADS
  // --------------------------------------------------
  const hasMetaClickSignal = !!(fbclid || ad_id || campaign_id);
  const hasMetaSourceSignal = ATTRIBUTION_CONSTANTS.META_SOURCES.some((s) => normSource.includes(s));
  const hasMetaMediumSignal = ATTRIBUTION_CONSTANTS.META_MEDIUMS.some((m) => normMedium.includes(m));

  if (hasMetaClickSignal || hasMetaSourceSignal || hasMetaMediumSignal) {
    return {
      channel: ATTRIBUTION_CONSTANTS.CHANNELS.META_ADS,
      topLevelGroup: ATTRIBUTION_CONSTANTS.GROUPS.META,
      hadClickId,
    };
  }

  // --------------------------------------------------
  // B. GOOGLE ADS (Evaluated BEFORE Google Organic)
  // --------------------------------------------------
  const hasGoogleClickSignal = !!(gclid || gbraid || wbraid || gad_source || gad_campaignid);
  const isGoogleSource = ATTRIBUTION_CONSTANTS.GOOGLE_PAID_SOURCES.some((s) => normSource.includes(s));
  const isGooglePaidMedium = ATTRIBUTION_CONSTANTS.GOOGLE_PAID_MEDIUMS.includes(normMedium);
  const hasGoogleUtmSignal = isGoogleSource && isGooglePaidMedium;

  if (hasGoogleClickSignal || hasGoogleUtmSignal) {
    return {
      channel: ATTRIBUTION_CONSTANTS.CHANNELS.GOOGLE_ADS,
      topLevelGroup: ATTRIBUTION_CONSTANTS.GROUPS.GOOGLE,
      hadClickId,
    };
  }

  // --------------------------------------------------
  // C. GOOGLE ORGANIC
  // --------------------------------------------------
  const isGoogleOrganicHost = ATTRIBUTION_CONSTANTS.GOOGLE_ORGANIC_HOSTS.some((h) => normReferrer.includes(h));
  const hasSrsltid = !!srsltid;

  if (isGoogleOrganicHost || hasSrsltid) {
    return {
      channel: ATTRIBUTION_CONSTANTS.CHANNELS.GOOGLE_ORGANIC,
      topLevelGroup: ATTRIBUTION_CONSTANTS.GROUPS.NOT_ATTRIBUTION,
      hadClickId,
    };
  }

  // --------------------------------------------------
  // D. CRM / WHATSAPP / EMAIL
  // --------------------------------------------------
  const isCrmSource = (ATTRIBUTION_CONSTANTS.CRM_SOURCES || []).some((s) => normSource.includes(s));
  const isCrmMedium = ATTRIBUTION_CONSTANTS.CRM_MEDIUMS.includes(normMedium);

  if (isCrmSource || isCrmMedium) {
    return {
      channel: ATTRIBUTION_CONSTANTS.CHANNELS.CRM_WHATSAPP_EMAIL,
      topLevelGroup: ATTRIBUTION_CONSTANTS.GROUPS.NOT_ATTRIBUTION,
      hadClickId,
    };
  }


  // --------------------------------------------------
  // E. AI / LLM REFERRAL
  // --------------------------------------------------
  const isAiSource = ATTRIBUTION_CONSTANTS.AI_LLM_KEYWORDS.some((kw) => normSource.includes(kw));
  const isAiReferrer = ATTRIBUTION_CONSTANTS.AI_LLM_KEYWORDS.some((kw) => normReferrer.includes(kw));

  if (isAiSource || isAiReferrer) {
    return {
      channel: ATTRIBUTION_CONSTANTS.CHANNELS.AI_LLM_REFERRAL,
      topLevelGroup: ATTRIBUTION_CONSTANTS.GROUPS.NOT_ATTRIBUTION,
      hadClickId,
    };
  }

  // --------------------------------------------------
  // F. OTHER TAGGED
  // --------------------------------------------------
  if (normSource || normMedium) {
    return {
      channel: ATTRIBUTION_CONSTANTS.CHANNELS.OTHER_TAGGED,
      topLevelGroup: ATTRIBUTION_CONSTANTS.GROUPS.NOT_ATTRIBUTION,
      hadClickId,
    };
  }

  // --------------------------------------------------
  // G. NOT ATTRIBUTED
  // --------------------------------------------------
  // Check if referrer is merchant's own domain (only when merchant domains are reliably provided)
  let isOwnDomain = false;
  if (normReferrer && Array.isArray(merchantDomains) && merchantDomains.length > 0) {
    isOwnDomain = merchantDomains.some((d) => {
      if (!d || typeof d !== "string") return false;
      const cleanD = d.trim().toLowerCase();
      return cleanD && normReferrer.includes(cleanD);
    });
  }

  return {
    channel: ATTRIBUTION_CONSTANTS.CHANNELS.NOT_ATTRIBUTED,
    topLevelGroup: ATTRIBUTION_CONSTANTS.GROUPS.NOT_ATTRIBUTION,
    hadClickId,
    isOwnDomain,
  };
};

module.exports = {
  normalizeReferrer,
  classifyAttributionOrder,
};
