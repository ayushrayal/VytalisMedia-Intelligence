const { SHOPIFY_ENDPOINTS } = require("../config/shopify-endpoints.config");

console.log("=== EXACT SHOPIFY_ENDPOINTS FIELD COUNTS FROM FILE ===");
let totalBefore = 0;

for (const [key, epConfig] of Object.entries(SHOPIFY_ENDPOINTS)) {
  const fields = epConfig.fields || [];
  console.log(`Endpoint: '${key}' | Field count: ${fields.length}`);
  totalBefore += fields.length;
}

console.log(`\nTOTAL SHOPIFY FIELDS BEFORE = ${totalBefore}`);
