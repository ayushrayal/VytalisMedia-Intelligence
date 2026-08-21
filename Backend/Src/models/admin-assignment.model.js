const mongoose = require("mongoose");

const adminAssignmentSchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for fast lookup and uniqueness
adminAssignmentSchema.index({ adminId: 1, organizationId: 1 }, { unique: true });
adminAssignmentSchema.index({ organizationId: 1, status: 1 });
adminAssignmentSchema.index({ adminId: 1, status: 1 });

adminAssignmentSchema.set("toJSON", {
  transform: (doc, ret) => {
    delete ret.__v;
    ret.status = ret.status || "active";
    return ret;
  },
});

const AdminAssignment = mongoose.model("AdminAssignment", adminAssignmentSchema);

module.exports = AdminAssignment;
