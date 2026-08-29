const fs = require("fs");
const path = require("path");
const { SHOPIFY_ENDPOINTS } = require("../config/shopify-endpoints.config");
const ATTRIBUTION_CONSTANTS = require("../config/attribution-constants.config");

const rootDir = path.resolve(__dirname, "../../..");
const backendDir = path.resolve(rootDir, "Backend/Src");
const frontendDir = path.resolve(rootDir, "Frontend/src");

function getAllJsFiles(dir, list = []) {
  if (!fs.existsSync(dir)) return list;
  for (const item of fs.readdirSync(dir)) {
    if (["node_modules", ".git", "dist", "build"].includes(item)) continue;
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      getAllJsFiles(fullPath, list);
    } else if (/\.(js|jsx|ts|tsx)$/.test(item)) {
      list.push(fullPath);
    }
  }
  return list;
}

const allFiles = [...getAllJsFiles(backendDir), ...getAllJsFiles(frontendDir)];

// Filter out config files that define the fields so we don't count self-definition
const filesToScan = allFiles.filter((f) => {
  const rel = path.relative(rootDir, f).replace(/\\/g, "/");
  return (
    !rel.includes("shopify-endpoints.config.js") &&
    !rel.includes("attribution-constants.config.js") &&
    !rel.includes("count-actual-fields.js") &&
    !rel.includes("deep-audit-all-shopify.js") &&
    !rel.includes("audit-field-usage.js") &&
    !rel.includes("audit-fields.js") &&
    !rel.includes("print-shopify-summary.js") &&
    !rel.includes("print-summary.js") &&
    !rel.includes("check-overview-fields.js")
  );
});

const fileContents = filesToScan.map((f) => ({
  path: path.relative(rootDir, f).replace(/\\/g, "/"),
  isTest: f.includes("scratch") || f.includes(".test.") || f.includes(".spec."),
  content: fs.readFileSync(f, "utf8"),
}));

console.log(`Scanning ${fileContents.length} source and test files...`);

const auditResults = {};

for (const [epKey, epConfig] of Object.entries(SHOPIFY_ENDPOINTS)) {
  auditResults[epKey] = {
    fieldsBefore: epConfig.fields.length,
    fieldDetails: [],
  };

  for (const field of epConfig.fields) {
    const srcRefs = [];
    const testRefs = [];

    for (const file of fileContents) {
      if (file.content.includes(field)) {
        if (file.isTest) testRefs.push(file.path);
        else srcRefs.push(file.path);
      }
    }

    auditResults[epKey].fieldDetails.push({
      field,
      srcAppCount: srcRefs.length,
      testCount: testRefs.length,
      srcAppFiles: srcRefs,
      testFiles: testRefs,
    });
  }
}

fs.writeFileSync(
  path.join(__dirname, "deep-audit-report.json"),
  JSON.stringify(auditResults, null, 2)
);

console.log("Deep audit completed. Saved to deep-audit-report.json");
