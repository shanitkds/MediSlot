import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { patientService } from "@/services/patientService";
import { profileService } from "@/services/profileService";

export const patientKeys = {
  all: ["patients"],
  list: (params) => [...patientKeys.all, "list", params],
  detail: (id) => [...patientKeys.all, "detail", id],
};

export const profileKeys = {
  all: ["profile"],
};

export function usePatients(params = {}, options = {}) {
  return useQuery({
    queryKey: patientKeys.list(params),
    queryFn: () => patientService.list(params),
    ...options,
  });
}

export function usePatient(id, options = {}) {
  return useQuery({
    queryKey: patientKeys.detail(id),
    queryFn: () => patientService.get(id),
    enabled: Boolean(id),
    ...options,
  });
}

export function useCreatePatient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: patientService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: patientKeys.all });
    },
  });
}

export function useUpdatePatient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }) => patientService.update(id, body),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: patientKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: patientKeys.all });
    },
  });
}

export function useDeletePatient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => patientService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: patientKeys.all });
    },
  });
}

export function useProfile(options = {}) {
  return useQuery({
    queryKey: profileKeys.all,
    queryFn: profileService.get,
    ...options,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: profileService.update,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.all });
    },
  });
}
