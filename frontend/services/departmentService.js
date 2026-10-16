import { apiClient } from "@/lib/api/apiClient";
import { qs } from "@/lib/api/queryString";

export const departmentService = {
  create: (body) => apiClient("/departments", { method: "POST", body }),
  list: (params) => apiClient(`/departments${qs(params)}`),
  get: (id) => apiClient(`/departments/${id}`),
  update: (id, body) => apiClient(`/departments/${id}`, { method: "PATCH", body }),
  remove: (id) => apiClient(`/departments/${id}`, { method: "DELETE" }),
};
