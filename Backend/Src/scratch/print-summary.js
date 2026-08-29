const fs = require("fs");
const path = require("path");

const report = JSON.parse(
  fs.readFileSync(path.join(__dirname, "audit-report.json"), "utf8")
);

for (const [epKey, fields] of Object.entries(report)) {
  console.log(`\n========================================`);
  console.log(`ENDPOINT: ${epKey}`);
  console.log(`========================================`);
  
  const unused = [];
  const usedOnlyInTests = [];
  const used = [];

  for (const item of fields) {
    if (item.srcAppCount === 0 && item.testCount === 0) {
      unused.push(item.field);
    } else if (item.srcAppCount === 0 && item.testCount > 0) {
      usedOnlyInTests.push(`${item.field} (in ${item.testCount} test files)`);
    } else {
      used.push(`${item.field} (${item.srcAppCount} app files)`);
    }
  }

  console.log(`USED (${used.length}):`, used.join(", "));
  console.log(`ONLY IN TESTS (${usedOnlyInTests.length}):`, usedOnlyInTests.join(", "));
  console.log(`ZERO REFS IN REPO (${unused.length}):`, unused.join(", "));
}
