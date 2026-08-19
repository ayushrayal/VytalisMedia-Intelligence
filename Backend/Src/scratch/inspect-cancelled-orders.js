const dns = require("dns");
const path = require("path");
dns.setServers(["8.8.8.8", "8.8.4.4"]);
require("dotenv").config({ path: path.join(__dirname, "../../.env") });

const shopifyAdapter = require("../adapters/shopify.adapter");

async function run() {
  try {
    const activeShopifyAccount = "jsbhealthcare.myshopify.com";
    console.log("Fetching orders from Windsor for account:", activeShopifyAccount);
    
    const orders = await shopifyAdapter.fetchOrders({
      activeShopifyAccount,
      datePreset: "last_90d",
    });

    console.log(`Fetched ${orders.length} total order rows.`);

    const cancelledOrders = orders.filter((order) => {
      return (
        order.order_cancelled_at !== null &&
        order.order_cancelled_at !== undefined &&
        String(order.order_cancelled_at).trim() !== ""
      );
    });

    console.log(`Found ${cancelledOrders.length} cancelled order records:\n`);

    cancelledOrders.forEach((o, idx) => {
      const id = o.order_name || o.order_id;
      const cancelledAt = o.order_cancelled_at;
      const totalPrice = Number(o.order_total_price || 0);
      const netSales = Number(o.order_net_sales || 0);
      const grossSales = Number(o.order_gross_sales || 0);
      const subtotalPrice = Number(o.order_subtotal_price || 0);
      const displayedPrice = Number(o.order_total_price || o.order_net_sales || 0);

      console.log(
        `[${idx + 1}] Order: ${id} | cancelled_at: ${cancelledAt} | order_total_price: ₹${totalPrice} | order_net_sales: ₹${netSales} | Displayed: ₹${displayedPrice}`
      );
    });

    // Check mapping of order IDs with positive and negative records
    const orderIdMap = {};
    cancelledOrders.forEach((o) => {
      const id = o.order_name || o.order_id;
      if (!orderIdMap[id]) orderIdMap[id] = [];
      orderIdMap[id].push(o);
    });

    console.log("\n--- Order ID Groupings for Cancelled Orders ---");
    Object.keys(orderIdMap).forEach((id) => {
      const rows = orderIdMap[id];
      console.log(`\nOrder ID: ${id} (${rows.length} rows)`);
      rows.forEach((r, rIdx) => {
        const val = Number(r.order_total_price || r.order_net_sales || 0);
        console.log(`  Row ${rIdx + 1}: finStatus=${r.order_financial_status}, total_price=${r.order_total_price}, net_sales=${r.order_net_sales}, val=${val}`);
      });
    });

    // Calculation comparisons
    let oldSum = 0;
    let absSum = 0;
    cancelledOrders.forEach((o) => {
      const val = Number(o.order_total_price || o.order_net_sales || 0);
      oldSum += val;
      absSum += Math.abs(val);
    });

    console.log("\n--- Calculation Results ---");
    console.log("Old signed sum cancelledValue:", oldSum);
    console.log("New Math.abs sum cancelledValue:", absSum);

  } catch (err) {
    console.error("Error fetching orders:", err);
  }
}

run();
