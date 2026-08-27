/**
 * Backend Single-Flight In-Flight Request Deduplication Utility for Vytalis Intelligence (Phase 3 - Task #17).
 * Shares in-flight asynchronous operations for identical concurrent requests, preventing provider/database stampedes.
 *
 * Scoped strictly by user ID, organization ID, endpoint, and date parameters to preserve 100% tenant isolation.
 */

const inFlightOperations = new Map();

/**
 * Executes or joins an in-flight asynchronous operation.
 *
 * @param {string} key - Deterministic single-flight key (includes userId, organizationId, dateRange)
 * @param {Function} asyncFn - Async function returning a promise
 * @returns {Promise<any>}
 */
const executeSingleFlight = async (key, asyncFn) => {
  if (!key || typeof asyncFn !== "function") {
    return asyncFn();
  }

  if (inFlightOperations.has(key)) {
    return inFlightOperations.get(key);
  }

  const promise = (async () => {
    try {
      return await asyncFn();
    } finally {
      inFlightOperations.delete(key);
    }
  })();

  inFlightOperations.set(key, promise);
  return promise;
};

/**
 * Returns current size of in-flight operations map (for diagnostic & testing purposes).
 */
const getInFlightCount = () => inFlightOperations.size;

/**
 * Clears all pending in-flight operations (for testing teardown).
 */
const clearInFlightOperations = () => inFlightOperations.clear();

module.exports = {
  executeSingleFlight,
  getInFlightCount,
  clearInFlightOperations,
};
