const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    targetUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      default: null,
      index: true,
    },
    action: {
      type: String,
      required: true,
      enum: [
        "USER_CREATED",
        "USER_DELETED",
        "USER_DISABLED",
        "USER_ENABLED",
        "ROLE_CHANGED",
        "PERMISSION_CHANGED",
        "GLOBAL_PERMISSION_DISABLED",
        "GLOBAL_PERMISSION_ENABLED",
        "ADMIN_ASSIGNED",
        "ADMIN_UNASSIGNED",
        "ORGANIZATION_CREATED",
        "ORGANIZATION_DISABLED",
        "MEMBER_CREATED",
      ],
    },
    permissionKey: {
      type: String,
      default: null,
    },
    oldValue: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    newValue: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    metadata: {
      type: Object,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

auditLogSchema.index({ createdAt: -1 });

auditLogSchema.set("toJSON", {
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

const AuditLog = mongoose.model("AuditLog", auditLogSchema);

module.exports = AuditLog;
