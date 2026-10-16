const Permission = require("../models/Permission");
const { PERMISSIONS } = require("../constants/permissions");

async function seedPermissions() {
  for (const permission of PERMISSIONS) {
    await Permission.updateOne({ name: permission.name }, { $set: permission }, { upsert: true });
  }
  return Permission.find().lean();
}

module.exports = { seedPermissions };
