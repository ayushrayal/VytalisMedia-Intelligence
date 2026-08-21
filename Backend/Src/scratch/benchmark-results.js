const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);
require("dotenv").config();

const connectDB = require("../config/db");
const User = require("../models/user.model");
const Organization = require("../models/organization.model");
const AdminAssignment = require("../models/admin-assignment.model");
const { calculateAllEffectivePermissions } = require("../utils/permission-calculator.util");
const { PerformanceTimer } = require("../utils/performance-timer.util");

const runBenchmarkSuite = async () => {
  try {
    await connectDB();
    console.log("\n==================================================");
    console.log("DATABASE & BACKEND PERFORMANCE BENCHMARK SUITE");
    console.log("==================================================");

    // 1. Benchmark GET /api/admin/users/clients (25 records)
    const clientTimer = new PerformanceTimer("getAllClients");
    const clientPage = 1;
    const clientLimit = 25;
    const clientFilter = { role: "client" };

    const [clientTotal, clients] = await clientTimer.timeMongo(() =>
      Promise.all([
        User.countDocuments(clientFilter),
        User.find(clientFilter)
          .select("name email role status organizationId assignedClientId shopifyEnabled attributionEnabled isRootAdmin lastActiveAt createdAt")
          .populate("organizationId", "name ownerId memberLimit status")
          .sort({ createdAt: -1 })
          .limit(clientLimit)
          .lean(),
      ])
    );

    const clientOrgIds = clients.map((c) => (c.organizationId ? c.organizationId._id : null)).filter(Boolean);
    if (clientOrgIds.length > 0) {
      await clientTimer.timeMongo(() =>
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

    await clientTimer.timePermCalc(async () => {
      await Promise.all(
        clients.map(async (client) => {
          return await calculateAllEffectivePermissions(client);
        })
      );
    });

    const clientMetrics = clientTimer.getMetrics();
    console.log("\n[METRICS] GET /api/admin/users/clients (Page Limit: 25):");
    console.log(`   Total Records in DB: ${clientTotal}`);
    console.log(`   Returned Records: ${clients.length}`);
    console.log(`   Total DB Query Count: ${clientMetrics.queryCount} (O(1) Constant)`);
    console.log(`   Total Time: ${clientMetrics.totalTimeMs} ms`);
    console.log(`   MongoDB Time: ${clientMetrics.mongoTimeMs} ms`);
    console.log(`   Permission Calc Time: ${clientMetrics.permCalcTimeMs} ms`);
    console.log(`   Node Proc Time: ${clientMetrics.nodeProcTimeMs} ms`);

    // 2. Benchmark GET /api/admin/users/members (25 records)
    const memberTimer = new PerformanceTimer("getAllMembers");
    const memberFilter = { role: "member" };

    const [memberTotal, members] = await memberTimer.timeMongo(() =>
      Promise.all([
        User.countDocuments(memberFilter),
        User.find(memberFilter)
          .select("name email role status organizationId assignedClientId lastActiveAt createdAt")
          .populate("organizationId", "name ownerId status")
          .populate("assignedClientId", "name email")
          .sort({ createdAt: -1 })
          .limit(25)
          .lean(),
      ])
    );

    await memberTimer.timePermCalc(async () => {
      await Promise.all(
        members.map(async (member) => {
          return await calculateAllEffectivePermissions(member);
        })
      );
    });

    const memberMetrics = memberTimer.getMetrics();
    console.log("\n[METRICS] GET /api/admin/users/members (Page Limit: 25):");
    console.log(`   Total Records in DB: ${memberTotal}`);
    console.log(`   Returned Records: ${members.length}`);
    console.log(`   Total DB Query Count: ${memberMetrics.queryCount} (O(1) Constant)`);
    console.log(`   Total Time: ${memberMetrics.totalTimeMs} ms`);
    console.log(`   MongoDB Time: ${memberMetrics.mongoTimeMs} ms`);
    console.log(`   Permission Calc Time: ${memberMetrics.permCalcTimeMs} ms`);
    console.log(`   Node Proc Time: ${memberMetrics.nodeProcTimeMs} ms`);

    // 3. Benchmark GET /api/admin/users/admins (25 records)
    const adminTimer = new PerformanceTimer("getAllAdmins");
    const adminFilter = { role: { $in: ["admin", "root_admin"] } };

    const [adminTotal, admins] = await adminTimer.timeMongo(() =>
      Promise.all([
        User.countDocuments(adminFilter),
        User.find(adminFilter)
          .select("name email role status isRootAdmin lastActiveAt createdAt")
          .sort({ createdAt: -1 })
          .limit(25)
          .lean(),
      ])
    );

    const adminIds = admins.map((a) => a._id);
    if (adminIds.length > 0) {
      await adminTimer.timeMongo(() =>
        AdminAssignment.find({ adminId: { $in: adminIds }, status: "active" })
          .populate("organizationId", "name ownerId")
          .lean()
      );
    }

    await adminTimer.timePermCalc(async () => {
      await Promise.all(
        admins.map(async (admin) => {
          return await calculateAllEffectivePermissions(admin);
        })
      );
    });

    const adminMetrics = adminTimer.getMetrics();
    console.log("\n[METRICS] GET /api/admin/users/admins (Page Limit: 25):");
    console.log(`   Total Records in DB: ${adminTotal}`);
    console.log(`   Returned Records: ${admins.length}`);
    console.log(`   Total DB Query Count: ${adminMetrics.queryCount} (O(1) Constant)`);
    console.log(`   Total Time: ${adminMetrics.totalTimeMs} ms`);
    console.log(`   MongoDB Time: ${adminMetrics.mongoTimeMs} ms`);
    console.log(`   Permission Calc Time: ${adminMetrics.permCalcTimeMs} ms`);
    console.log(`   Node Proc Time: ${adminMetrics.nodeProcTimeMs} ms`);

    // 4. Query Execution Plan Explain (.explain("executionStats"))
    console.log("\n==================================================");
    console.log("MONGODB QUERY EXECUTION PLAN AUDIT (.explain())");
    console.log("==================================================");

    const explainQuery = await User.find({ role: "client", status: "active" })
      .sort({ createdAt: -1 })
      .limit(25)
      .explain("executionStats");

    const winningPlan = explainQuery.queryPlanner?.winningPlan || {};
    const executionStats = explainQuery.executionStats || {};
    console.log(`   Winning Plan Stage: ${winningPlan.stage || winningPlan.inputStage?.stage}`);
    console.log(`   Total Keys Examined: ${executionStats.totalKeysExamined}`);
    console.log(`   Total Docs Examined: ${executionStats.totalDocsExamined}`);
    console.log(`   Execution Time (ms): ${executionStats.executionTimeMillis}`);
    console.log(`   Index Used (IXSCAN): ${JSON.stringify(winningPlan.inputStage?.indexName || winningPlan.indexName || "N/A")}`);

    console.log("\n==================================================");
    console.log("BENCHMARK SUITE COMPLETED SUCCESSFULLY!");
    console.log("==================================================");
    process.exit(0);
  } catch (err) {
    console.error("BENCHMARK SUITE FAILED:", err);
    process.exit(1);
  }
};

runBenchmarkSuite();
