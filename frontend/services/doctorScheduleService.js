import { apiClient } from "@/lib/api/apiClient";
import { qs } from "@/lib/api/queryString";

export const doctorScheduleService = {
  create: (body) => apiClient("/doctorschedule", { method: "POST", body }),
  list: (params) => apiClient(`/doctorschedule${qs(params)}`),
  getByDoctor: async (doctorId) => {
    if (!doctorId || doctorId === "undefined" || doctorId === "new") {
      return { success: false, data: { schedule: null } };
    }
    try {
      return await apiClient(`/doctorschedule/${doctorId}`);
    } catch (err) {
      if (err?.status === 404 || err?.statusCode === 404) {
        return { success: true, data: { schedule: null } };
      }
      throw err;
    }
  },
  update: (body) =>
    apiClient(body?.doctorId ? `/doctorschedule/${body.doctorId}` : "/doctorschedule", {
      method: "PUT",
      body,
    }),
  updateByDoctor: (doctorId, body) =>
    apiClient(`/doctorschedule/${doctorId}`, { method: "PUT", body }),
};
