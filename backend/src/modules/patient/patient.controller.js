const { success } = require("../../utils/ApiResponse");
const patientService = require("./patient.service");

async function create(req, res) {
  const patient = await patientService.create(req.body, req.user, req);
  return success(res, {
    message: "Patient registered successfully",
    data: { patient },
    status: 201,
  });
}

async function list(req, res) {
  const data = await patientService.list(req.query);
  return success(res, {
    message: "Patients retrieved successfully",
    data,
  });
}

async function get(req, res) {
  const patient = await patientService.getById(req.params.id);
  return success(res, {
    message: "Patient details retrieved successfully",
    data: { patient },
  });
}

async function update(req, res) {
  const patient = await patientService.update(req.params.id, req.body, req.user, req);
  return success(res, {
    message: "Patient updated successfully",
    data: { patient },
  });
}

async function deactivate(req, res) {
  const patient = await patientService.deactivate(req.params.id, req.user, req);
  return success(res, {
    message: "Patient deactivated successfully",
    data: { patient },
  });
}

module.exports = {
  create,
  list,
  get,
  update,
  deactivate,
};
