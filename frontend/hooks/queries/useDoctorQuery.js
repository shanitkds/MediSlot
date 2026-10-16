import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { doctorService } from "@/services/doctorService";

export const doctorKeys = {
  all: ["doctors"],
  list: (params) => [...doctorKeys.all, "list", params],
  detail: (id) => [...doctorKeys.all, "detail", id],
};

export function useDoctors(params = {}, options = {}) {
  return useQuery({
    queryKey: doctorKeys.list(params),
    queryFn: () => doctorService.list(params),
    ...options,
  });
}

export function useDoctor(id, options = {}) {
  return useQuery({
    queryKey: doctorKeys.detail(id),
    queryFn: () => doctorService.get(id),
    enabled: Boolean(id),
    ...options,
  });
}

export function useCreateDoctorProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: doctorService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: doctorKeys.all });
    },
  });
}

export function useUpdateDoctor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }) => doctorService.update(id, body),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: doctorKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: doctorKeys.all });
    },
  });
}

export function useUpdateDoctorSpecialization() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }) => doctorService.updateSpecialization(id, body),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: doctorKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: doctorKeys.all });
    },
  });
}

export function useUpdateDoctorDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }) => doctorService.updateDepartment(id, body),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: doctorKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: doctorKeys.all });
    },
  });
}

export function useDeleteDoctor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (arg) => {
      if (typeof arg === "object" && arg !== null) {
        return doctorService.remove(arg.id, { permanent: arg.permanent });
      }
      return doctorService.remove(arg);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: doctorKeys.all });
    },
  });
}
