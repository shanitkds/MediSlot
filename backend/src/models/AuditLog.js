const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    actorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    actorEmail: { type: String, default: "" },
    role: { type: String, default: "" },
    action: { type: String, required: true },
    module: { type: String, default: "" },
    entity: { type: String, default: "" },
    entityId: { type: mongoose.Schema.Types.ObjectId, default: null },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// Keep userId and actorId in sync for backwards compatibility
auditLogSchema.pre("save", function (next) {
  if (this.userId && !this.actorId) {
    this.actorId = this.userId;
  }
  if (this.actorId && !this.userId) {
    this.userId = this.actorId;
  }
  if (!this.timestamp) {
    this.timestamp = this.createdAt || new Date();
  }
  next();
});

auditLogSchema.index({ userId: 1, timestamp: -1 });
auditLogSchema.index({ actorId: 1, createdAt: -1 });
auditLogSchema.index({ entity: 1, entityId: 1 });
auditLogSchema.index({ action: 1 });
auditLogSchema.index({ role: 1 });
auditLogSchema.index({ timestamp: -1 });
auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ module: 1, action: 1, createdAt: -1 });

module.exports = mongoose.model("AuditLog", auditLogSchema);
