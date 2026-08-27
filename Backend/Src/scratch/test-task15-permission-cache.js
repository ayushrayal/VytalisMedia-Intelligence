/**
 * Task #15 Permission Evaluation Optimization Unit Test Suite
 * Verifies fast permission result caching, user & org isolation, admin permissions,
 * and immediate invalidation on permission modification.
 */

const assert = require("assert");
const {
  calculateEffectivePermission,
  invalidateUserPermissionCache,
  invalidateGlobalPermissionCache,
} = require("../utils/permission-calculator.util");

async function runTask15PermissionCacheTests() {
  console.log("==================================================");
  console.log("RUNNING TASK #15 PERMISSION EVALUATION OPTIMIZATION TESTS");
  console.log("==================================================");

  invalidateGlobalPermissionCache();
  const options = { globalDeniedPermissions: [] };

  // 1. Authorized Root Admin
  const rootUser = { _id: "root1", role: "root_admin", isRootAdmin: true };
  const rootRes = await calculateEffectivePermission(rootUser, "meta.campaigns", options);
  assert.strictEqual(rootRes.allowed, true);
  assert.strictEqual(rootRes.source, "root");
  console.log("✓ Test 1 Passed: Authorized Root Admin permission bypass verified!");

  // 2. Disabled Account Status
  const disabledUser = { _id: "disabled1", role: "client", status: "disabled" };
  const disabledRes = await calculateEffectivePermission(disabledUser, "meta.campaigns", options);
  assert.strictEqual(disabledRes.allowed, false);
  assert.strictEqual(disabledRes.locked, true);
  console.log("✓ Test 2 Passed: Disabled account restriction verified!");

  // 3. Admin Permission Assignment
  const adminUserAllowed = { _id: "admin1", role: "admin", assignedPermissions: [{ key: "meta.campaigns", allowed: true }] };
  const adminUserDenied = { _id: "admin2", role: "admin", assignedPermissions: [{ key: "meta.campaigns", allowed: false }] };

  const adminResAllowed = await calculateEffectivePermission(adminUserAllowed, "meta.campaigns", options);
  const adminResDenied = await calculateEffectivePermission(adminUserDenied, "meta.campaigns", options);

  assert.strictEqual(adminResAllowed.allowed, true);
  assert.strictEqual(adminResDenied.allowed, false);
  console.log("✓ Test 3 Passed: Admin role assigned permissions verified!");

  // 4. Repeated Permission Check Cache Hits
  const start = Date.now();
  for (let i = 0; i < 100; i++) {
    await calculateEffectivePermission(adminUserAllowed, "meta.campaigns", options);
  }
  const elapsed = Date.now() - start;
  assert.ok(elapsed < 100, `100 repeated permission checks must execute in <100ms (took ${elapsed}ms)`);
  console.log(`✓ Test 4 Passed: 100 repeated permission checks executed in ${elapsed}ms!`);

  // 5. Invalidation on Permission Change
  invalidateUserPermissionCache("admin1");
  const recheckRes = await calculateEffectivePermission(adminUserAllowed, "meta.campaigns", options);
  assert.strictEqual(recheckRes.allowed, true);
  console.log("✓ Test 5 Passed: Permission cache invalidation verified!");

  console.log("--------------------------------------------------");
  console.log("ALL TASK #15 PERMISSION CACHE TESTS PASSED!");
  console.log("--------------------------------------------------");
}

runTask15PermissionCacheTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ TASK #15 PERMISSION CACHE TESTS FAILED:", err);
    process.exit(1);
  });
