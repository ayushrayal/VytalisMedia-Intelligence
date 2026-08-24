const dns = require("dns");
const path = require("path");
dns.setServers(["8.8.8.8", "8.8.4.4"]);
require("dotenv").config({ path: path.join(__dirname, "../../.env") });

const shopifyAdapter = require("../adapters/shopify.adapter");

async function run() {
  try {
    const activeShopifyAccount = "jsbhealthcare.myshopify.com";
    console.log("Fetching overview rows from Windsor for account:", activeShopifyAccount);
    
    const overview = await shopifyAdapter.fetchOverview({
      activeShopifyAccount,
      datePreset: "last_7d",
    });

    console.log(`Fetched ${overview.length} overview rows.`);
    console.log("Sample overview row:", overview[0]);

    let grossSales = 0;
    let netSales = 0;
    let discounts = 0;
    let tax = 0;
    let totalPrice = 0;

    overview.forEach((r) => {
      grossSales += Number(r.order_gross_sales || r.gross_sales || 0);
      netSales += Number(r.order_net_sales || r.net_sales || 0);
      discounts += Number(r.order_total_discounts || 0);
      tax += Number(r.order_total_tax_amount || 0);
      totalPrice += Number(r.order_total_price || 0);
    });

    console.log("Gross Sales:", grossSales);
    console.log("Discounts:", discounts);
    console.log("Net Sales:", netSales);
    console.log("Tax:", tax);
    console.log("Total Price:", totalPrice);
    console.log("Gross - Discounts:", grossSales - discounts);
    console.log("Difference between (Gross - Discounts) and Net Sales:", (grossSales - discounts) - netSales);

    // Also fetch orders rows
    const orders = await shopifyAdapter.fetchOrders({
      activeShopifyAccount,
      datePreset: "last_7d",
    });

    console.log(`Fetched ${orders.length} order rows.`);
    let ordersGross = 0;
    let ordersNet = 0;
    let ordersDiscounts = 0;
    let ordersTax = 0;
    let ordersTotal = 0;

    orders.forEach((o) => {
      ordersGross += Number(o.order_gross_sales || 0);
      ordersNet += Number(o.order_net_sales || 0);
      ordersDiscounts += Number(o.order_total_discounts || 0);
      ordersTax += Number(o.order_total_tax_amount || 0);
      ordersTotal += Number(o.order_total_price || 0);
    });

    console.log("\nOrders-level aggregates:");
    console.log("Orders Gross Sales:", ordersGross);
    console.log("Orders Net Sales:", ordersNet);
    console.log("Orders Discounts:", ordersDiscounts);
    console.log("Orders Tax:", ordersTax);
    console.log("Orders Total Price:", ordersTotal);

  } catch (err) {
    console.error("Error in audit:", err);
  }
}

run();
