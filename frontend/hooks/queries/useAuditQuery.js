import { useQuery } from "@tanstack/react-query";
import { auditService } from "@/services/auditService";

export const auditKeys = {
  all: ["audit-logs"],
  list: (params) => [...auditKeys.all, "list", params],
};

export function useAuditLogs(params = {}, options = {}) {
  return useQuery({
    queryKey: auditKeys.list(params),
    queryFn: () => auditService.list(params),
    ...options,
  });
}
