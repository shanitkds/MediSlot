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

userSchema.index(
  { email: 1 },
  { unique: true, partialFilterExpression: { isArchive: false } }
);
userSchema.index({ status: 1 });
userSchema.index({ roleIds: 1 });
userSchema.index({ isArchive: 1 });

module.exports = mongoose.model("User", userSchema);
