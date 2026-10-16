const { success } = require("../../utils/ApiResponse");
const doctorService = require("./doctor.service");

async function create(req, res) {
  const doctor = await doctorService.create(req.body, req.user, req);
  return success(res, {
    message: "Doctor profile created successfully",
    data: { doctor },
    status: 201,
  });
}

async function list(req, res) {
  const data = await doctorService.list(req.query);
  return success(res, {
    message: "Doctors retrieved successfully",
    data,
  });
}

async function get(req, res) {
  const doctor = await doctorService.getById(req.params.id);
  return success(res, {
    message: "Doctor profile retrieved successfully",
    data: { doctor },
  });
}

async function update(req, res) {
  const doctor = await doctorService.update(req.params.id, req.body, req.user, req);
  return success(res, {
    message: "Doctor profile updated successfully",
    data: { doctor },
  });
}

async function updateSpecialization(req, res) {
  const doctor = await doctorService.updateSpecialization(
    req.params.id,
    req.body.specialization,
    req.user,
    req
  );
  return success(res, {
    message: "Doctor specialization updated successfully",
    data: { doctor },
  });
}

async function updateDepartment(req, res) {
  const doctor = await doctorService.updateDepartment(
    req.params.id,
    req.body.departmentId,
    req.user,
    req
  );
  return success(res, {
    message: "Doctor department updated successfully",
    data: { doctor },
  });
}

async function deactivate(req, res) {
  const data = await doctorService.deactivate(req.params.id, req.user, req);
  return success(res, {
    message: "Doctor profile deactivated successfully",
    data,
  });
}

module.exports = {
  create,
  list,
  get,
  update,
  updateSpecialization,
  updateDepartment,
  deactivate,
};
