/**
 * Centralized In-Process Keyed Asynchronous Mutex.
 * Ensures sequential execution for concurrent operations sharing the same lock key (e.g. organizationId).
 *
 * SCOPE & ARCHITECTURE LIMITATION:
 * Single-Process Concurrency Safety ONLY.
 * Multi-instance horizontally scaled deployments (e.g. multiple Render instances) require
 * a distributed lock manager (e.g., Redis Redlock) or database-level transaction.
 */

const locks = new Map();

/**
 * Acquires a mutex lock for a specific string key.
 *
 * @param {string} key - Unique lock identifier (e.g. organizationId)
 * @returns {Promise<Function>} Release function to unlock after operation finishes
 */
const acquireLock = async (key) => {
  const lockKey = String(key);

  while (locks.has(lockKey)) {
    try {
      await locks.get(lockKey);
    } catch {
      // Ignore lock promise rejection and re-check
    }
  }

  let resolveLock;
  const lockPromise = new Promise((resolve) => {
    resolveLock = resolve;
  });

  locks.set(lockKey, lockPromise);

  return () => {
    if (locks.get(lockKey) === lockPromise) {
      locks.delete(lockKey);
    }
    resolveLock();
  };
};

module.exports = {
  acquireLock,
};
