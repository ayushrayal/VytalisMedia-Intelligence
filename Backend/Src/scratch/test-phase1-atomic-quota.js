/**
 * Test Suite 3: In-Process Keyed Mutex Member Quota Concurrency Verification
 * Tests that 2 concurrent member creation requests at slot 5 (4 active out of limit 5) result in:
 * - Exactly 1 SUCCESS (200/201)
 * - Exactly 1 REJECTION (400 Quota Error)
 * - Final Active Member Count = 5 (NEVER 6)
 */

const assert = require("assert");
const { acquireLock } = require("../utils/async-mutex.util");

async function runAtomicQuotaTests() {
  console.log("==================================================");
  console.log("RUNNING ATOMIC MEMBER QUOTA CONCURRENCY TEST SUITE");
  console.log("==================================================");

  const orgId = "org-test-quota-123";
  const limit = 5;
  let activeMemberCount = 4; // Slot 5 is available for ONLY ONE request

  // Simulated member creation handler using acquireLock mutex
  async function createMember(email) {
    const releaseLock = await acquireLock(orgId);
    try {
      // Simulate async DB count check
      await new Promise((r) => setTimeout(r, 20));
      if (activeMemberCount >= limit) {
        return { status: 400, error: `Maximum limit of ${limit} active members reached.` };
      }

      // Simulate async user creation
      await new Promise((r) => setTimeout(r, 20));
      activeMemberCount += 1;
      return { status: 201, message: "Member created", activeCount: activeMemberCount };
    } finally {
      releaseLock();
    }
  }

  // Fire 2 concurrent member creation requests at the exact same moment
  console.log("Launching 2 concurrent member creation requests for slot 5...");
  const [res1, res2] = await Promise.all([
    createMember("member1@test.com"),
    createMember("member2@test.com"),
  ]);

  console.log("Response 1:", res1);
  console.log("Response 2:", res2);
  console.log("Final Active Member Count:", activeMemberCount);

  // Assertions
  const statuses = [res1.status, res2.status].sort();
  assert.deepStrictEqual(statuses, [201, 400], "Concurrent requests must result in exactly 1 Success (201) and 1 Quota Rejection (400)");
  assert.strictEqual(activeMemberCount, 5, "Final active member count must equal exactly 5 (NEVER 6)");

  console.log("✓ Test Passed: Single-process mutex prevented race condition! Final count = 5 (1 succeeded, 1 rejected).");
  console.log("--------------------------------------------------");
  console.log("ATOMIC QUOTA CONCURRENCY TESTS PASSED CLEANLY!");
  console.log("--------------------------------------------------");
}

runAtomicQuotaTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ ATOMIC QUOTA TEST FAILED:", err);
    process.exit(1);
  });
