const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const metaIntegrationSchema = new mongoose.Schema({
  accountId: { type: String, required: true, trim: true },
  accountName: { type: String, required: true, trim: true },
  connectedAt: { type: Date, default: Date.now },
});

const shopifyIntegrationSchema = new mongoose.Schema({
  accountName: { type: String, required: true, trim: true },
  shopName: { type: String, required: true, trim: true },
  timezone: { type: String, trim: true, default: "UTC" },
  status: {
    type: String,
    enum: ["active", "inactive", "connected", "error"],
    default: "active",
  },
  connectedAt: { type: Date, default: Date.now },
  lastSyncedAt: { type: Date, default: null },
});

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      select: false,
    },
    attributionEnabled: {
      type: Boolean,
      default: false,
    },
    integrations: {
      meta: {
        type: [metaIntegrationSchema],
        default: [],
      },
      shopify: {
        type: [shopifyIntegrationSchema],
        default: [],
      },
    },
    preferences: {
      activeMetaAccount: { type: String, default: null },
      activeShopifyAccount: { type: String, default: null },
      creativeCardPreferences: {
        primaryMetrics: {
          type: [String],
          default: ["spend", "purchases", "cost_per_result", "purchase_roas"],
        },
        videoMetrics: {
          type: [String],
          default: ["hook_rate", "hold_rate"],
        },
        showFacebookLink: { type: Boolean, default: true },
        showInstagramLink: { type: Boolean, default: true },
        showHookHoldRates: { type: Boolean, default: true },
        winningRoasThreshold: { type: Number, default: 1.0 },
        poorRoasThreshold: { type: Number, default: 1.0 },
      },
      kpiPreferences: {
        meta: {
          type: [String],
          default: ["amount-spent", "impressions", "purchases", "purchase-value", "reach"],
        },
        shopify: {
          type: [String],
          default: ["grossSales", "netSales", "orders", "discounts", "customers"],
        },
      },
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving if modified
userSchema.pre("save", async function () {
  if (!this.isModified("password")) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Instance method to compare plain password with stored hash
userSchema.methods.matchPassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Transform toJSON to guarantee password and __v are omitted
userSchema.set("toJSON", {
  transform: (doc, ret) => {
    delete ret.password;
    delete ret.__v;
    return ret;
  },
});

const User = mongoose.model("User", userSchema);

module.exports = User;
