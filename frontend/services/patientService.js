import { apiClient } from "@/lib/api/apiClient";
import { qs } from "@/lib/api/queryString";

export const patientService = {
  create: (body) => apiClient("/patients", { method: "POST", body }),
  list: (params) => apiClient(`/patients${qs(params)}`),
  get: (id) => apiClient(`/patients/${id}`),
  update: (id, body) => apiClient(`/patients/${id}`, { method: "PATCH", body }),
  remove: (id) => apiClient(`/patients/${id}`, { method: "DELETE" }),
};
