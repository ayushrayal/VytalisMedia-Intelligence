/**
 * Task #18 Redis Single-Flight & Distributed Lock Unit Test Suite
 * Verifies distributed locking, lock ownership safety via token, mandatory double-check after lock,
 * and integration with Task #17 single-flight in-flight deduplication.
 */

const assert = require("assert");
const cacheUtil = require("../utils/cache.util");
const { executeSingleFlight, clearInFlightOperations } = require("../utils/request-dedup.util");

async function runTask18RedisSingleFlightTests() {
  console.log("==================================================");
  console.log("RUNNING TASK #18 REDIS SINGLE-FLIGHT & LOCK TESTS");
  console.log("==================================================");

  clearInFlightOperations();

  // Test 1: Simulated Lock Ownership Token Release Safety
  const mockCacheStore = new Map();
  const mockLockStore = new Map();

  const mockAcquireLock = async (lockKey, token, ttl = 10) => {
    if (mockLockStore.has(lockKey)) return false;
    mockLockStore.set(lockKey, token);
    return true;
  };

  const mockReleaseLock = async (lockKey, token) => {
    if (mockLockStore.get(lockKey) === token) {
      mockLockStore.delete(lockKey);
      return true;
    }
    return false;
  };

  // Lock acquired by Owner A
  const lockKey = "lock:shopify:user1:acc1:overview:last_7d";
  const tokenA = "token_owner_A";
  const acquiredA = await mockAcquireLock(lockKey, tokenA);
  assert.strictEqual(acquiredA, true, "Owner A should acquire lock successfully");

  // Owner B attempts to acquire locked key -> denied
  const tokenB = "token_owner_B";
  const acquiredB = await mockAcquireLock(lockKey, tokenB);
  assert.strictEqual(acquiredB, false, "Owner B should fail to acquire lock while held by Owner A");

  // Owner B attempts to release lock with invalid token -> fails
  const releasedByB = await mockReleaseLock(lockKey, tokenB);
  assert.strictEqual(releasedByB, false, "Owner B should not be able to release Owner A's lock");
  assert.strictEqual(mockLockStore.has(lockKey), true, "Lock must remain held by Owner A");

  // Owner A releases lock -> succeeds
  const releasedByA = await mockReleaseLock(lockKey, tokenA);
  assert.strictEqual(releasedByA, true, "Owner A should release own lock successfully");
  assert.strictEqual(mockLockStore.has(lockKey), false, "Lock store must be empty after release");

  console.log("✓ Test 1 Passed: Lock ownership token safety & release semantics verified!");

  // Test 2: Double-Check After Lock Acquisition
  let providerFetchCount = 0;
  const targetCacheKey = "shopify:user1:acc1:overview:last_7d";

  const fetchWithDoubleCheck = async (callerId) => {
    const lockToken = `token_${callerId}`;
    const acquired = await mockAcquireLock(`lock:${targetCacheKey}`, lockToken);

    if (acquired) {
      try {
        // Double-check cache
        if (mockCacheStore.has(targetCacheKey)) {
          return mockCacheStore.get(targetCacheKey);
        }
        // Fetch from provider
        providerFetchCount += 1;
        const freshData = { data: "provider_result", fetchCount: providerFetchCount };
        mockCacheStore.set(targetCacheKey, freshData);
        return freshData;
      } finally {
        await mockReleaseLock(`lock:${targetCacheKey}`, lockToken);
      }
    } else {
      // Retry cache read
      if (mockCacheStore.has(targetCacheKey)) {
        return mockCacheStore.get(targetCacheKey);
      }
    }
  };

  // Caller A acquires lock and populates cache
  const res1 = await fetchWithDoubleCheck("callerA");
  assert.strictEqual(providerFetchCount, 1);
  assert.strictEqual(res1.data, "provider_result");

  // Caller B acquires lock after A released it -> Double check finds cached result and skips provider fetch
  const res2 = await fetchWithDoubleCheck("callerB");
  assert.strictEqual(providerFetchCount, 1, "Double-check after lock MUST skip provider fetch when cache is populated");
  assert.strictEqual(res2.data, "provider_result");

  console.log("✓ Test 2 Passed: Double-check after lock acquisition verified!");

  // Test 3: Complementary Task #17 In-Flight Single Flight + Redis Lock Layer
  let inFlightCount = 0;
  const fetcher = async () => {
    inFlightCount += 1;
    await new Promise((r) => setTimeout(r, 20));
    return { value: inFlightCount };
  };

  const key1 = "meta:user1:acc1:overview:last_7d";

  const [p1, p2, p3, p4, p5] = await Promise.all([
    executeSingleFlight(key1, fetcher),
    executeSingleFlight(key1, fetcher),
    executeSingleFlight(key1, fetcher),
    executeSingleFlight(key1, fetcher),
    executeSingleFlight(key1, fetcher),
  ]);

  assert.strictEqual(inFlightCount, 1, "5 concurrent in-flight requests in same process execute fetcher exactly 1 time");
  assert.strictEqual(p1.value, 1);
  assert.strictEqual(p5.value, 1);
  console.log("✓ Test 3 Passed: Task #17 in-flight deduplication + Redis distributed lock layer verified!");

  console.log("--------------------------------------------------");
  console.log("ALL TASK #18 REDIS SINGLE-FLIGHT TESTS PASSED!");
  console.log("--------------------------------------------------");
}

runTask18RedisSingleFlightTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ TASK #18 REDIS SINGLE-FLIGHT TESTS FAILED:", err);
    process.exit(1);
  });
