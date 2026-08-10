/**
 * Cache configuration & TTL jitter utility for Vytalis Intelligence.
 */

const REDIS_CONFIG = {
  url: process.env.REDIS_URI || "redis://127.0.0.1:6379",
};

/**
 * Calculates a randomized TTL by adding dynamic jitter (±10% of base TTL)
 * to prevent cache stampedes and synchronized cache expirations.
 *
 * @param {number} baseTtl - Base TTL in seconds
 * @param {number} [jitterPercent=0.10] - Jitter fraction (default 10%)
 * @returns {number} Integer TTL in seconds with jitter applied
 */
const calculateJitteredTtl = (baseTtl, jitterPercent = 0.10) => {
  if (!baseTtl || typeof baseTtl !== "number" || baseTtl <= 0) {
    return 300;
  }
  const minMultiplier = 1 - jitterPercent; // e.g. 0.90
  const maxMultiplier = 1 + jitterPercent; // e.g. 1.10
  const randomMultiplier = minMultiplier + Math.random() * (maxMultiplier - minMultiplier);
  return Math.round(baseTtl * randomMultiplier);
};

module.exports = {
  REDIS_CONFIG,
  calculateJitteredTtl,
};
