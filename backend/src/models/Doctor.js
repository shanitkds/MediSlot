const mongoose = require("mongoose");

const doctorSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: true,
    },
    specialization: {
      type: String,
      required: true,
      trim: true,
    },
    consultationDuration: {
      type: Number,
      required: true,
      default: 15,
    },
    status: {
      type: String,
      enum: ["active", "disabled"],
      default: "active",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

doctorSchema.index({ departmentId: 1 });
doctorSchema.index({ specialization: 1 });
doctorSchema.index({ status: 1 });
doctorSchema.index({ isActive: 1 });

module.exports = mongoose.model("Doctor", doctorSchema);
