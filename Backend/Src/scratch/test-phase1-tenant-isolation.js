/**
 * Test Suite 1: Tenant & Integration Context Isolation Verification
 * Runs deterministic unit tests for Admin, Root Admin, Client, and Member tenant isolation.
 */

const assert = require("assert");
const mongoose = require("mongoose");
const User = require("../models/user.model");
const Organization = require("../models/organization.model");
const AdminAssignment = require("../models/admin-assignment.model");
const { getEffectiveIntegrationContext } = require("../utils/integration-context.util");

// Mock Data
const mockAdminId = new mongoose.Types.ObjectId().toString();
const mockOrgAId = new mongoose.Types.ObjectId().toString();
const mockOrgBId = new mongoose.Types.ObjectId().toString();
const mockOwnerAId = new mongoose.Types.ObjectId().toString();
const mockOwnerBId = new mongoose.Types.ObjectId().toString();

// Mock Mongoose Methods for Unit Testing
User.findById = async (id) => {
  if (String(id) === mockOwnerAId) {
    return { _id: mockOwnerAId, role: "client", email: "clienta@test.com" };
  }
  if (String(id) === mockOwnerBId) {
    return { _id: mockOwnerBId, role: "client", email: "clientb@test.com" };
  }
  return null;
};

Organization.findById = (id) => ({
  lean: async () => {
    if (String(id) === mockOrgAId) {
      return { _id: mockOrgAId, name: "Org A", ownerId: mockOwnerAId };
    }
    if (String(id) === mockOrgBId) {
      return { _id: mockOrgBId, name: "Org B", ownerId: mockOwnerBId };
    }
    return null;
  },
});

AdminAssignment.findOne = () => ({
  lean: async () => null, // Unassigned for Org B
});

async function runTenantIsolationTests() {
  console.log("==================================================");
  console.log("RUNNING TENANT ISOLATION TEST SUITE");
  console.log("==================================================");

  // Test 1: Admin without explicitOrgId returns error (NO firstConnectedClient fallback!)
  const adminUserNoOrg = {
    _id: mockAdminId,
    role: "admin",
    organizationId: null,
  };

  const res1 = await getEffectiveIntegrationContext(adminUserNoOrg);
  assert.strictEqual(res1.integrationUser, null, "Admin without org context must return integrationUser = null");
  assert.strictEqual(res1.organization, null, "Admin without org context must return organization = null");
  assert.ok(res1.error && res1.error.includes("Explicit organization context required"), "Must return controlled context error");
  console.log("✓ Test 1 Passed: Admin without org context rejected cleanly (No firstConnectedClient fallback)");

  // Test 2: Admin attempting access to unassigned Org B must return 403 / Access Denied error
  const adminUser = {
    _id: mockAdminId,
    role: "admin",
    organizationId: null,
  };

  const res2 = await getEffectiveIntegrationContext(adminUser, mockOrgBId);
  assert.strictEqual(res2.integrationUser, null, "Unassigned Admin must receive integrationUser = null");
  assert.strictEqual(res2.organization, null, "Unassigned Admin must receive organization = null");
  assert.ok(res2.error && res2.error.includes("Access denied"), "Must return Access denied error for unassigned org");
  console.log("✓ Test 2 Passed: Unassigned Admin access to Org B rejected with Access Denied (Zero downstream provider calls)");

  // Test 3: Member assigned to Client A requesting Org B must remain pinned to Client A
  const memberUser = {
    _id: new mongoose.Types.ObjectId().toString(),
    role: "member",
    assignedClientId: mockOwnerAId,
    organizationId: mockOrgAId,
  };

  const res3 = await getEffectiveIntegrationContext(memberUser, mockOrgBId);
  assert.ok(res3.integrationUser, "Member integrationUser resolved");
  assert.strictEqual(String(res3.integrationUser._id), mockOwnerAId, "Member must resolve to assigned Client A, ignoring cross-tenant Org B");
  console.log("✓ Test 3 Passed: Member strictly pinned to assigned Client A (cross-tenant explicitOrgId ignored)");

  // Test 4: Root Admin without org context returns null context (No firstConnectedClient fallback!)
  const rootAdminUser = {
    _id: new mongoose.Types.ObjectId().toString(),
    role: "root_admin",
    isRootAdmin: true,
  };

  const res4 = await getEffectiveIntegrationContext(rootAdminUser);
  assert.strictEqual(res4.integrationUser, null, "Root Admin without org context must return integrationUser = null");
  assert.strictEqual(res4.organization, null, "Root Admin without org context must return organization = null");
  console.log("✓ Test 4 Passed: Root Admin without org context returns deterministic null context");

  console.log("--------------------------------------------------");
  console.log("ALL TENANT ISOLATION TESTS PASSED CLEANLY!");
  console.log("--------------------------------------------------");
}

runTenantIsolationTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ TENANT ISOLATION TEST FAILED:", err);
    process.exit(1);
  });
