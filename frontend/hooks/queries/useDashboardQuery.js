import { useQuery } from "@tanstack/react-query";
import { dashboardService } from "@/services/dashboardService";

export const dashboardKeys = {
  all: ["dashboard"],
  summary: (params) => [...dashboardKeys.all, "summary", params],
  todayAppointments: (params) => [...dashboardKeys.all, "appointments", "today", params],
  upcomingAppointments: (params) => [...dashboardKeys.all, "appointments", "upcoming", params],
};

export function useDashboardSummary(params = {}, options = {}) {
  return useQuery({
    queryKey: dashboardKeys.summary(params),
    queryFn: () => dashboardService.getSummary(params),
    ...options,
  });
}

export function useTodayAppointments(params = {}, options = {}) {
  return useQuery({
    queryKey: dashboardKeys.todayAppointments(params),
    queryFn: () => dashboardService.getTodayAppointments(params),
    ...options,
  });
}

export function useUpcomingAppointments(params = {}, options = {}) {
  return useQuery({
    queryKey: dashboardKeys.upcomingAppointments(params),
    queryFn: () => dashboardService.getUpcomingAppointments(params),
    ...options,
  });
}
