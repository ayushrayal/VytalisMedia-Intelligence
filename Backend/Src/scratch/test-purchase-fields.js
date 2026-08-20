const dotenv = require("dotenv");
dotenv.config();
const axios = require("axios");

const testFields = async (fieldList) => {
  const apiKey = process.env.WINDSOR_API_KEY;
  const filter = JSON.stringify([["account_id", "eq", "587440480534010"]]);
  const url = `https://connectors.windsor.ai/facebook?api_key=${apiKey}&date_preset=last_7d&filter=${encodeURIComponent(filter)}&fields=${fieldList.join(",")}`;

  try {
    const res = await axios.get(url);
    console.log(`✅ SUCCESS for fields: [${fieldList.join(", ")}]`);
    if (res.data && res.data.data && res.data.data.length > 0) {
      console.log("Sample keys returned:", Object.keys(res.data.data[0]));
      console.log("Sample values:", res.data.data[0]);
    }
  } catch (err) {
    console.log(`❌ FAILED for fields: [${fieldList.join(", ")}]`);
    console.log("Error data:", err.response?.data?.error || err.response?.data || err.message);
  }
};

const run = async () => {
  const baseFields = ["age", "gender", "spend", "impressions", "reach", "clicks", "ctr", "cpc", "currency", "actions_add_to_cart", "actions_initiate_checkout"];
  
  const candidates = [
    ["actions_purchase"],
    ["actions_purchase_total"],
    ["action_values_purchase"],
    ["actions_offsite_conversion_fb_pixel_purchase"],
    ["action_values_offsite_conversion_fb_pixel_purchase"],
    ["actions_purchase", "action_values_purchase"],
  ];

  for (const cand of candidates) {
    await testFields([...baseFields, ...cand]);
  }
};

run();
