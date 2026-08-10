/**
 * Sole Redis Cache Utility abstraction for Vytalis Intelligence.
 * Exposes connect(), disconnect(), get(), set(), delete() methods.
 * Integrated with logger.util.js.
 */

const { createClient } = require("redis");
const { REDIS_CONFIG } = require("../config/cache.config");
const logger = require("./logger.util");

let client = null;
let isConnected = false;

/**
 * Initializes and connects the Redis client singleton.
 */
const connect = async () => {
  if (client && isConnected) {
    return client;
  }

  try {
    client = createClient({
      url: REDIS_CONFIG.url,
    });

    client.on("error", (err) => {
      logger.error("Redis Client Error", err.message);
    });

    client.on("connect", () => {
      logger.info("Redis client connecting...");
    });

    client.on("ready", () => {
      isConnected = true;
      logger.info("Redis client connected and ready.");
    });

    client.on("end", () => {
      isConnected = false;
      logger.info("Redis client disconnected.");
    });

    await client.connect();
    return client;
  } catch (error) {
    logger.error("Failed to connect to Redis server:", error.message);
    // Client remains null or disconnected; methods handle fallback safely
  }
};

/**
 * Cleanly disconnects the Redis client.
 */
const disconnect = async () => {
  if (client && isConnected) {
    try {
      await client.disconnect();
      isConnected = false;
      logger.info("Redis client disconnected successfully.");
    } catch (error) {
      logger.error("Error disconnecting Redis client:", error.message);
    }
  }
};

/**
 * Fetches and parses a cached JSON object from Redis.
 *
 * @param {string} key - Unique Redis cache key
 * @returns {Promise<Object|null>} Cached object or null if cache MISS/error
 */
const get = async (key) => {
  if (!client || !isConnected) {
    logger.warn("Redis client not connected. Skipping cache lookup for key:", key);
    return null;
  }

  try {
    const rawData = await client.get(key);
    if (!rawData) {
      logger.info(`[Redis MISS] Key: ${key}`);
      return null;
    }

    logger.info(`[Redis HIT] Key: ${key}`);
    return JSON.parse(rawData);
  } catch (error) {
    logger.error(`Error reading key ${key} from Redis:`, error.message);
    return null;
  }
};

/**
 * Serializes and stores an object in Redis with an independent TTL.
 *
 * @param {string} key - Unique Redis cache key
 * @param {Object} value - Object payload to cache
 * @param {number} ttlSeconds - Expiration time in seconds
 * @returns {Promise<boolean>} True if set successfully
 */
const set = async (key, value, ttlSeconds) => {
  if (!client || !isConnected) {
    logger.warn("Redis client not connected. Skipping cache set for key:", key);
    return false;
  }

  try {
    const serialized = JSON.stringify(value);
    if (ttlSeconds && ttlSeconds > 0) {
      await client.set(key, serialized, { EX: ttlSeconds });
    } else {
      await client.set(key, serialized);
    }
    logger.info(`[Redis SET] Key: ${key} | TTL: ${ttlSeconds}s`);
    return true;
  } catch (error) {
    logger.error(`Error setting key ${key} in Redis:`, error.message);
    return false;
  }
};

/**
 * Deletes a key from Redis.
 *
 * @param {string} key - Unique Redis cache key
 * @returns {Promise<boolean>} True if deleted
 */
const del = async (key) => {
  if (!client || !isConnected) {
    return false;
  }

  try {
    await client.del(key);
    logger.info(`[Redis DELETE] Key: ${key}`);
    return true;
  } catch (error) {
    logger.error(`Error deleting key ${key} from Redis:`, error.message);
    return false;
  }
};

module.exports = {
  connect,
  disconnect,
  get,
  set,
  delete: del,
};
