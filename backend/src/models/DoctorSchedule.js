const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema(
  {
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
  },
  { _id: false }
);

const breakSchema = new mongoose.Schema(
  {
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
  },
  { _id: false }
);

const doctorScheduleSchema = new mongoose.Schema(
  {
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
      unique: true,
    },
    workingDays: {
      type: [Number],
      default: [1, 2, 3, 4, 5],
    },
    sessions: {
      type: [sessionSchema],
      default: [],
    },
    breaks: {
      type: [breakSchema],
      default: [],
    },
    slotDurationMinutes: {
      type: Number,
      required: true,
      default: 15,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("DoctorSchedule", doctorScheduleSchema);
