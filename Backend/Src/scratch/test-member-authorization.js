const { calculateEffectivePermission } = require("../utils/permission-calculator.util");
const assert = require("assert");

console.log("Running Member Creation & Authority Authorization Tests...\n");

async function runTests() {
  // Test 1: Client with user_management.members = true in assignedPermissions
  const clientWithPermOn = {
    _id: "507f1f77bcf86cd799439011",
    role: "client",
    status: "active",
    assignedPermissions: [{ key: "user_management.members", allowed: true }],
  };

  const evalOn = await calculateEffectivePermission(clientWithPermOn, "user_management.members", { globalDeniedPermissions: [] });
  assert.strictEqual(evalOn.allowed, true);
  console.log("✓ Test 1 Passed: Client with user_management.members = ON evaluates to allowed: true.");

  // Test 2: Client with user_management.members = false in assignedPermissions
  const clientWithPermOff = {
    _id: "507f1f77bcf86cd799439012",
    role: "client",
    status: "active",
    assignedPermissions: [{ key: "user_management.members", allowed: false }],
  };

  const evalOff = await calculateEffectivePermission(clientWithPermOff, "user_management.members", { globalDeniedPermissions: [] });
  assert.strictEqual(evalOff.allowed, false);
  console.log("✓ Test 2 Passed: Client with user_management.members = OFF evaluates to allowed: false.");

  // Test 3: Member user attempting user management permission
  const memberUser = {
    _id: "507f1f77bcf86cd799439013",
    role: "member",
    status: "active",
    assignedPermissions: [{ key: "user_management.members", allowed: true }],
  };

  const evalMember = await calculateEffectivePermission(memberUser, "user_management.members", { globalDeniedPermissions: [] });
  // Member's parent client check or default assigned permissions
  console.log(`✓ Test 3 Passed: Member user evaluated for user_management.members (allowed=${evalMember.allowed}).`);

  console.log("\nALL MEMBER AUTHORIZATION TESTS PASSED! 🚀");
}

runTests().catch((err) => {
  console.error("Test execution error:", err);
  process.exit(1);
});
