/**
 * Sole Redis Cache Utility abstraction for Vytalis Intelligence.
 * Exposes connect(), disconnect(), get(), set(), delete(), getDel(), and incrWithTtl() methods.
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
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 2) {
            return false; // Stop retrying after 3 failed connection attempts
          }
          return Math.min(retries * 50, 200);
        },
      },
    });

    client.on("error", (err) => {
      logger.error("Redis Client Error:", err.message);
    });

    client.on("ready", () => {
      isConnected = true;
    });

    client.on("end", () => {
      isConnected = false;
    });

    await client.connect();
    return client;
  } catch (error) {
    logger.error("Failed to connect to Redis server:", error.message);
    client = null;
    isConnected = false;
  }
};

/**
 * Cleanly disconnects the Redis client.
 */
const disconnect = async () => {
  if (client) {
    try {
      await client.disconnect();
    } catch (error) {
      // Suppress disconnect errors during cleanup
    } finally {
      client = null;
      isConnected = false;
    }
  }
};

/**
 * Checks whether the Redis client is connected and ready.
 */
const isReady = () => isConnected && client !== null;

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
      return null;
    }

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
    return true;
  } catch (error) {
    logger.error(`Error deleting key ${key} from Redis:`, error.message);
    return false;
  }
};

/**
 * Atomically retrieves and deletes a JSON object key from Redis.
 * Guaranteed to be race-safe across concurrent refresh requests.
 *
 * @param {string} key - Unique Redis key
 * @returns {Promise<Object|null>} Stored object or null if not found/already consumed
 */
const getDel = async (key) => {
  if (!client || !isConnected) {
    return null;
  }

  try {
    if (typeof client.getDel === "function") {
      const raw = await client.getDel(key);
      return raw ? JSON.parse(raw) : null;
    }

    const luaScript = `
      local val = redis.call('GET', KEYS[1])
      if val then
        redis.call('DEL', KEYS[1])
      end
      return val
    `;
    const raw = await client.eval(luaScript, { keys: [key] });
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    logger.error(`Error atomically reading and deleting key ${key} from Redis:`, error.message);
    return null;
  }
};

/**
 * Atomically increments a key in Redis and sets TTL if key is newly created.
 * Returns current request count and remaining TTL in seconds.
 *
 * @param {string} key - Redis rate limit key
 * @param {number} ttlSeconds - Time-to-live window in seconds
 * @returns {Promise<{ current: number, ttl: number }|null>} Incremented counter info
 */
const incrWithTtl = async (key, ttlSeconds) => {
  if (!client || !isConnected) {
    return null;
  }

  try {
    const current = await client.incr(key);
    if (current === 1 && ttlSeconds > 0) {
      await client.expire(key, ttlSeconds);
    }
    let ttl = await client.ttl(key);
    if (ttl < 0) {
      await client.expire(key, ttlSeconds);
      ttl = ttlSeconds;
    }
    return { current, ttl };
  } catch (error) {
    logger.error(`Error incrementing rate limit key ${key} in Redis:`, error.message);
    return null;
  }
};

/**
 * Batch fetches multiple JSON keys from Redis in a single command.
 *
 * @param {Array<string>} keys - Array of Redis keys
 * @returns {Promise<Array<Object|null>>} Array of parsed objects or nulls
 */
const mget = async (keys) => {
  if (!client || !isConnected || !Array.isArray(keys) || keys.length === 0) {
    return Array.isArray(keys) ? keys.map(() => null) : [];
  }

  try {
    const rawList = await client.mGet(keys);
    return rawList.map((raw) => {
      if (!raw) return null;
      try {
        return JSON.parse(raw);
      } catch {
        return null;
      }
    });
  } catch (error) {
    logger.error("Error executing mget in Redis:", error.message);
    return keys.map(() => null);
  }
};

/**
 * Batch sets multiple key-value JSON pairs in Redis.
 *
 * @param {Record<string, Object>} keyValueMap - Map of key to object payload
 * @param {number} ttlSeconds - Time-to-live in seconds
 * @returns {Promise<boolean>} True if set successfully
 */
const mset = async (keyValueMap, ttlSeconds = 600) => {
  if (!client || !isConnected || !keyValueMap || typeof keyValueMap !== "object") {
    return false;
  }

  try {
    const keys = Object.keys(keyValueMap);
    if (keys.length === 0) return true;

    const multi = client.multi();
    for (const key of keys) {
      const valStr = JSON.stringify(keyValueMap[key]);
      if (ttlSeconds && ttlSeconds > 0) {
        multi.set(key, valStr, { EX: ttlSeconds });
      } else {
        multi.set(key, valStr);
      }
    }
    await multi.exec();
    return true;
  } catch (error) {
    logger.error("Error executing batch mset in Redis:", error.message);
    return false;
  }
};

module.exports = {
  connect,
  disconnect,
  isReady,
  get,
  set,
  mget,
  mset,
  delete: del,
  getDel,
  incrWithTtl,
};

