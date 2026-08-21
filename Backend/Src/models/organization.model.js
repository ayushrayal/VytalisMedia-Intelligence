const mongoose = require("mongoose");

const organizationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Organization name is required"],
      trim: true,
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Organization owner ID is required"],
      index: true,
    },
    memberLimit: {
      type: Number,
      default: 5,
      min: 1,
    },
    status: {
      type: String,
      enum: ["active", "disabled"],
      default: "active",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

organizationSchema.set("toJSON", {
  transform: (doc, ret) => {
    delete ret.__v;
    ret.memberLimit = ret.memberLimit || 5;
    ret.status = ret.status || "active";
    return ret;
  },
});

const Organization = mongoose.model("Organization", organizationSchema);

module.exports = Organization;
