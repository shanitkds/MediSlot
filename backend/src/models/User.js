const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    passwordHash: { type: String, required: true, select: false },
    roleIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Role" }],
    isArchive: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ["active", "disabled"],
      default: "active",
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        delete ret.passwordHash;
        delete ret.__v;
        return ret;
      },
    },
    toObject: { virtuals: true },
  }
);

userSchema.virtual("doctor", {
  ref: "Doctor",
  localField: "_id",
  foreignField: "userId",
  justOne: true,
});

userSchema.virtual("roles").get(function () {
  if (Array.isArray(this.roleIds) && this.roleIds.length > 0) {
    return this.roleIds;
  }
  return [];
});

userSchema.virtual("role").get(function () {
  if (Array.isArray(this.roleIds) && this.roleIds.length > 0) {
    const isSuper = this.roleIds.some((r) => r && (r.isSuperAdmin || r.slug === "super_admin"));
    if (isSuper) return "super_admin";
    const first = this.roleIds[0];
    if (first && typeof first === "object" && (first.slug || first.name)) {
      return (first.slug || first.name).toLowerCase().replace(/\s+/g, "_");
    }
    if (typeof first === "string") {
      return first;
    }
  }
  if (this.doctor) {
    return "doctor";
  }
  return "member";
});

userSchema.virtual("isSuperAdmin").get(function () {
  if (Array.isArray(this.roleIds) && this.roleIds.length > 0) {
    return this.roleIds.some((r) => r && (r.isSuperAdmin || r.slug === "super_admin"));
  }
  return false;
});

userSchema.index(
  { email: 1 },
  { unique: true, partialFilterExpression: { isArchive: false } }
);
userSchema.index({ status: 1 });
userSchema.index({ roleIds: 1 });
userSchema.index({ isArchive: 1 });

module.exports = mongoose.model("User", userSchema);
