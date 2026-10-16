import { apiClient } from "@/lib/api/apiClient";
import { qs } from "@/lib/api/queryString";

export const doctorService = {
  create: (body) => apiClient("/doctors", { method: "POST", body }),
  list: (params) => apiClient(`/doctors${qs(params)}`),
  get: (id) => apiClient(`/doctors/${id}`),
  update: (id, body) => apiClient(`/doctors/${id}`, { method: "PATCH", body }),
  updateSpecialization: (id, body) =>
    apiClient(`/doctors/${id}/specialization`, { method: "PATCH", body }),
  updateDepartment: (id, body) =>
    apiClient(`/doctors/${id}/department`, { method: "PATCH", body }),
  remove: (id, params) => apiClient(`/doctors/${id}${qs(params)}`, { method: "DELETE" }),
};
