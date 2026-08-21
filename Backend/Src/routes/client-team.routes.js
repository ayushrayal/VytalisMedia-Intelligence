const express = require("express");
const router = express.Router();
const clientTeamController = require("../controllers/client-team.controller");
const { protect, requireClient } = require("../middleware/auth.middleware");

// All Client Team routes require JWT authentication & Client role
router.use(protect);
router.use(requireClient);

router.get("/team", clientTeamController.getClientTeamMembers);
router.post("/team", clientTeamController.createClientTeamMember);
router.patch("/team/:memberId/permissions", clientTeamController.updateClientTeamMemberPermissions);
router.patch("/team/:memberId/status", clientTeamController.updateClientTeamMemberStatus);
router.delete("/team/:memberId", clientTeamController.deleteClientTeamMember);

module.exports = router;
