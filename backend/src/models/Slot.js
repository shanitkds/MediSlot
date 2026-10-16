const mongoose = require("mongoose");

const slotSchema = new mongoose.Schema(
  {
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
    },
    startAt: {
      type: Date,
      required: true,
    },
    endAt: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["available", "booked"],
      default: "available",
    },
  },
  { timestamps: true }
);

// Important index: Unique compound index on { doctorId: 1, startAt: 1 }
// Ensures the same doctor cannot have two slot records with the same start time.
slotSchema.index({ doctorId: 1, startAt: 1 }, { unique: true });
slotSchema.index({ doctorId: 1, status: 1 });
slotSchema.index({ startAt: 1 });

module.exports = mongoose.model("Slot", slotSchema);
