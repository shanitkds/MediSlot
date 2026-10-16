const User = require("../models/User");
const Settings = require("../models/Settings");
const env = require("../config/env");
const { hashPassword } = require("../utils/hash");

async function seedSuperAdmin(superAdminRole) {
  await Settings.findOneAndUpdate(
    { key: "app" },
    { $setOnInsert: { key: "app", name: "MediSlot", supportEmail: env.SUPERADMIN_EMAIL } },
    { upsert: true }
  );

  const existing = await User.findOne({ email: env.SUPERADMIN_EMAIL.toLowerCase() });
  if (existing) {
    existing.name = env.SUPERADMIN_NAME;
    existing.passwordHash = await hashPassword(env.SUPERADMIN_PASSWORD);
    existing.roleIds = [superAdminRole._id];
    existing.status = "active";
    existing.isArchive = false;
    await existing.save();
    return existing;
  }

  return User.create({
    name: env.SUPERADMIN_NAME,
    email: env.SUPERADMIN_EMAIL.toLowerCase(),
    passwordHash: await hashPassword(env.SUPERADMIN_PASSWORD),
    status: "active",
    isArchive: false,
    roleIds: [superAdminRole._id],
  });
}

module.exports = { seedSuperAdmin };
