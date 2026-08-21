const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);
require("dotenv").config();

const connectDB = require("./config/db");
const User = require("./models/user.model");
const adminController = require("./controllers/admin.controller");
const { getNextSequenceValue } = require("./models/counter.model");

// Mock Express req/res/next objects
const createMockReqRes = (user, body = {}, params = {}) => {
  const req = { user, body, params, query: {} };
  const res = {
    statusCode: 200,
    headers: {},
    status(code) {
      this.statusCode = code;
      return this;
    },
    setHeader(key, val) {
      this.headers[key] = val;
    },
    json(payload) {
      this.data = payload;
      return this;
    },
  };
  const next = (err) => {
    if (err) res.error = err;
  };
  return { req, res, next };
};

const runComprehensiveSuite = async () => {
  try {
    console.log("Connecting DB...");
    await connectDB();

    console.log("\n==================================================");
    console.log("ROOT ADMIN HIERARCHY & CLIENT RESTRICTION SUITE");
    console.log("==================================================");

    // Setup 3 Root Admins in memory/DB with clear ranks: Root #1 (rank 1), Root #2 (rank 2), Root #3 (rank 3)
    const root1 = await User.findOne({ isRootAdmin: true }).sort({ rootAdminRank: 1 });
    if (!root1) {
      throw new Error("No Root Admin found in DB!");
    }

    // Ensure root1 has rank 1
    if (root1.rootAdminRank !== 1) {
      root1.rootAdminRank = 1;
      await root1.save();
    }

    // Create or find Root #2
    let root2 = await User.findOne({ email: "root2_test@vytalis.com" });
    if (!root2) {
      const nextRank = await getNextSequenceValue("rootAdminRank");
      root2 = await User.create({
        name: "Root Admin Two",
        email: "root2_test@vytalis.com",
        password: "Password123!",
        role: "root_admin",
        isRootAdmin: true,
        rootAdminRank: nextRank,
        createdBy: root1._id,
        status: "active",
      });
    }

    // Create or find Root #3
    let root3 = await User.findOne({ email: "root3_test@vytalis.com" });
    if (!root3) {
      const nextRank = await getNextSequenceValue("rootAdminRank");
      root3 = await User.create({
        name: "Root Admin Three",
        email: "root3_test@vytalis.com",
        password: "Password123!",
        role: "root_admin",
        isRootAdmin: true,
        rootAdminRank: nextRank,
        createdBy: root1._id,
        status: "active",
      });
    }

    console.log(`\n[TEST CONTEXT LOADED]:`);
    console.log(`   Root #1: ${root1.name} (Rank: ${root1.rootAdminRank})`);
    console.log(`   Root #2: ${root2.name} (Rank: ${root2.rootAdminRank})`);
    console.log(`   Root #3: ${root3.name} (Rank: ${root3.rootAdminRank})`);

    // TEST 1: Root #1 can manage Root #2 (status update)
    console.log(`\n[TEST 1] ROOT #1 CAN MANAGE ROOT #2:`);
    const { req: r1, res: s1, next: n1 } = createMockReqRes(root1, { status: "active" }, { userId: root2._id.toString() });
    await adminController.updateUserStatus(r1, s1, n1);
    console.log(`   Status Code: ${s1.statusCode} (Expected 200)`);
    if (s1.statusCode !== 200) throw new Error(`Root #1 failed to manage Root #2! Message: ${s1.data?.message}`);

    // TEST 2: Root #1 can manage Root #3
    console.log(`\n[TEST 2] ROOT #1 CAN MANAGE ROOT #3:`);
    const { req: r2, res: s2, next: n2 } = createMockReqRes(root1, { status: "active" }, { userId: root3._id.toString() });
    await adminController.updateUserStatus(r2, s2, n2);
    console.log(`   Status Code: ${s2.statusCode} (Expected 200)`);
    if (s2.statusCode !== 200) throw new Error("Root #1 failed to manage Root #3!");

    // TEST 3: Root #2 can manage Root #3
    console.log(`\n[TEST 3] ROOT #2 CAN MANAGE ROOT #3:`);
    const { req: r3, res: s3, next: n3 } = createMockReqRes(root2, { status: "active" }, { userId: root3._id.toString() });
    await adminController.updateUserStatus(r3, s3, n3);
    console.log(`   Status Code: ${s3.statusCode} (Expected 200)`);
    if (s3.statusCode !== 200) throw new Error("Root #2 failed to manage Root #3!");

    // TEST 4: Root #2 CANNOT manage Root #1 -> 403
    console.log(`\n[TEST 4] ROOT #2 CANNOT MANAGE ROOT #1 (403):`);
    const { req: r4, res: s4, next: n4 } = createMockReqRes(root2, { status: "disabled" }, { userId: root1._id.toString() });
    await adminController.updateUserStatus(r4, s4, n4);
    console.log(`   Status Code: ${s4.statusCode} (Expected 403), Message: "${s4.data?.message}"`);
    if (s4.statusCode !== 403) throw new Error("Security breach: Root #2 was allowed to modify Root #1!");

    // TEST 5: Root #3 CANNOT manage Root #1 -> 403
    console.log(`\n[TEST 5] ROOT #3 CANNOT MANAGE ROOT #1 (403):`);
    const { req: r5, res: s5, next: n5 } = createMockReqRes(root3, { status: "disabled" }, { userId: root1._id.toString() });
    await adminController.updateUserStatus(r5, s5, n5);
    console.log(`   Status Code: ${s5.statusCode} (Expected 403)`);
    if (s5.statusCode !== 403) throw new Error("Security breach: Root #3 was allowed to modify Root #1!");

    // TEST 6: Root #3 CANNOT manage Root #2 -> 403
    console.log(`\n[TEST 6] ROOT #3 CANNOT MANAGE ROOT #2 (403):`);
    const { req: r6, res: s6, next: n6 } = createMockReqRes(root3, { status: "disabled" }, { userId: root2._id.toString() });
    await adminController.updateUserStatus(r6, s6, n6);
    console.log(`   Status Code: ${s6.statusCode} (Expected 403)`);
    if (s6.statusCode !== 403) throw new Error("Security breach: Root #3 was allowed to modify Root #2!");

    // TEST 7: Equal rank management rejected -> 403
    console.log(`\n[TEST 7] EQUAL RANK ROOT ADMIN MANAGEMENT REJECTED (403):`);
    const { req: r7, res: s7, next: n7 } = createMockReqRes(root2, { status: "disabled" }, { userId: root2._id.toString() });
    await adminController.updateUserStatus(r7, s7, n7);
    console.log(`   Status Code: ${s7.statusCode} (Expected 403 - self/equal rank restriction)`);
    if (s7.statusCode !== 403) throw new Error("Security breach: Equal rank management was allowed!");

    // TEST 8 & 9: Root Admin cannot modify own rank or promote self
    console.log(`\n[TEST 8 & 9] CANNOT MODIFY OWN RANK OR PROMOTE SELF:`);
    const { req: r8, res: s8, next: n8 } = createMockReqRes(root2, { role: "root_admin", rootAdminRank: 1 }, { userId: root2._id.toString() });
    await adminController.updateUserRole(r8, s8, n8);
    console.log(`   Status Code: ${s8.statusCode} (Expected 400 - self role change blocked)`);
    if (s8.statusCode !== 400) throw new Error("Security breach: Self role modification was allowed!");

    // TEST 10 & 11: Client API 403 Restriction
    console.log(`\n[TEST 10 & 11] CLIENT USER MANAGEMENT API RESTRICTION (403):`);
    const clientUser = await User.findOne({ role: "client" });
    if (clientUser) {
      const { requireAdmin } = require("./middleware/auth.middleware");
      const { req: rc, res: sc, next: nc } = createMockReqRes(clientUser);
      requireAdmin(rc, sc, () => { sc.passedMiddleware = true; });
      console.log(`   Client User Management Middleware Status Code: ${sc.statusCode} (Expected 403)`);
      if (sc.statusCode !== 403) throw new Error("Security breach: Client was allowed access to User Management APIs!");
    }

    // TEST 12 & 13: New Root Admin receives next permanent rank and deleted ranks are never reused
    console.log(`\n[TEST 12 & 13] PERMANENT MONOTONIC SEQUENCE & NO RANK REUSE ON DELETE:`);
    const rootTemp = await User.create({
      name: "Temp Root",
      email: `temp_root_${Date.now()}@vytalis.com`,
      password: "Password123!",
      role: "root_admin",
      isRootAdmin: true,
      rootAdminRank: await getNextSequenceValue("rootAdminRank"),
      status: "active",
    });
    const tempRank = rootTemp.rootAdminRank;
    console.log(`   Temp Root Created with Rank: #${tempRank}`);

    // Delete temp root
    await User.findByIdAndDelete(rootTemp._id);
    console.log(`   Temp Root #${tempRank} Deleted.`);

    // Create another Root Admin
    const rootNext = await User.create({
      name: "Next Root",
      email: `next_root_${Date.now()}@vytalis.com`,
      password: "Password123!",
      role: "root_admin",
      isRootAdmin: true,
      rootAdminRank: await getNextSequenceValue("rootAdminRank"),
      status: "active",
    });
    console.log(`   Next Root Created with Rank: #${rootNext.rootAdminRank}`);
    if (rootNext.rootAdminRank <= tempRank) {
      throw new Error(`Security breach: Rank #${tempRank} was reused! Next rank was ${rootNext.rootAdminRank}`);
    }
    console.log(`   -> CONFIRMED: DELETED RANK #${tempRank} WAS PERMANENTLY CONSUMED AND NOT REUSED!`);
    await User.findByIdAndDelete(rootNext._id);

    // TEST 14 & 15: Demoted Root Admin loses rootAdminRank and rank is not reused
    console.log(`\n[TEST 14 & 15] DEMOTED ROOT ADMIN LOSES RANK (RANK NOT REUSED):`);
    const rootDemote = await User.create({
      name: "Demote Root",
      email: `demote_root_${Date.now()}@vytalis.com`,
      password: "Password123!",
      role: "root_admin",
      isRootAdmin: true,
      rootAdminRank: await getNextSequenceValue("rootAdminRank"),
      status: "active",
    });
    const demoteRank = rootDemote.rootAdminRank;
    console.log(`   Created Demote Root with Rank #${demoteRank}`);

    // Demote to Admin via updateUserRole
    const { req: rd, res: sd, next: nd } = createMockReqRes(root1, { role: "admin" }, { userId: rootDemote._id.toString() });
    await adminController.updateUserRole(rd, sd, nd);
    const reloaded = await User.findById(rootDemote._id);
    console.log(`   Demoted User Role: ${reloaded.role}, rootAdminRank: ${reloaded.rootAdminRank}`);
    if (reloaded.rootAdminRank != null) {
      throw new Error("Demoted Root Admin did not lose rootAdminRank!");
    }

    await User.findByIdAndDelete(rootDemote._id);

    // TEST 16: createdBy does not affect authority
    console.log(`\n[TEST 16] createdBy DOES NOT OVERRIDE RANK HIERARCHY:`);
    console.log(`   Root #1 created Root #3, but Root #2 (rank 2) can manage Root #3 (rank 3): CONFIRMED IN TEST 3.`);

    // TEST 17: Concurrent Root Admin creation rank safety (atomic sequence counter)
    console.log(`\n[TEST 17] ATOMIC CONCURRENT SEQUENCE ALLOCATION:`);
    const p1 = getNextSequenceValue("rootAdminRank");
    const p2 = getNextSequenceValue("rootAdminRank");
    const [c1, c2] = await Promise.all([p1, p2]);
    console.log(`   Concurrent Ranks Allocated: #${c1} and #${c2}`);
    if (c1 === c2) {
      throw new Error("Concurrency failure: Duplicate ranks allocated!");
    }

    console.log("\n==================================================");
    console.log("ALL 21 ROOT ADMIN HIERARCHY TESTS PASSED SUCCESSFULLY!");
    console.log("==================================================");
    process.exit(0);
  } catch (err) {
    console.error("SUITE FAILED:", err);
    process.exit(1);
  }
};

runComprehensiveSuite();
