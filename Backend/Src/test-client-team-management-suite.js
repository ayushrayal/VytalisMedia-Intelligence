const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);
require("dotenv").config();
const mongoose = require("mongoose");

const connectDB = require("./config/db");

const User = require("./models/user.model");
const Organization = require("./models/organization.model");
const clientTeamController = require("./controllers/client-team.controller");
const adminController = require("./controllers/admin.controller");
const { requireAdmin, requireClient } = require("./middleware/auth.middleware");

// Helper to create Mock Express Request & Response
const createMockReqRes = (user, body = {}, params = {}, query = {}) => {
  const req = { user, body, params, query };
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

const runClientTeamSuite = async () => {
  try {
    console.log("Connecting DB...");
    await connectDB();

    console.log("\n==================================================");
    console.log("CLIENT TEAM MANAGEMENT TEST SUITE");
    console.log("==================================================");

    // Cleanup prior test users
    await User.deleteMany({ email: { $in: ["client_a_team_test@vytalis.com", "client_b_team_test@vytalis.com"] } });

    // Setup Test Client A & Organization A
    const clientAId = new mongoose.Types.ObjectId();
    const orgAId = new mongoose.Types.ObjectId();
    const orgA = await Organization.create({
      _id: orgAId,
      name: "Client A Org",
      slug: `client-a-org-${Date.now()}`,
      ownerId: clientAId,
      status: "active",
      memberLimit: 5,
    });
    const clientA = await User.create({
      _id: clientAId,
      name: "Client A",
      email: "client_a_team_test@vytalis.com",
      password: "Password123!",
      role: "client",
      organizationId: orgA._id,
      status: "active",
      assignedPermissions: [
        { key: "meta.overview", allowed: true },
        { key: "meta.campaigns", allowed: true },
        { key: "meta.places", allowed: false },
      ],
    });

    // Setup Test Client B & Organization B
    const clientBId = new mongoose.Types.ObjectId();
    const orgBId = new mongoose.Types.ObjectId();
    const orgB = await Organization.create({
      _id: orgBId,
      name: "Client B Org",
      slug: `client-b-org-${Date.now()}`,
      ownerId: clientBId,
      status: "active",
      memberLimit: 5,
    });
    const clientB = await User.create({
      _id: clientBId,
      name: "Client B",
      email: "client_b_team_test@vytalis.com",
      password: "Password123!",
      role: "client",
      organizationId: orgB._id,
      status: "active",
    });



    console.log(`[TEST CONTEXT LOADED]:`);
    console.log(`   Client A: ${clientA._id} (Org: ${orgA._id})`);
    console.log(`   Client B: ${clientB._id} (Org: ${orgB._id})`);

    // TEST 1: Client can see Team Management route context
    console.log(`\n[TEST 1 & 2] ROUTE GUARD AUTHORIZATION:`);
    const { req: r1, res: s1 } = createMockReqRes(clientA);
    requireClient(r1, s1, () => { s1.passed = true; });
    console.log(`   requireClient Middleware for Client: Passed=${s1.passed === true} (Status 200)`);
    if (!s1.passed) throw new Error("Client was blocked by requireClient middleware!");

    const { req: r2, res: s2 } = createMockReqRes(clientA);
    requireAdmin(r2, s2, () => { s2.passed = true; });
    console.log(`   requireAdmin Middleware for Client: Status=${s2.statusCode} (Expected 403 Forbidden)`);
    if (s2.statusCode !== 403) throw new Error("Security failure: Client passed requireAdmin middleware!");

    // TEST 5, 6, 7, 8, 9, 10: Client Creates Member (forced role='member', derived assignedClientId & organizationId)
    console.log(`\n[TEST 5-10] MEMBER CREATION & ATTRIBUTE IMMUTABILITY:`);
    const memberEmailA = `member_a_${Date.now()}@vytalis.com`;
    const { req: r5, res: s5, next: n5 } = createMockReqRes(clientA, {
      name: "Member A1",
      email: memberEmailA,
      password: "Password123!",
      role: "admin", // Tamper attempt!
      assignedClientId: clientB._id.toString(), // Tamper attempt!
      organizationId: orgB._id.toString(), // Tamper attempt!
    });
    await clientTeamController.createClientTeamMember(r5, s5, n5);
    console.log(`   Create Member Status Code: ${s5.statusCode} (Expected 201)`);
    if (s5.statusCode !== 201) throw new Error(`Member creation failed! ${s5.data?.message}`);

    const createdMemberA = await User.findById(s5.data.data.member._id);
    console.log(`   Created Member Role: '${createdMemberA.role}' (Expected 'member')`);
    console.log(`   Assigned Client ID: '${createdMemberA.assignedClientId}' (Expected '${clientA._id}')`);
    console.log(`   Organization ID: '${createdMemberA.organizationId}' (Expected '${orgA._id}')`);

    if (createdMemberA.role !== "member") throw new Error("Security breach: Client created non-member role!");
    if (createdMemberA.assignedClientId.toString() !== clientA._id.toString()) throw new Error("Security breach: Client B assignedClientId was accepted!");
    if (createdMemberA.organizationId.toString() !== orgA._id.toString()) throw new Error("Security breach: Client B organizationId was accepted!");

    // TEST 3 & 4: Client A lists own members vs Client B members isolation
    console.log(`\n[TEST 3 & 4] MEMBER LISTING SCOPING & ISOLATION:`);
    const { req: r3, res: s3, next: n3 } = createMockReqRes(clientA);
    await clientTeamController.getClientTeamMembers(r3, s3, n3);
    console.log(`   Client A List Count: ${s3.data.data.members.length}`);
    const foundOtherOrgMember = s3.data.data.members.some((m) => m.organizationId.toString() !== orgA._id.toString());
    if (foundOtherOrgMember) throw new Error("Security breach: Client A saw members of another organization!");

    // TEST 11, 12 & 18: Client updates member permissions & Authority Ceiling check
    console.log(`\n[TEST 11, 12 & 18] PERMISSION MANAGEMENT & AUTHORITY CEILING ENFORCEMENT:`);
    // Attempt to grant unauthorized permission 'meta.places' (which Client A does not possess)
    const { req: r18, res: s18, next: n18 } = createMockReqRes(clientA, {
      permissions: { "meta.places": true },
    }, { memberId: createdMemberA._id.toString() });
    await clientTeamController.updateClientTeamMemberPermissions(r18, s18, n18);
    console.log(`   Unauthorized Grant Status Code: ${s18.statusCode} (Expected 403), Message: "${s18.data.message}"`);
    if (s18.statusCode !== 403) throw new Error("Security breach: Client A granted permission above authority ceiling!");

    // Grant authorized permission 'meta.overview'
    const { req: r11, res: s11, next: n11 } = createMockReqRes(clientA, {
      permissions: { "meta.overview": true },
    }, { memberId: createdMemberA._id.toString() });
    await clientTeamController.updateClientTeamMemberPermissions(r11, s11, n11);
    console.log(`   Authorized Grant Status Code: ${s11.statusCode} (Expected 200)`);
    if (s11.statusCode !== 200) throw new Error("Client A failed to grant authorized permission!");

    // Client B attempts to update Client A's member -> 403
    const { req: r12, res: s12, next: n12 } = createMockReqRes(clientB, {
      permissions: { "meta.overview": true },
    }, { memberId: createdMemberA._id.toString() });
    await clientTeamController.updateClientTeamMemberPermissions(r12, s12, n12);
    console.log(`   Cross-Client Permission Update Status Code: ${s12.statusCode} (Expected 403)`);
    if (s12.statusCode !== 403) throw new Error("Security breach: Client B updated Client A's member permissions!");

    // TEST 13 & 14: Enable/Disable member status & cross-client status isolation
    console.log(`\n[TEST 13 & 14] STATUS MANAGEMENT & CROSS-CLIENT ISOLATION:`);
    const { req: r13, res: s13, next: n13 } = createMockReqRes(clientA, { status: "disabled" }, { memberId: createdMemberA._id.toString() });
    await clientTeamController.updateClientTeamMemberStatus(r13, s13, n13);
    console.log(`   Disable Member Status Code: ${s13.statusCode} (Expected 200)`);
    if (s13.statusCode !== 200) throw new Error("Client A failed to disable own member!");

    const { req: r14, res: s14, next: n14 } = createMockReqRes(clientB, { status: "active" }, { memberId: createdMemberA._id.toString() });
    await clientTeamController.updateClientTeamMemberStatus(r14, s14, n14);
    console.log(`   Cross-Client Status Update Status Code: ${s14.statusCode} (Expected 403)`);
    if (s14.statusCode !== 403) throw new Error("Security breach: Client B modified Client A's member status!");

    // TEST 19: Member Quota Enforcement (max 5 active members)
    console.log(`\n[TEST 19] MEMBER QUOTA LIMIT ENFORCEMENT:`);
    // Ensure Client A has 5 active members
    await User.updateMany({ organizationId: orgA._id, role: "member" }, { status: "active" });
    const currentActive = await User.countDocuments({ organizationId: orgA._id, role: "member", status: "active" });
    for (let i = currentActive; i < 5; i++) {
      await User.create({
        name: `Member Filler ${i}`,
        email: `filler_${i}_${Date.now()}@vytalis.com`,
        password: "Password123!",
        role: "member",
        status: "active",
        organizationId: orgA._id,
        assignedClientId: clientA._id,
      });
    }

    const { req: r19, res: s19, next: n19 } = createMockReqRes(clientA, {
      name: "Excess Member",
      email: `excess_${Date.now()}@vytalis.com`,
      password: "Password123!",
    });
    await clientTeamController.createClientTeamMember(r19, s19, n19);
    console.log(`   Quota Limit Breach Status Code: ${s19.statusCode} (Expected 400), Message: "${s19.data.message}"`);
    if (s19.statusCode !== 400) throw new Error("Quota failure: Client A created more than 5 members!");


    // TEST 15, 16 & 17: Delete Member & Cross-Client Delete Protection
    console.log(`\n[TEST 15, 16 & 17] MEMBER DELETION & CROSS-CLIENT PROTECTION:`);
    // Client B attempts to delete Client A's member -> 403
    const { req: r16, res: s16, next: n16 } = createMockReqRes(clientB, {}, { memberId: createdMemberA._id.toString() });
    await clientTeamController.deleteClientTeamMember(r16, s16, n16);
    console.log(`   Cross-Client Delete Status Code: ${s16.statusCode} (Expected 403)`);
    if (s16.statusCode !== 403) throw new Error("Security breach: Client B deleted Client A's member!");

    // Client A attempts to delete Client B -> 403
    const { req: r17, res: s17, next: n17 } = createMockReqRes(clientA, {}, { memberId: clientB._id.toString() });
    await clientTeamController.deleteClientTeamMember(r17, s17, n17);
    console.log(`   Client Delete Other Client Status Code: ${s17.statusCode} (Expected 403)`);
    if (s17.statusCode !== 403) throw new Error("Security breach: Client A was allowed to delete Client B!");

    // Client A deletes own member -> 200
    const { req: r15, res: s15, next: n15 } = createMockReqRes(clientA, {}, { memberId: createdMemberA._id.toString() });
    await clientTeamController.deleteClientTeamMember(r15, s15, n15);
    console.log(`   Delete Own Member Status Code: ${s15.statusCode} (Expected 200)`);
    if (s15.statusCode !== 200) throw new Error("Client A failed to delete own member!");

    console.log("\n==================================================");
    console.log("ALL CLIENT TEAM MANAGEMENT TESTS PASSED SUCCESSFULLY!");
    console.log("==================================================");
    process.exit(0);
  } catch (err) {
    console.error("SUITE FAILED:", err);
    process.exit(1);
  }
};

runClientTeamSuite();
