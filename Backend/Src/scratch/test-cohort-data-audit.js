const dns = require("dns");
const path = require("path");
dns.setServers(["8.8.8.8", "8.8.4.4"]);
require("dotenv").config({ path: path.join(__dirname, "../../.env") });

const windsorProvider = require("../providers/windsor.provider");

async function auditCohortData() {
  const activeShopifyAccount = "jsbhealthcare.myshopify.com";

  console.log("=== PROBING WINDSOR ORDERS DATA FOR COHORT ANALYSIS ===");

  try {
    // Probe 1: Fetch order historical fields for last_90d
    const fields = ["account_name", "order_id", "order_created_at", "order_customer_id", "order_email", "order_net_sales", "order_total_price"];
    
    console.log("Fetching orders for preset 'last_90d'...");
    const orders90d = await windsorProvider.fetchData({
      connector: "shopify",
      fields,
      datePreset: "last_90d",
      filters: [["account_name", "eq", activeShopifyAccount]],
    });

    console.log(`Fetched ${orders90d.length} order rows for last_90d.`);
    if (orders90d.length > 0) {
      console.log("Sample order record:", orders90d[0]);
    }

    // Inspect customer ID availability
    let withCustomerId = 0;
    let withEmail = 0;
    let withNeither = 0;

    const customerOrderMap = {};

    orders90d.forEach((o) => {
      const custId = o.order_customer_id;
      const email = o.order_email;

      if (custId !== null && custId !== undefined && String(custId).trim() !== "") {
        withCustomerId += 1;
      } else if (email !== null && email !== undefined && String(email).trim() !== "") {
        withEmail += 1;
      } else {
        withNeither += 1;
      }

      // Use custId if available, or fallback to email if custId missing
      const key = (custId !== null && custId !== undefined && String(custId).trim() !== "")
        ? String(custId).trim()
        : (email !== null && email !== undefined && String(email).trim() !== "")
          ? String(email).trim().toLowerCase()
          : null;

      if (key) {
        if (!customerOrderMap[key]) customerOrderMap[key] = [];
        customerOrderMap[key].push(o);
      }
    });

    console.log(`\nCustomer Identifier Breakdown (last_90d):`);
    console.log(`- Rows with order_customer_id: ${withCustomerId}`);
    console.log(`- Rows with order_email (no customer_id): ${withEmail}`);
    console.log(`- Rows missing both: ${withNeither}`);
    console.log(`- Unique customer keys identified: ${Object.keys(customerOrderMap).length}`);

    // Analyze repeat customers in this dataset
    let singleOrderCustomers = 0;
    let repeatCustomers = 0;
    let maxOrdersBySingleCustomer = 0;

    Object.keys(customerOrderMap).forEach((key) => {
      const count = customerOrderMap[key].length;
      if (count === 1) singleOrderCustomers += 1;
      else if (count >= 2) repeatCustomers += 1;
      if (count > maxOrdersBySingleCustomer) maxOrdersBySingleCustomer = count;
    });

    console.log(`\nCustomer Purchase Frequency (last_90d):`);
    console.log(`- Single-order customers: ${singleOrderCustomers}`);
    console.log(`- Repeat customers (2+ orders): ${repeatCustomers}`);
    console.log(`- Max orders by a single customer: ${maxOrdersBySingleCustomer}`);

    // Inspect date range of orders in last_90d
    if (orders90d.length > 0) {
      const dates = orders90d
        .map((o) => o.order_created_at)
        .filter(Boolean)
        .sort();
      console.log(`\nDate Range of returned orders: ${dates[0]} to ${dates[dates.length - 1]}`);
    }

  } catch (err) {
    console.error("Error in cohort data audit:", err.message);
  }
}

auditCohortData();
