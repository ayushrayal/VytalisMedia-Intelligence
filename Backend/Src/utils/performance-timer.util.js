const logger = require("./logger.util");

/**
 * High-precision timer utility using process.hrtime.bigint()
 */
class PerformanceTimer {
  constructor(endpointName) {
    this.endpointName = endpointName || "Unknown Endpoint";
    this.startTime = process.hrtime.bigint();
    this.mongoTimeNs = 0n;
    this.redisTimeNs = 0n;
    this.permCalcTimeNs = 0n;
    this.queryCount = 0;
  }

  async timeMongo(asyncFn) {
    this.queryCount++;
    const start = process.hrtime.bigint();
    try {
      return await asyncFn();
    } finally {
      this.mongoTimeNs += process.hrtime.bigint() - start;
    }
  }

  async timeRedis(asyncFn) {
    const start = process.hrtime.bigint();
    try {
      return await asyncFn();
    } finally {
      this.redisTimeNs += process.hrtime.bigint() - start;
    }
  }

  async timePermCalc(asyncFn) {
    const start = process.hrtime.bigint();
    try {
      return await asyncFn();
    } finally {
      this.permCalcTimeNs += process.hrtime.bigint() - start;
    }
  }

  getMetrics() {
    const totalNs = process.hrtime.bigint() - this.startTime;
    const totalMs = Number(totalNs) / 1e6;
    const mongoMs = Number(this.mongoTimeNs) / 1e6;
    const redisMs = Number(this.redisTimeNs) / 1e6;
    const permCalcMs = Number(this.permCalcTimeNs) / 1e6;
    const nodeMs = Math.max(0, totalMs - mongoMs - redisMs - permCalcMs);

    return {
      endpoint: this.endpointName,
      totalTimeMs: Number(totalMs.toFixed(2)),
      mongoTimeMs: Number(mongoMs.toFixed(2)),
      redisTimeMs: Number(redisMs.toFixed(2)),
      permCalcTimeMs: Number(permCalcMs.toFixed(2)),
      nodeProcTimeMs: Number(nodeMs.toFixed(2)),
      queryCount: this.queryCount,
    };
  }

  attachServerTimingHeader(res) {
    const metrics = this.getMetrics();
    if (res && typeof res.setHeader === "function") {
      const serverTiming = `total;dur=${metrics.totalTimeMs}, mongo;dur=${metrics.mongoTimeMs}, redis;dur=${metrics.redisTimeMs}, perm;dur=${metrics.permCalcTimeMs}, node;dur=${metrics.nodeProcTimeMs}`;
      res.setHeader("Server-Timing", serverTiming);
      res.setHeader("X-DB-Query-Count", String(metrics.queryCount));
    }
    return metrics;
  }
}

const createTimer = (name) => new PerformanceTimer(name);

module.exports = {
  PerformanceTimer,
  createTimer,
};
