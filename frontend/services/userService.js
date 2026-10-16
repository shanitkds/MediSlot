import { apiClient } from "@/lib/api/apiClient";
import { qs } from "@/lib/api/queryString";

export const userService = {
  createDoctor: (body) => apiClient("/users/doctors", { method: "POST", body }),
  createReceptionist: (body) => apiClient("/users/receptionists", { method: "POST", body }),
  list: (params) => apiClient(`/users${qs(params)}`),
  get: (id) => apiClient(`/users/${id}`),
  update: (id, body) => apiClient(`/users/${id}`, { method: "PATCH", body }),
  updateStatus: (id, data) =>
    apiClient(`/users/${id}/status`, {
      method: "PATCH",
      body: typeof data === "string" ? { status: data } : data,
    }),
  remove: (id) => apiClient(`/users/${id}`, { method: "DELETE" }),
};
