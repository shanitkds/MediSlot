import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { doctorScheduleService } from "@/services/doctorScheduleService";

export const doctorScheduleKeys = {
  all: ["doctorSchedules"],
  list: (params) => [...doctorScheduleKeys.all, "list", params],
  byDoctor: (doctorId) => [...doctorScheduleKeys.all, "doctor", doctorId],
};

export function useDoctorSchedules(params = {}, options = {}) {
  return useQuery({
    queryKey: doctorScheduleKeys.list(params),
    queryFn: () => doctorScheduleService.list(params),
    ...options,
  });
}

export function useDoctorSchedule(doctorId, options = {}) {
  const isValidDoctorId = Boolean(
    doctorId && doctorId !== "undefined" && doctorId !== "new" && doctorId !== "null"
  );
  return useQuery({
    queryKey: doctorScheduleKeys.byDoctor(doctorId),
    queryFn: () => doctorScheduleService.getByDoctor(doctorId),
    enabled: isValidDoctorId,
    ...options,
  });
}

export function useConfigureDoctorSchedule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: doctorScheduleService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: doctorScheduleKeys.all });
    },
  });
}

export function useUpdateDoctorSchedule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: doctorScheduleService.update,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: doctorScheduleKeys.all });
    },
  });
}

export function useUpdateDoctorScheduleByDoctor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ doctorId, ...body }) => doctorScheduleService.updateByDoctor(doctorId, body),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: doctorScheduleKeys.byDoctor(variables.doctorId) });
      queryClient.invalidateQueries({ queryKey: doctorScheduleKeys.all });
    },
  });
}
