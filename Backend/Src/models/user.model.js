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

const permissionEntrySchema = new mongoose.Schema(
  {
    key: { type: String, required: true },
    allowed: { type: Boolean, default: true },
  },
  { _id: false }
);

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
    role: {
      type: String,
      enum: ["root_admin", "admin", "client", "member"],
      default: "client",
      index: true,
    },
    status: {
      type: String,
      enum: ["active", "disabled"],
      default: "active",
      index: true,
    },
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      default: null,
      index: true,
    },
    assignedClientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    assignedPermissions: {
      type: [permissionEntrySchema],
      default: [],
    },
    shopifyEnabled: {
      type: Boolean,
      default: false,
    },
    attributionEnabled: {
      type: Boolean,
      default: false,
    },
    isRootAdmin: {
      type: Boolean,
      default: false,
    },
    rootAdminRank: {
      type: Number,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    lastActiveAt: {
      type: Date,
      default: null,
    },
    rbacMigrated: {
      type: Boolean,
      default: true,
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
      hiddenFeatures: {
        type: [String],
        default: [],
      },
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

// Compound indexes for fast list queries, sorting, and batch counts
userSchema.index({ role: 1, status: 1, createdAt: -1 });
userSchema.index({ organizationId: 1, role: 1, status: 1 });
userSchema.index({ assignedClientId: 1, role: 1, status: 1 });
userSchema.index({ name: 1, email: 1 });
userSchema.index({ rootAdminRank: 1 }, { unique: true, sparse: true });


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

// Transform toJSON to guarantee password and __v are omitted and assignedPermissions formatted as dictionary
userSchema.set("toJSON", {
  transform: (doc, ret) => {
    delete ret.password;
    delete ret.__v;
    delete ret.rbacMigrated;
    
    // Map isRootAdmin -> role === "root_admin"
    if (ret.isRootAdmin === true) {
      ret.role = "root_admin";
    } else if (!ret.role) {
      ret.role = "client";
    }

    ret.status = ret.status || "active";
    ret.organizationId = ret.organizationId || null;
    ret.assignedClientId = ret.assignedClientId || null;
    ret.shopifyEnabled = Boolean(ret.shopifyEnabled);
    ret.attributionEnabled = Boolean(ret.attributionEnabled);
    ret.isRootAdmin = Boolean(ret.isRootAdmin || ret.role === "root_admin");
    ret.rootAdminRank = typeof ret.rootAdminRank === "number" ? ret.rootAdminRank : null;
    ret.createdBy = ret.createdBy || null;
    ret.lastActiveAt = ret.lastActiveAt || null;

    // Convert assignedPermissions array [{ key, allowed }] to dictionary object { "meta.campaigns": true }
    const permMap = {};
    if (Array.isArray(ret.assignedPermissions)) {
      ret.assignedPermissions.forEach((entry) => {
        if (entry && entry.key) {
          permMap[entry.key] = Boolean(entry.allowed);
        }
      });
    } else if (ret.assignedPermissions instanceof Map) {
      ret.assignedPermissions.forEach((val, key) => {
        permMap[key] = Boolean(val);
      });
    } else if (ret.assignedPermissions && typeof ret.assignedPermissions === "object") {
      Object.entries(ret.assignedPermissions).forEach(([k, v]) => {
        permMap[k] = Boolean(v);
      });
    }
    ret.assignedPermissions = permMap;

    return ret;
  },
});

const User = mongoose.model("User", userSchema);

module.exports = User;
