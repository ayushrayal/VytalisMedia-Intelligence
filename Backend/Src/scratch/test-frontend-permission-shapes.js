const { ALL_PERMISSION_KEYS } = require("../config/permission-registry");

/**
 * Mirror of frontend parsePermissionsStructure helper
 */
const parsePermissionsStructure = (structure) => {
  const result = {};
  if (!structure) return result;

  // CASE 1: Array format [{ key: "meta.campaigns", allowed: true }]
  if (Array.isArray(structure)) {
    structure.forEach((entry) => {
      if (entry && entry.key && ALL_PERMISSION_KEYS.includes(entry.key)) {
        const val = typeof entry.allowed === "object" && entry.allowed !== null
          ? entry.allowed.allowed
          : entry.allowed;
        result[entry.key] = Boolean(val);
      }
    });
    return result;
  }

  // CASE 4: Map instance
  if (typeof structure.get === "function" && typeof structure.forEach === "function") {
    structure.forEach((val, key) => {
      if (ALL_PERMISSION_KEYS.includes(key)) {
        const boolVal = typeof val === "object" && val !== null ? val.allowed : val;
        result[key] = Boolean(boolVal);
      }
    });
    return result;
  }

  // CASE 2 & 3: Object map { "meta.campaigns": true } OR { "meta.campaigns": { allowed: true } }
  if (typeof structure === "object") {
    Object.entries(structure).forEach(([key, val]) => {
      if (ALL_PERMISSION_KEYS.includes(key)) {
        let boolVal = false;
        if (typeof val === "object" && val !== null) {
          boolVal = Boolean(val.allowed);
        } else {
          boolVal = Boolean(val);
        }
        result[key] = boolVal;
      }
    });
    return result;
  }

  return result;
};

const runShapeTests = () => {
  console.log("\n==================================================");
  console.log("FRONTEND PERMISSION STRUCTURE PARSING REGRESSION TEST");
  console.log("==================================================\n");

  // SHAPE A: Array format
  const shapeA = [
    { key: "meta.campaigns", allowed: true },
    { key: "meta.adsets", allowed: false },
    { key: "dashboard.view", allowed: true },
  ];

  const resA = parsePermissionsStructure(shapeA);
  console.log("[SHAPE A - Array] Result:", resA);
  if (resA["meta.campaigns"] !== true || resA["meta.adsets"] !== false || resA["dashboard.view"] !== true) {
    throw new Error("Shape A (Array) parsing failed");
  }

  // SHAPE B: Object map with boolean values
  const shapeB = {
    "meta.campaigns": true,
    "meta.adsets": false,
    "dashboard.view": true,
  };

  const resB = parsePermissionsStructure(shapeB);
  console.log("[SHAPE B - Object Map Booleans] Result:", resB);
  if (resB["meta.campaigns"] !== true || resB["meta.adsets"] !== false || resB["dashboard.view"] !== true) {
    throw new Error("Shape B (Object Map Booleans) parsing failed");
  }

  // SHAPE C: Object map with nested object values
  const shapeC = {
    "meta.campaigns": { allowed: true },
    "meta.adsets": { allowed: false },
    "dashboard.view": { allowed: true },
  };

  const resC = parsePermissionsStructure(shapeC);
  console.log("[SHAPE C - Object Map Nested Objects] Result:", resC);
  if (resC["meta.campaigns"] !== true || resC["meta.adsets"] !== false || resC["dashboard.view"] !== true) {
    throw new Error("Shape C (Object Map Nested Objects) parsing failed");
  }

  // SHAPE D: Fallback to effectivePermissions object
  const shapeD_assigned = null;
  const shapeD_effective = {
    "meta.campaigns": { allowed: true, locked: false },
    "meta.adsets": { allowed: false, locked: true },
  };

  const resD_assigned = parsePermissionsStructure(shapeD_assigned);
  const resD_effective = parsePermissionsStructure(shapeD_effective);
  const resD = Object.keys(resD_assigned).length > 0 ? resD_assigned : resD_effective;

  console.log("[SHAPE D - Fallback EffectivePermissions] Result:", resD);
  if (resD["meta.campaigns"] !== true || resD["meta.adsets"] !== false) {
    throw new Error("Shape D (Fallback EffectivePermissions) parsing failed");
  }

  console.log("\n==================================================");
  console.log("ALL 4 PARSING SHAPE TESTS PASSED SUCCESSFULLY!");
  console.log("==================================================\n");
};

runShapeTests();
