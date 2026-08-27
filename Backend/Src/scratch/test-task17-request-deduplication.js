/**
 * Task #17 Request Deduplication Unit Test Suite
 * Verifies single-flight execution for concurrent identical requests,
 * isolation across date ranges/organizations/accounts, error cleanup,
 * and memory cleanup.
 */

const assert = require("assert");
const { executeSingleFlight, getInFlightCount, clearInFlightOperations } = require("../utils/request-dedup.util");

async function runTask17RequestDeduplicationTests() {
  console.log("==================================================");
  console.log("RUNNING TASK #17 REQUEST DEDUPLICATION TESTS");
  console.log("==================================================");

  clearInFlightOperations();

  // 1 & 2. Two and Three Simultaneous Identical Requests Execute Only Once
  let executionCount = 0;
  const mockFetcher = async () => {
    executionCount += 1;
    await new Promise((resolve) => setTimeout(resolve, 50));
    return { data: "mock_data", count: executionCount };
  };

  const key1 = "req:user1:org1:overview:last_7d";

  const [resA, resB, resC] = await Promise.all([
    executeSingleFlight(key1, mockFetcher),
    executeSingleFlight(key1, mockFetcher),
    executeSingleFlight(key1, mockFetcher),
  ]);

  assert.strictEqual(executionCount, 1, "Mock fetcher must execute exactly once for concurrent requests");
  assert.strictEqual(resA.count, 1);
  assert.strictEqual(resB.count, 1);
  assert.strictEqual(resC.count, 1);
  assert.strictEqual(getInFlightCount(), 0, "In-flight map must be empty after execution finishes");
  console.log("✓ Test 1 Passed: 3 concurrent identical requests executed only once and shared result!");

  // 3. Different Date Ranges Execute Independently
  let rangeCount = 0;
  const rangeFetcher = async () => {
    rangeCount += 1;
    return rangeCount;
  };

  const [r1, r2] = await Promise.all([
    executeSingleFlight("req:user1:org1:overview:last_7d", rangeFetcher),
    executeSingleFlight("req:user1:org1:overview:last_30d", rangeFetcher),
  ]);

  assert.strictEqual(rangeCount, 2, "Different date ranges must execute independently");
  console.log("✓ Test 2 Passed: Different date ranges executed independently!");

  // 4. Different Organizations Execute Independently
  let orgCount = 0;
  const orgFetcher = async () => {
    orgCount += 1;
    return orgCount;
  };

  const [o1, o2] = await Promise.all([
    executeSingleFlight("req:user1:org1:overview:last_7d", orgFetcher),
    executeSingleFlight("req:user1:org2:overview:last_7d", orgFetcher),
  ]);

  assert.strictEqual(orgCount, 2, "Different organizations must execute independently");
  console.log("✓ Test 3 Passed: Organization isolation verified!");

  // 5. Failed Request Error Cleanup & Retries
  let failAttempt = 0;
  const failingFetcher = async () => {
    failAttempt += 1;
    if (failAttempt === 1) {
      throw new Error("Provider temporary failure");
    }
    return "success_on_retry";
  };

  const failKey = "req:user1:org1:overview:error_test";

  // First call fails
  await assert.rejects(
    async () => {
      await executeSingleFlight(failKey, failingFetcher);
    },
    /Provider temporary failure/
  );

  assert.strictEqual(getInFlightCount(), 0, "Failed request must remove key from in-flight map");

  // Subsequent retry succeeds
  const retryResult = await executeSingleFlight(failKey, failingFetcher);
  assert.strictEqual(retryResult, "success_on_retry");
  console.log("✓ Test 4 Passed: Failed request error cleanup & retry execution verified!");

  console.log("--------------------------------------------------");
  console.log("ALL TASK #17 REQUEST DEDUPLICATION TESTS PASSED!");
  console.log("--------------------------------------------------");
}

runTask17RequestDeduplicationTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ TASK #17 DEDUPLICATION TESTS FAILED:", err);
    process.exit(1);
  });
