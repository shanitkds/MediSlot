import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { departmentService } from "@/services/departmentService";

export const departmentKeys = {
  all: ["departments"],
  list: (params) => [...departmentKeys.all, "list", params],
  detail: (id) => [...departmentKeys.all, "detail", id],
};

export function useDepartments(params = {}, options = {}) {
  return useQuery({
    queryKey: departmentKeys.list(params),
    queryFn: () => departmentService.list(params),
    ...options,
  });
}

export function useDepartment(id, options = {}) {
  return useQuery({
    queryKey: departmentKeys.detail(id),
    queryFn: () => departmentService.get(id),
    enabled: Boolean(id),
    ...options,
  });
}

export function useCreateDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: departmentService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: departmentKeys.all });
    },
  });
}

export function useUpdateDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }) => departmentService.update(id, body),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: departmentKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: departmentKeys.all });
    },
  });
}

export function useDeleteDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => departmentService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: departmentKeys.all });
    },
  });
}
