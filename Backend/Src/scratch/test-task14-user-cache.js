/**
 * Task #14 Auth/User Context Cache Unit Test Suite
 * Verifies high-performance user caching, organization context isolation,
 * user isolation, and cache invalidation mechanics.
 */

const assert = require("assert");
const {
  getCachedUser,
  setCachedUser,
  getCachedContext,
  setCachedContext,
  invalidateUserCache,
  clearAllUserCaches,
} = require("../utils/user-cache.util");

async function runTask14UserCacheTests() {
  console.log("==================================================");
  console.log("RUNNING TASK #14 AUTH/USER CONTEXT CACHE TESTS");
  console.log("==================================================");

  clearAllUserCaches();

  // 1. User Caching & Retrieval
  const fakeUserA = { _id: "user123", email: "clientA@vytalis.com", role: "client" };
  setCachedUser("user123", fakeUserA);
  const cachedUserA = getCachedUser("user123");
  assert.deepStrictEqual(cachedUserA, fakeUserA);
  console.log("✓ Test 1 Passed: User document caching and retrieval verified!");

  // 2. User Isolation
  const cachedUserB = getCachedUser("user456");
  assert.strictEqual(cachedUserB, null);
  console.log("✓ Test 2 Passed: User isolation verified (different user returns null)!");

  // 3. Organization Context Caching & Isolation
  const fakeContextA = { integrationUser: fakeUserA, organization: { _id: "org1", name: "Org 1" } };
  const fakeContextAOrg2 = { integrationUser: fakeUserA, organization: { _id: "org2", name: "Org 2" } };

  setCachedContext("user123", "org1", fakeContextA);
  setCachedContext("user123", "org2", fakeContextAOrg2);

  const resOrg1 = getCachedContext("user123", "org1");
  const resOrg2 = getCachedContext("user123", "org2");

  assert.strictEqual(resOrg1.organization._id, "org1");
  assert.strictEqual(resOrg2.organization._id, "org2");
  console.log("✓ Test 3 Passed: Organization-level context isolation verified!");

  // 4. Invalidation Mechanics
  invalidateUserCache("user123");
  assert.strictEqual(getCachedUser("user123"), null);
  assert.strictEqual(getCachedContext("user123", "org1"), null);
  console.log("✓ Test 4 Passed: Immediate cache invalidation verified!");

  console.log("--------------------------------------------------");
  console.log("ALL TASK #14 AUTH/USER CONTEXT CACHE TESTS PASSED!");
  console.log("--------------------------------------------------");
}

runTask14UserCacheTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ TASK #14 USER CACHE TESTS FAILED:", err);
    process.exit(1);
  });
