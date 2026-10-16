const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      default: null,
    },
    slotId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Slot",
      default: null,
    },
    purpose: {
      type: String,
      default: "",
      trim: true,
    },
    notes: {
      type: String,
      default: "",
      trim: true,
    },
    status: {
      type: String,
      enum: ["scheduled", "arrived", "completed", "cancelled"],
      default: "scheduled",
    },
    bookedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    appointmentDate: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Prevent booking appointments with inactive doctors, inactive departments, or deactivated patients
appointmentSchema.pre("save", async function (next) {
  if (this.isNew || this.isModified("patientId")) {
    const Patient = mongoose.model("Patient");
    const patient = await Patient.findById(this.patientId);
    if (!patient) {
      return next(new Error("Patient not found"));
    }
    if (patient.isActive === false || patient.status === "inactive") {
      return next(new Error("Cannot book appointment for a deactivated patient"));
    }
  }

  if (this.isNew || this.isModified("doctorId") || this.isModified("departmentId")) {
    const Doctor = mongoose.model("Doctor");
    const doctor = await Doctor.findById(this.doctorId);
    if (!doctor) {
      return next(new Error("Doctor not found"));
    }
    if (doctor.status === "disabled" || doctor.isActive === false) {
      return next(new Error("Cannot book appointment with an inactive doctor"));
    }

    const deptId = this.departmentId || doctor.departmentId;
    if (deptId) {
      const Department = mongoose.model("Department");
      const department = await Department.findById(deptId);
      if (!department) {
        return next(new Error("Department not found"));
      }
      if (!department.isActive) {
        return next(new Error("Cannot book appointment with an inactive department"));
      }
    }
  }
  next();
});

// Indexes: doctorId, patientId, status, and appointment date
appointmentSchema.index({ doctorId: 1, appointmentDate: 1 });
appointmentSchema.index({ patientId: 1, appointmentDate: 1 });
appointmentSchema.index({ doctorId: 1, status: 1 });
appointmentSchema.index({ patientId: 1, status: 1 });
appointmentSchema.index({ status: 1 });
appointmentSchema.index({ appointmentDate: 1 });
appointmentSchema.index({ slotId: 1 });
appointmentSchema.index({ departmentId: 1 });
appointmentSchema.index({ bookedBy: 1 });
appointmentSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Appointment", appointmentSchema);
