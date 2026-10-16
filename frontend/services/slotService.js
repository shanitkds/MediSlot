import { apiClient } from "@/lib/api/apiClient";
import { qs } from "@/lib/api/queryString";

export const slotService = {
  generate: (body) => apiClient("/slots/generate", { method: "POST", body }),
  regenerate: (body) => apiClient("/slots/regenerate", { method: "POST", body }),
  list: (params) => apiClient(`/slots${qs(params)}`),
  get: (id) => apiClient(`/slots/${id}`),
  update: (id, body) => apiClient(`/slots/${id}`, { method: "PATCH", body }),
};
