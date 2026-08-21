const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);
require("dotenv").config();

const connectDB = require("../config/db");
const cacheUtil = require("../utils/cache.util");
const User = require("../models/user.model");
const Organization = require("../models/organization.model");
const AdminAssignment = require("../models/admin-assignment.model");
const { calculateBatchEffectivePermissions } = require("../utils/permission-calculator.util");
const { PerformanceTimer } = require("../utils/performance-timer.util");

const runFullBenchmark = async () => {
  try {
    await connectDB();
    if (cacheUtil.connect) {
      await cacheUtil.connect();
    }

    console.log("\n==================================================");
    console.log("PERFORMANCE BENCHMARK: PERMISSION CALCULATION BOTTLENECK");
    console.log("==================================================");

    const pageSizes = [25, 50, 100];
    const benchmarkResults = [];

    // Helper to clear permission caches in Redis for COLD CACHE testing
    const clearPermissionCacheInRedis = async () => {
      // Invalidate global, org, and user versions by setting version counters to random high numbers
      await cacheUtil.incrWithTtl("perm_ver:global", 3600);
    };

    // --------------------------------------------------
    // 1. BENCHMARK /api/admin/users/clients
    // --------------------------------------------------
    for (const limit of pageSizes) {
      // COLD CACHE
      await clearPermissionCacheInRedis();
      const coldTimer = new PerformanceTimer("getAllClients_cold");
      const clientFilter = { role: "client" };

      const [clientTotal, clients] = await coldTimer.timeMongo(() =>
        Promise.all([
          User.countDocuments(clientFilter),
          User.find(clientFilter)
            .select("name email role status organizationId assignedClientId shopifyEnabled attributionEnabled isRootAdmin lastActiveAt createdAt")
            .populate("organizationId", "name ownerId memberLimit status")
            .sort({ createdAt: -1 })
            .limit(limit)
            .lean(),
        ])
      );

      const clientOrgIds = clients.map((c) => (c.organizationId ? c.organizationId._id : null)).filter(Boolean);
      let memberCountsMap = {};
      let adminAssignmentsMap = {};

      if (clientOrgIds.length > 0) {
        const [memberCounts, assignments] = await coldTimer.timeMongo(() =>
          Promise.all([
            User.aggregate([
              { $match: { organizationId: { $in: clientOrgIds }, role: "member", status: "active" } },
              { $group: { _id: "$organizationId", count: { $sum: 1 } } },
            ]),
            AdminAssignment.find({ organizationId: { $in: clientOrgIds }, status: "active" })
              .populate("adminId", "name email")
              .lean(),
          ])
        );

        memberCounts.forEach((m) => { memberCountsMap[m._id.toString()] = m.count; });
        assignments.forEach((a) => {
          const oId = a.organizationId.toString();
          if (!adminAssignmentsMap[oId]) adminAssignmentsMap[oId] = [];
          if (a.adminId) adminAssignmentsMap[oId].push(a.adminId);
        });
      }

      const batchPermMapCold = await calculateBatchEffectivePermissions(clients, coldTimer);
      const sanitizedClientsCold = clients.map((c) => ({
        ...c,
        activeMembersCount: c.organizationId ? memberCountsMap[c.organizationId._id.toString()] || 0 : 0,
        memberLimit: (c.organizationId && c.organizationId.memberLimit) || 5,
        assignedAdmins: c.organizationId ? adminAssignmentsMap[c.organizationId._id.toString()] || [] : [],
        effectivePermissions: batchPermMapCold.get(String(c._id)) || {},
      }));

      const coldMetrics = coldTimer.getMetrics();
      const coldPayloadSize = Buffer.byteLength(JSON.stringify(sanitizedClientsCold));

      benchmarkResults.push({
        endpoint: "/api/admin/users/clients",
        pageSize: limit,
        cacheState: "COLD",
        totalTimeMs: coldMetrics.totalTimeMs,
        mongoTimeMs: coldMetrics.mongoTimeMs,
        permCalcTimeMs: coldMetrics.permCalcTimeMs,
        redisTimeMs: coldMetrics.redisTimeMs,
        nodeProcTimeMs: coldMetrics.nodeProcTimeMs,
        queryCount: coldMetrics.queryCount,
        payloadSize: coldPayloadSize,
      });

      // WARM CACHE (Second run with cached permissions in Redis)
      const warmTimer = new PerformanceTimer("getAllClients_warm");
      const [, clientsWarm] = await warmTimer.timeMongo(() =>
        Promise.all([
          User.countDocuments(clientFilter),
          User.find(clientFilter)
            .select("name email role status organizationId assignedClientId shopifyEnabled attributionEnabled isRootAdmin lastActiveAt createdAt")
            .populate("organizationId", "name ownerId memberLimit status")
            .sort({ createdAt: -1 })
            .limit(limit)
            .lean(),
        ])
      );

      if (clientOrgIds.length > 0) {
        await warmTimer.timeMongo(() =>
          Promise.all([
            User.aggregate([
              { $match: { organizationId: { $in: clientOrgIds }, role: "member", status: "active" } },
              { $group: { _id: "$organizationId", count: { $sum: 1 } } },
            ]),
            AdminAssignment.find({ organizationId: { $in: clientOrgIds }, status: "active" })
              .populate("adminId", "name email")
              .lean(),
          ])
        );
      }

      const batchPermMapWarm = await calculateBatchEffectivePermissions(clientsWarm, warmTimer);
      const sanitizedClientsWarm = clientsWarm.map((c) => ({
        ...c,
        effectivePermissions: batchPermMapWarm.get(String(c._id)) || {},
      }));

      const warmMetrics = warmTimer.getMetrics();
      const warmPayloadSize = Buffer.byteLength(JSON.stringify(sanitizedClientsWarm));

      benchmarkResults.push({
        endpoint: "/api/admin/users/clients",
        pageSize: limit,
        cacheState: "WARM",
        totalTimeMs: warmMetrics.totalTimeMs,
        mongoTimeMs: warmMetrics.mongoTimeMs,
        permCalcTimeMs: warmMetrics.permCalcTimeMs,
        redisTimeMs: warmMetrics.redisTimeMs,
        nodeProcTimeMs: warmMetrics.nodeProcTimeMs,
        queryCount: warmMetrics.queryCount,
        payloadSize: warmPayloadSize,
      });
    }

    // --------------------------------------------------
    // 2. BENCHMARK /api/admin/users/members
    // --------------------------------------------------
    for (const limit of pageSizes) {
      // COLD CACHE
      await clearPermissionCacheInRedis();
      const coldTimer = new PerformanceTimer("getAllMembers_cold");
      const memberFilter = { role: "member" };

      const [, membersCold] = await coldTimer.timeMongo(() =>
        Promise.all([
          User.countDocuments(memberFilter),
          User.find(memberFilter)
            .select("name email role status organizationId assignedClientId lastActiveAt createdAt")
            .populate("organizationId", "name ownerId status")
            .populate("assignedClientId", "name email")
            .sort({ createdAt: -1 })
            .limit(limit)
            .lean(),
        ])
      );

      const batchPermMapCold = await calculateBatchEffectivePermissions(membersCold, coldTimer);
      const sanitizedMembersCold = membersCold.map((m) => ({
        ...m,
        effectivePermissions: batchPermMapCold.get(String(m._id)) || {},
      }));

      const coldMetrics = coldTimer.getMetrics();
      const coldPayloadSize = Buffer.byteLength(JSON.stringify(sanitizedMembersCold));

      benchmarkResults.push({
        endpoint: "/api/admin/users/members",
        pageSize: limit,
        cacheState: "COLD",
        totalTimeMs: coldMetrics.totalTimeMs,
        mongoTimeMs: coldMetrics.mongoTimeMs,
        permCalcTimeMs: coldMetrics.permCalcTimeMs,
        redisTimeMs: coldMetrics.redisTimeMs,
        nodeProcTimeMs: coldMetrics.nodeProcTimeMs,
        queryCount: coldMetrics.queryCount,
        payloadSize: coldPayloadSize,
      });

      // WARM CACHE
      const warmTimer = new PerformanceTimer("getAllMembers_warm");
      const [, membersWarm] = await warmTimer.timeMongo(() =>
        Promise.all([
          User.countDocuments(memberFilter),
          User.find(memberFilter)
            .select("name email role status organizationId assignedClientId lastActiveAt createdAt")
            .populate("organizationId", "name ownerId status")
            .populate("assignedClientId", "name email")
            .sort({ createdAt: -1 })
            .limit(limit)
            .lean(),
        ])
      );

      const batchPermMapWarm = await calculateBatchEffectivePermissions(membersWarm, warmTimer);
      const sanitizedMembersWarm = membersWarm.map((m) => ({
        ...m,
        effectivePermissions: batchPermMapWarm.get(String(m._id)) || {},
      }));

      const warmMetrics = warmTimer.getMetrics();
      const warmPayloadSize = Buffer.byteLength(JSON.stringify(sanitizedMembersWarm));

      benchmarkResults.push({
        endpoint: "/api/admin/users/members",
        pageSize: limit,
        cacheState: "WARM",
        totalTimeMs: warmMetrics.totalTimeMs,
        mongoTimeMs: warmMetrics.mongoTimeMs,
        permCalcTimeMs: warmMetrics.permCalcTimeMs,
        redisTimeMs: warmMetrics.redisTimeMs,
        nodeProcTimeMs: warmMetrics.nodeProcTimeMs,
        queryCount: warmMetrics.queryCount,
        payloadSize: warmPayloadSize,
      });
    }

    // --------------------------------------------------
    // 3. BENCHMARK /api/admin/users/admins
    // --------------------------------------------------
    for (const limit of pageSizes) {
      // COLD CACHE
      await clearPermissionCacheInRedis();
      const coldTimer = new PerformanceTimer("getAllAdmins_cold");
      const adminFilter = { role: { $in: ["admin", "root_admin"] } };

      const [, adminsCold] = await coldTimer.timeMongo(() =>
        Promise.all([
          User.countDocuments(adminFilter),
          User.find(adminFilter)
            .select("name email role status isRootAdmin lastActiveAt createdAt")
            .sort({ createdAt: -1 })
            .limit(limit)
            .lean(),
        ])
      );

      const adminIds = adminsCold.map((a) => a._id);
      let adminAssignmentsMap = {};
      if (adminIds.length > 0) {
        const assignments = await coldTimer.timeMongo(() =>
          AdminAssignment.find({ adminId: { $in: adminIds }, status: "active" })
            .populate("organizationId", "name ownerId")
            .lean()
        );
        assignments.forEach((a) => {
          const aId = a.adminId.toString();
          if (!adminAssignmentsMap[aId]) adminAssignmentsMap[aId] = [];
          if (a.organizationId) adminAssignmentsMap[aId].push(a.organizationId);
        });
      }

      const batchPermMapCold = await calculateBatchEffectivePermissions(adminsCold, coldTimer);
      const sanitizedAdminsCold = adminsCold.map((a) => ({
        ...a,
        assignedOrganizations: adminAssignmentsMap[a._id.toString()] || [],
        effectivePermissions: batchPermMapCold.get(String(a._id)) || {},
      }));

      const coldMetrics = coldTimer.getMetrics();
      const coldPayloadSize = Buffer.byteLength(JSON.stringify(sanitizedAdminsCold));

      benchmarkResults.push({
        endpoint: "/api/admin/users/admins",
        pageSize: limit,
        cacheState: "COLD",
        totalTimeMs: coldMetrics.totalTimeMs,
        mongoTimeMs: coldMetrics.mongoTimeMs,
        permCalcTimeMs: coldMetrics.permCalcTimeMs,
        redisTimeMs: coldMetrics.redisTimeMs,
        nodeProcTimeMs: coldMetrics.nodeProcTimeMs,
        queryCount: coldMetrics.queryCount,
        payloadSize: coldPayloadSize,
      });

      // WARM CACHE
      const warmTimer = new PerformanceTimer("getAllAdmins_warm");
      const [, adminsWarm] = await warmTimer.timeMongo(() =>
        Promise.all([
          User.countDocuments(adminFilter),
          User.find(adminFilter)
            .select("name email role status isRootAdmin lastActiveAt createdAt")
            .sort({ createdAt: -1 })
            .limit(limit)
            .lean(),
        ])
      );

      if (adminIds.length > 0) {
        await warmTimer.timeMongo(() =>
          AdminAssignment.find({ adminId: { $in: adminIds }, status: "active" })
            .populate("organizationId", "name ownerId")
            .lean()
        );
      }

      const batchPermMapWarm = await calculateBatchEffectivePermissions(adminsWarm, warmTimer);
      const sanitizedAdminsWarm = adminsWarm.map((a) => ({
        ...a,
        effectivePermissions: batchPermMapWarm.get(String(a._id)) || {},
      }));

      const warmMetrics = warmTimer.getMetrics();
      const warmPayloadSize = Buffer.byteLength(JSON.stringify(sanitizedAdminsWarm));

      benchmarkResults.push({
        endpoint: "/api/admin/users/admins",
        pageSize: limit,
        cacheState: "WARM",
        totalTimeMs: warmMetrics.totalTimeMs,
        mongoTimeMs: warmMetrics.mongoTimeMs,
        permCalcTimeMs: warmMetrics.permCalcTimeMs,
        redisTimeMs: warmMetrics.redisTimeMs,
        nodeProcTimeMs: warmMetrics.nodeProcTimeMs,
        queryCount: warmMetrics.queryCount,
        payloadSize: warmPayloadSize,
      });
    }

    // PRINT FORMATTED BENCHMARK TABLE
    console.log("\n========================================================================================================================");
    console.log("BENCHMARK RESULTS TABLE (BEFORE VS AFTER OPTIMIZATION)");
    console.log("========================================================================================================================");
    console.log("| Endpoint | Page Size | Cache State | Total Time (ms) | Mongo Time (ms) | Perm Calc Time (ms) | Redis Time (ms) | Node Proc Time (ms) | Query Count | Payload Size (bytes) |");
    console.log("|---|---|---|---|---|---|---|---|---|---|");

    benchmarkResults.forEach((r) => {
      console.log(`| ${r.endpoint} | ${r.pageSize} | ${r.cacheState} | ${r.totalTimeMs} | ${r.mongoTimeMs} | ${r.permCalcTimeMs} | ${r.redisTimeMs} | ${r.nodeProcTimeMs} | ${r.queryCount} | ${r.payloadSize} |`);
    });
    console.log("========================================================================================================================\n");

    if (cacheUtil.disconnect) {
      await cacheUtil.disconnect();
    }
    process.exit(0);
  } catch (err) {
    console.error("BENCHMARK FAILED:", err);
    process.exit(1);
  }
};

runFullBenchmark();
