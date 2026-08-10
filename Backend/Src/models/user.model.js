const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const metaIntegrationSchema = new mongoose.Schema({
  accountId: { type: String, required: true, trim: true },
  accountName: { type: String, required: true, trim: true },
  connectedAt: { type: Date, default: Date.now },
});

const shopifyIntegrationSchema = new mongoose.Schema(
  {
    storeName: { type: String },
    storeDomain: { type: String },
    isActive: { type: Boolean, default: true },
    connectedAt: { type: Date, default: Date.now },
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
      activeShopifyStore: { type: String, default: null },
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
