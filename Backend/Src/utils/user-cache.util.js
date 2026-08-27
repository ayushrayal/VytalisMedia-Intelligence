/**
 * User Context & Authentication Cache Utility for Vytalis Intelligence (Phase 3 - Task #14).
 * High-performance, short-lived in-memory cache to eliminate repetitive User/Organization DB spam
 * during concurrent API request execution.
 *
 * Enforces strict user-level and organization-level isolation.
 */

const USER_CACHE_TTL_MS = 30 * 1000; // 30 seconds
const CONTEXT_CACHE_TTL_MS = 30 * 1000; // 30 seconds

const userCache = new Map();
const contextCache = new Map();

/**
 * Retrieves cached user document by userId if unexpired.
 */
function getCachedUser(userId) {
  if (!userId) return null;
  const key = String(userId);
  const entry = userCache.get(key);
  if (!entry) return null;

  if (Date.now() - entry.timestamp > USER_CACHE_TTL_MS) {
    userCache.delete(key);
    return null;
  }

  return entry.user;
}

/**
 * Sets cached user document for userId.
 */
function setCachedUser(userId, userDoc) {
  if (!userId || !userDoc) return;
  const key = String(userId);
  userCache.set(key, {
    user: userDoc,
    timestamp: Date.now(),
  });
}

/**
 * Retrieves cached integration context for userId and explicitOrgId.
 */
function getCachedContext(userId, explicitOrgId = "default") {
  if (!userId) return null;
  const key = `${String(userId)}:${explicitOrgId || "default"}`;
  const entry = contextCache.get(key);
  if (!entry) return null;

  if (Date.now() - entry.timestamp > CONTEXT_CACHE_TTL_MS) {
    contextCache.delete(key);
    return null;
  }

  return entry.context;
}

/**
 * Sets cached integration context.
 */
function setCachedContext(userId, explicitOrgId, context) {
  if (!userId || !context) return;
  const key = `${String(userId)}:${explicitOrgId || "default"}`;
  contextCache.set(key, {
    context,
    timestamp: Date.now(),
  });
}

/**
 * Invalidates all cache entries for a specific userId.
 */
function invalidateUserCache(userId) {
  if (!userId) return;
  const userKey = String(userId);
  userCache.delete(userKey);

  for (const k of contextCache.keys()) {
    if (k.startsWith(`${userKey}:`)) {
      contextCache.delete(k);
    }
  }
}

/**
 * Clears all user caches.
 */
function clearAllUserCaches() {
  userCache.clear();
  contextCache.clear();
}

module.exports = {
  getCachedUser,
  setCachedUser,
  getCachedContext,
  setCachedContext,
  invalidateUserCache,
  clearAllUserCaches,
};
