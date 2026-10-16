const { success } = require("../../utils/ApiResponse");
const slotService = require("./slot.service");

async function generateSlots(req, res) {
  const slots = await slotService.generateSlots(req.body, req.user, req);
  return success(res, {
    message: "Slots generated successfully",
    data: { slots },
    status: 201,
  });
}

async function listSlots(req, res) {
  const data = await slotService.listSlots(req.query, req.user, req);
  return success(res, {
    message: "Slots retrieved successfully",
    data,
  });
}

async function getSlotById(req, res) {
  const slot = await slotService.getSlotById(req.params.id, req.user, req);
  return success(res, {
    message: "Slot details retrieved successfully",
    data: { slot },
  });
}

async function updateSlotStatus(req, res) {
  const slot = await slotService.updateSlotStatus(req.params.id, req.body, req.user, req);
  return success(res, {
    message: "Slot status updated successfully",
    data: { slot },
  });
}

async function regenerateSlots(req, res) {
  const slots = await slotService.regenerateSlots(req.body, req.user, req);
  return success(res, {
    message: "Slots regenerated successfully",
    data: { slots },
  });
}

module.exports = {
  generateSlots,
  listSlots,
  getSlotById,
  updateSlotStatus,
  regenerateSlots,
};
