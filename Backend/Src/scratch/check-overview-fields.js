const fs = require("fs");
const path = require("path");

const report = JSON.parse(
  fs.readFileSync(path.join(__dirname, "audit-report.json"), "utf8")
);

function checkField(ep, f) {
  const item = report[ep].find(x => x.field === f);
  console.log(`\nEndpoint: ${ep} | Field: ${f}`);
  console.log("Src App Files:", item ? item.srcAppFiles : []);
  console.log("Test Files:", item ? item.testFiles : []);
}

checkField("shopify_overview", "order_total_tax_amount");
checkField("shopify_overview", "order_current_total_price");
checkField("shopify_overview", "order_financial_status");
checkField("shopify_overview", "order_fully_paid");
checkField("shopify_overview", "order_unpaid");
checkField("shopify_overview", "order_total_outstanding_amount");
checkField("shopify_overview", "order_new_or_returning_customer");
checkField("shopify_overview", "order_customer_has_multiple_orders");
