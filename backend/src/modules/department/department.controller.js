const { success } = require("../../utils/ApiResponse");
const departmentService = require("./department.service");

async function create(req, res) {
  const department = await departmentService.create(req.body, req.user, req);
  return success(res, {
    message: "Department created successfully",
    data: { department },
    status: 201,
  });
}

async function list(req, res) {
  const data = await departmentService.list(req.query);
  return success(res, {
    message: "Departments retrieved successfully",
    data,
  });
}

async function get(req, res) {
  const department = await departmentService.getById(req.params.id);
  return success(res, {
    message: "Department details retrieved successfully",
    data: { department },
  });
}

async function update(req, res) {
  const department = await departmentService.update(req.params.id, req.body, req.user, req);
  return success(res, {
    message: "Department updated successfully",
    data: { department },
  });
}

async function deleteOrDeactivate(req, res) {
  const result = await departmentService.deleteOrDeactivate(req.params.id, req.user, req);
  const message = result.deleted
    ? "Department deleted successfully"
    : "Department deactivated successfully";
  return success(res, {
    message,
    data: result,
  });
}

module.exports = {
  create,
  list,
  get,
  update,
  deleteOrDeactivate,
};
