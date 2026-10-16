const Role = require("../models/Role");

async function seedRoles(permissions) {
  const allIds = permissions.map((permission) => permission._id);
  const memberIds = [];
  const adminIds = permissions
    .filter((permission) => permission.name !== "audit.view" || true)
  const doctorIds = permissions
    .filter((permission) =>
      [
        "appointments.view",
        "appointments.update",
        "patients.view",
        "doctors.view",
        "departments.view",
        "doctorschedule.view",
        "slots.view",
        "dashboard.view",
      ].includes(permission.name)
    )
    .map((permission) => permission._id);
  const receptionistIds = permissions
    .filter((permission) =>
      [
        "appointments.create",
        "appointments.view",
        "appointments.update",
        "appointments.delete",
        "patients.create",
        "patients.view",
        "patients.update",
        "doctors.view",
        "departments.view",
        "doctorschedule.view",
        "slots.view",
        "dashboard.view",
      ].includes(permission.name)
    )
    .map((permission) => permission._id);

  const roles = [
    {
      name: "Super Admin",
      slug: "super-admin",
      description: "Full access, bypasses permission checks",
      permissionIds: allIds,
      isSystem: true,
      isSuperAdmin: true,
    },
    {
      name: "Admin",
      slug: "admin",
      description: "Manages users, roles, and settings",
      permissionIds: adminIds,
      isSystem: true,
      isSuperAdmin: false,
    },
    {
      name: "Member",
      slug: "member",
      description: "Standard authenticated user",
      permissionIds: memberIds,
      isSystem: true,
      isSuperAdmin: false,
    },
    {
      name: "Doctor",
      slug: "doctor",
      description: "Doctor / Healthcare provider",
      permissionIds: doctorIds,
      isSystem: true,
      isSuperAdmin: false,
    },
    {
      name: "Receptionist",
      slug: "receptionist",
      description: "Hospital receptionist",
      permissionIds: receptionistIds,
      isSystem: true,
      isSuperAdmin: false,
    },
  ];

  const saved = [];
  for (const role of roles) {
    const doc = await Role.findOneAndUpdate(
      { slug: role.slug },
      { $set: { ...role, deletedAt: null } },
      { upsert: true, new: true }
    );
    saved.push(doc);
  }
  return saved;
}

module.exports = { seedRoles };
