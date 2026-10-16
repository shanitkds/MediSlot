import { apiClient } from "@/lib/api/apiClient";
import { qs } from "@/lib/api/queryString";

export const auditService = {
  list: (params) => apiClient(`/audit-logs${qs(params)}`),
};
