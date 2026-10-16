const { success } = require("../../utils/ApiResponse");
const userService = require("./user.service");

async function createDoctor(req, res) {
  const user = await userService.createDoctor(req.body, req.user, req);
  return success(res, { message: "Doctor account created", data: { user }, status: 201 });
}

async function createReceptionist(req, res) {
  const user = await userService.createReceptionist(req.body, req.user, req);
  return success(res, { message: "Receptionist account created", data: { user }, status: 201 });
}

async function list(req, res) {
  const data = await userService.list(req.query);
  return success(res, { message: "Users fetched", data });
}

async function get(req, res) {
  const user = await userService.getById(req.params.id);
  return success(res, { message: "User fetched", data: { user } });
}

async function update(req, res) {
  const user = await userService.update(req.params.id, req.body, req.user, req);
  return success(res, { message: "User updated", data: { user } });
}

async function updateStatus(req, res) {
  const user = await userService.updateStatus(req.params.id, req.body.status, req.user, req);
  const actionText = req.body.status === "active" ? "activated" : "deactivated";
  return success(res, { message: `User account ${actionText}`, data: { user } });
}

async function remove(req, res) {
  await userService.remove(req.params.id, req.user, req);
  return success(res, { message: "User deleted", data: null });
}

module.exports = {
  createDoctor,
  createReceptionist,
  list,
  get,
  update,
  updateStatus,
  remove,
};
