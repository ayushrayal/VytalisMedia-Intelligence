const fs = require("fs");
const path = require("path");

const report = JSON.parse(
  fs.readFileSync(path.join(__dirname, "deep-audit-report.json"), "utf8")
);

let grandTotalBefore = 0;
let grandTotalUnused = 0;
let grandTotalRemaining = 0;

console.log("=========================================================================");
console.log("EXACT SHOPIFY ENDPOINT FIELD AUDIT BREAKDOWN");
console.log("=========================================================================\n");

for (const [epKey, epData] of Object.entries(report)) {
  const before = epData.fieldsBefore;
  const fields = epData.fieldDetails;

  const usedInApp = [];
  const unusedInApp = []; // srcAppCount === 0

  for (const item of fields) {
    if (item.srcAppCount > 0) {
      usedInApp.push(item);
    } else {
      unusedInApp.push(item);
    }
  }

  const fieldsUnused = unusedInApp.length;
  const fieldsToRemove = unusedInApp.length;
  const fieldsRemaining = usedInApp.length;

  grandTotalBefore += before;
  grandTotalUnused += fieldsToRemove;
  grandTotalRemaining += fieldsRemaining;

  console.log(`--------------------------------------------------`);
  console.log(`ENDPOINT: ${epKey}`);
  console.log(`--------------------------------------------------`);
  console.log(`Fields before:           ${before}`);
  console.log(`Fields marked unused:    ${fieldsUnused}`);
  console.log(`Fields to remove:        ${fieldsToRemove}`);
  console.log(`Fields remaining:        ${fieldsRemaining}`);
  
  if (unusedInApp.length > 0) {
    console.log(`\nUnused fields (${unusedInApp.length}):`);
    unusedInApp.forEach((f) => {
      const notes = f.testCount > 0 ? ` (referenced in ${f.testCount} test file(s))` : " (0 references in repo)";
      console.log(`  - ${f.field}${notes}`);
    });
  } else {
    console.log(`\nUnused fields: NONE (All fields required)`);
  }
  
  console.log(`\nRemaining fields (${usedInApp.length}):`);
  usedInApp.forEach((f) => console.log(`  + ${f.field} (${f.srcAppCount} app file(s))`));
  console.log(`\n`);
}

console.log("=========================================================================");
console.log("GRAND TOTAL SUMMARY FOR SHOPIFY ENDPOINTS");
console.log("=========================================================================");
console.log(`Total fields before:     ${grandTotalBefore}`);
console.log(`Total fields removed:    ${grandTotalUnused}`);
console.log(`Total fields remaining:  ${grandTotalRemaining}`);
const pctReduction = ((grandTotalUnused / grandTotalBefore) * 100).toFixed(1);
console.log(`Exact Percentage Reduction: ${pctReduction}%`);
console.log("=========================================================================");
