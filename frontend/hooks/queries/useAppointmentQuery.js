import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { appointmentService } from "@/services/appointmentService";
import { dashboardKeys } from "./useDashboardQuery";
import { slotKeys } from "./useSlotQuery";

export const appointmentKeys = {
  all: ["appointments"],
  lists: () => [...appointmentKeys.all, "list"],
  list: (params) => [...appointmentKeys.lists(), params],
  details: () => [...appointmentKeys.all, "detail"],
  detail: (id) => [...appointmentKeys.details(), id],
};

export function useAppointments(params = {}, options = {}) {
  return useQuery({
    queryKey: appointmentKeys.list(params),
    queryFn: () => appointmentService.list(params),
    ...options,
  });
}

export function useAppointment(id, options = {}) {
  return useQuery({
    queryKey: appointmentKeys.detail(id),
    queryFn: () => appointmentService.get(id),
    enabled: !!id,
    ...options,
  });
}

export function useBookAppointment(options = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body) => appointmentService.book(body),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: appointmentKeys.all });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
      queryClient.invalidateQueries({ queryKey: slotKeys.all });
      options.onSuccess?.(...args);
    },
    ...options,
  });
}

export function useUpdateAppointment(options = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }) => appointmentService.update(id, body),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: appointmentKeys.all });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
      options.onSuccess?.(...args);
    },
    ...options,
  });
}

export function useCancelAppointment(options = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => appointmentService.cancel(id),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: appointmentKeys.all });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
      queryClient.invalidateQueries({ queryKey: slotKeys.all });
      options.onSuccess?.(...args);
    },
    ...options,
  });
}

export function useMarkAppointmentArrived(options = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => appointmentService.arrive(id),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: appointmentKeys.all });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
      options.onSuccess?.(...args);
    },
    ...options,
  });
}

export function useMarkAppointmentCompleted(options = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, notes = "" }) => appointmentService.complete(id, { notes }),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: appointmentKeys.all });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
      options.onSuccess?.(...args);
    },
    ...options,
  });
}
