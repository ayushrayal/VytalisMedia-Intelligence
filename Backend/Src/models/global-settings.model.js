const mongoose = require("mongoose");

const globalSettingsSchema = new mongoose.Schema(
  {
    globalDeniedPermissions: {
      type: [String],
      default: [],
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

globalSettingsSchema.set("toJSON", {
  transform: (doc, ret) => {
    delete ret.__v;
    ret.globalDeniedPermissions = Array.isArray(ret.globalDeniedPermissions)
      ? ret.globalDeniedPermissions
      : [];
    return ret;
  },
});

const GlobalSettings = mongoose.model("GlobalSettings", globalSettingsSchema);

module.exports = GlobalSettings;
