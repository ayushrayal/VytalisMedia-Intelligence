/**
 * Logger utility abstraction for Vytalis Intelligence.
 * Exposes standardized info, warn, and error log handlers.
 */

const logger = {
  info: (...args) => {
    console.log("[INFO]", new Date().toISOString(), ...args);
  },
  warn: (...args) => {
    console.warn("[WARN]", new Date().toISOString(), ...args);
  },
  error: (...args) => {
    console.error("[ERROR]", new Date().toISOString(), ...args);
  },
};

module.exports = logger;
