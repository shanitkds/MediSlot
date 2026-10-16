const User = require("../../models/User");
const auditService = require("../audit/audit.service");

async function get(user) {
  return User.findById(user._id).populate("roleIds");
}

async function update(user, payload, req) {
  const fresh = await User.findById(user._id);
  if (payload.name) fresh.name = payload.name;
  if (payload.avatarUrl !== undefined) fresh.avatarUrl = payload.avatarUrl;
  if (payload.notifyInApp !== undefined) fresh.notifyInApp = payload.notifyInApp;
  await fresh.save();
  await auditService.log({
    actor: fresh,
    action: "update_profile",
    module: "profile",
    entity: "User",
    entityId: fresh._id,
    req,
  });
  return get(fresh);
}

module.exports = { get, update };
