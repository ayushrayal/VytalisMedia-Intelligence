/**
 * Comprehensive Test Suite for Attribution Parser and Classifier in Vytalis Intelligence.
 * Verifies all 20 mandatory scenarios + precedence rules + UI group mappings.
 */

const { parseOrderCustomAttributes } = require("../utils/attribution-parser.util");
const { classifyAttributionOrder } = require("../utils/attribution-classifier.util");
const ATTRIBUTION_CONSTANTS = require("../config/attribution-constants.config");

const testCases = [
  // 1. Meta order with fbclid
  {
    name: "1. Meta order with fbclid",
    rawAttr: "fbclid=IwAR3XYZ123;utm_source=some_source",
    merchantDomains: ["myshop.com"],
    expectedChannel: ATTRIBUTION_CONSTANTS.CHANNELS.META_ADS,
    expectedGroup: ATTRIBUTION_CONSTANTS.GROUPS.META,
  },

  // 2. Meta order with ad_id
  {
    name: "2. Meta order with ad_id",
    rawAttr: "ad_id=120251283809;orig_referrer=https://google.com/",
    merchantDomains: ["myshop.com"],
    expectedChannel: ATTRIBUTION_CONSTANTS.CHANNELS.META_ADS,
    expectedGroup: ATTRIBUTION_CONSTANTS.GROUPS.META,
  },

  // 3. Meta order with campaign_id
  {
    name: "3. Meta order with campaign_id",
    rawAttr: "campaign_id=2385123456789;utm_medium=cpc",
    merchantDomains: ["myshop.com"],
    expectedChannel: ATTRIBUTION_CONSTANTS.CHANNELS.META_ADS,
    expectedGroup: ATTRIBUTION_CONSTANTS.GROUPS.META,
  },

  // 4. Meta order with only utm_source
  {
    name: "4. Meta order with only utm_source=facebook",
    rawAttr: "utm_source=Facebook;utm_medium=banner",
    merchantDomains: ["myshop.com"],
    expectedChannel: ATTRIBUTION_CONSTANTS.CHANNELS.META_ADS,
    expectedGroup: ATTRIBUTION_CONSTANTS.GROUPS.META,
  },

  // 5. Google order with gclid
  {
    name: "5. Google order with gclid",
    rawAttr: "gclid=Cj0KCQiA3YX9B;orig_referrer=https://www.google.com/",
    merchantDomains: ["myshop.com"],
    expectedChannel: ATTRIBUTION_CONSTANTS.CHANNELS.GOOGLE_ADS,
    expectedGroup: ATTRIBUTION_CONSTANTS.GROUPS.GOOGLE,
  },

  // 6. Google order with utm_source=google + utm_medium=cpc
  {
    name: "6. Google order with utm_source=google + utm_medium=cpc",
    rawAttr: "utm_source=google;utm_medium=cpc;utm_campaign=PMax_Search",
    merchantDomains: ["myshop.com"],
    expectedChannel: ATTRIBUTION_CONSTANTS.CHANNELS.GOOGLE_ADS,
    expectedGroup: ATTRIBUTION_CONSTANTS.GROUPS.GOOGLE,
  },

  // 7. Google Ads with google.com referrer and paid signal
  {
    name: "7. Google Ads with google.com referrer + gclid",
    rawAttr: "gclid=Cj0KCQiA;orig_referrer=https://www.google.com/",
    merchantDomains: ["myshop.com"],
    expectedChannel: ATTRIBUTION_CONSTANTS.CHANNELS.GOOGLE_ADS,
    expectedGroup: ATTRIBUTION_CONSTANTS.GROUPS.GOOGLE,
  },

  // 8. Google Organic with google referrer and NO paid signal
  {
    name: "8. Google Organic with google referrer (no paid signal)",
    rawAttr: "orig_referrer=https://www.google.com/",
    merchantDomains: ["myshop.com"],
    expectedChannel: ATTRIBUTION_CONSTANTS.CHANNELS.GOOGLE_ORGANIC,
    expectedGroup: ATTRIBUTION_CONSTANTS.GROUPS.NOT_ATTRIBUTION,
  },

  // 9. Google Organic with srsltid and NO paid signal
  {
    name: "9. Google Organic with srsltid (free Google Shopping)",
    rawAttr: "srsltid=AfmBOop12345;orig_referrer=https://google.com/",
    merchantDomains: ["myshop.com"],
    expectedChannel: ATTRIBUTION_CONSTANTS.CHANNELS.GOOGLE_ORGANIC,
    expectedGroup: ATTRIBUTION_CONSTANTS.GROUPS.NOT_ATTRIBUTION,
  },

  // 10. Bitespeed email
  {
    name: "10. Bitespeed email",
    rawAttr: "utm_source=bitespeed;utm_medium=email;utm_campaign=winback",
    merchantDomains: ["myshop.com"],
    expectedChannel: ATTRIBUTION_CONSTANTS.CHANNELS.CRM_WHATSAPP_EMAIL,
    expectedGroup: ATTRIBUTION_CONSTANTS.GROUPS.NOT_ATTRIBUTION,
  },

  // 11. Bitespeed WhatsApp
  {
    name: "11. Bitespeed WhatsApp",
    rawAttr: "utm_source=bitespeed;utm_medium=whatsapp;utm_campaign=abandoned_cart",
    merchantDomains: ["myshop.com"],
    expectedChannel: ATTRIBUTION_CONSTANTS.CHANNELS.CRM_WHATSAPP_EMAIL,
    expectedGroup: ATTRIBUTION_CONSTANTS.GROUPS.NOT_ATTRIBUTION,
  },

  // 12. AI referral from chatgpt
  {
    name: "12. AI referral from chatgpt",
    rawAttr: "orig_referrer=https://chatgpt.com/",
    merchantDomains: ["myshop.com"],
    expectedChannel: ATTRIBUTION_CONSTANTS.CHANNELS.AI_LLM_REFERRAL,
    expectedGroup: ATTRIBUTION_CONSTANTS.GROUPS.NOT_ATTRIBUTION,
  },

  // 13. AI referral from perplexity
  {
    name: "13. AI referral from perplexity",
    rawAttr: "utm_source=perplexity;utm_medium=referral",
    merchantDomains: ["myshop.com"],
    expectedChannel: ATTRIBUTION_CONSTANTS.CHANNELS.AI_LLM_REFERRAL,
    expectedGroup: ATTRIBUTION_CONSTANTS.GROUPS.NOT_ATTRIBUTION,
  },

  // 14. Other tagged source
  {
    name: "14. Other tagged source",
    rawAttr: "utm_source=affiliate_network;utm_medium=influencer",
    merchantDomains: ["myshop.com"],
    expectedChannel: ATTRIBUTION_CONSTANTS.CHANNELS.OTHER_TAGGED,
    expectedGroup: ATTRIBUTION_CONSTANTS.GROUPS.NOT_ATTRIBUTION,
  },

  // 15. Completely unattributed order
  {
    name: "15. Completely unattributed order",
    rawAttr: "",
    merchantDomains: ["myshop.com"],
    expectedChannel: ATTRIBUTION_CONSTANTS.CHANNELS.NOT_ATTRIBUTED,
    expectedGroup: ATTRIBUTION_CONSTANTS.GROUPS.NOT_ATTRIBUTION,
  },

  // 16. Duplicate UTM values in attribute string (Keep FIRST occurrence)
  {
    name: "16. Duplicate UTM values in attribute string",
    rawAttr: "utm_source=facebook;utm_source=google;utm_medium=cpc",
    merchantDomains: ["myshop.com"],
    expectedChannel: ATTRIBUTION_CONSTANTS.CHANNELS.META_ADS,
    expectedGroup: ATTRIBUTION_CONSTANTS.GROUPS.META,
  },

  // 17. full_url containing many "=" characters
  {
    name: "17. full_url containing many '=' characters",
    rawAttr: "full_url=https://example.com/shop?a=1&b=2&c=3&gclid=ABC123XYZ=EXTRA;utm_source=google;utm_medium=cpc",
    merchantDomains: ["myshop.com"],
    expectedChannel: ATTRIBUTION_CONSTANTS.CHANNELS.GOOGLE_ADS,
    expectedGroup: ATTRIBUTION_CONSTANTS.GROUPS.GOOGLE,
  },

  // 18. campaignid (Google style) vs campaign_id (Meta style)
  {
    name: "18. campaignid (Google) vs campaign_id (Meta)",
    rawAttr: "campaignid=987654321;utm_source=google;utm_medium=cpc",
    merchantDomains: ["myshop.com"],
    expectedChannel: ATTRIBUTION_CONSTANTS.CHANNELS.GOOGLE_ADS,
    expectedGroup: ATTRIBUTION_CONSTANTS.GROUPS.GOOGLE,
  },

  // 19. Empty click-ID values
  {
    name: "19. Empty click-ID values treated as missing",
    rawAttr: "gclid=;fbclid=;orig_referrer=https://google.com/",
    merchantDomains: ["myshop.com"],
    expectedChannel: ATTRIBUTION_CONSTANTS.CHANNELS.GOOGLE_ORGANIC,
    expectedGroup: ATTRIBUTION_CONSTANTS.GROUPS.NOT_ATTRIBUTION,
  },

  // 20. Mixed-case and whitespace values
  {
    name: "20. Mixed-case and whitespace values",
    rawAttr: "  UTM_SOURCE =  FACEBOOK ;  UTM_MEDIUM = CPC ",
    merchantDomains: ["myshop.com"],
    expectedChannel: ATTRIBUTION_CONSTANTS.CHANNELS.META_ADS,
    expectedGroup: ATTRIBUTION_CONSTANTS.GROUPS.META,
  },

  // 21. Precedence: Meta Ads + Google Ads signals -> Meta Ads (Meta evaluated first)
  {
    name: "21. Precedence: Meta + Google signals -> Meta Ads",
    rawAttr: "fbclid=FB123;gclid=GGL123;utm_source=facebook",
    merchantDomains: ["myshop.com"],
    expectedChannel: ATTRIBUTION_CONSTANTS.CHANNELS.META_ADS,
    expectedGroup: ATTRIBUTION_CONSTANTS.GROUPS.META,
  },

  // 22. Precedence: Google Ads + google.com referrer -> Google Ads, NOT Google Organic
  {
    name: "22. Precedence: Google Ads + google.com referrer -> Google Ads",
    rawAttr: "gclid=GGL123;orig_referrer=https://www.google.com/",
    merchantDomains: ["myshop.com"],
    expectedChannel: ATTRIBUTION_CONSTANTS.CHANNELS.GOOGLE_ADS,
    expectedGroup: ATTRIBUTION_CONSTANTS.GROUPS.GOOGLE,
  },

  // 23. Own merchant domain referrer -> Not Attributed
  {
    name: "23. Merchant own domain referrer -> Not Attributed",
    rawAttr: "orig_referrer=https://myshop.com/cart",
    merchantDomains: ["myshop.com"],
    expectedChannel: ATTRIBUTION_CONSTANTS.CHANNELS.NOT_ATTRIBUTED,
    expectedGroup: ATTRIBUTION_CONSTANTS.GROUPS.NOT_ATTRIBUTION,
  },
];

console.log("=== RUNNING ATTRIBUTION PARSER & CLASSIFIER SUITE ===");

let passed = 0;
let failed = 0;

for (const tc of testCases) {
  const parsed = parseOrderCustomAttributes(tc.rawAttr);
  const result = classifyAttributionOrder(parsed, tc.merchantDomains);

  const channelMatch = result.channel === tc.expectedChannel;
  const groupMatch = result.topLevelGroup === tc.expectedGroup;

  if (channelMatch && groupMatch) {
    console.log(`[PASS] ${tc.name}`);
    passed++;
  } else {
    console.error(`[FAIL] ${tc.name}`);
    console.error(`  Expected Channel: '${tc.expectedChannel}', Got: '${result.channel}'`);
    console.error(`  Expected Group:   '${tc.expectedGroup}', Got: '${result.topLevelGroup}'`);
    failed++;
  }
}

console.log(`\nResults: ${passed} PASSED, ${failed} FAILED out of ${testCases.length} tests.`);

if (failed > 0) {
  process.exit(1);
} else {
  console.log("\n=== ALL ATTRIBUTION TESTS PASSED CLEANLY! ===");
}
