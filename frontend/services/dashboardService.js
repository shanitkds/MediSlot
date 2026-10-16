import { apiClient } from "@/lib/api/apiClient";
import { qs } from "@/lib/api/queryString";

export const dashboardService = {
  /**
   * GET /api/v1/dashboard/summary
   * Fetches role-tailored dashboard metrics and appointment counts.
   * Query params: { date?: string (YYYY-MM-DD), doctorId?: string }
   */
  getSummary: (params) => apiClient(`/dashboard/summary${qs(params)}`),

  /**
   * GET /api/v1/dashboard/appointments/today
   * Fetches today's appointments with optional grouping by status or time.
   * Query params: { date?: string, groupBy?: "status" | "time" | "none", doctorId?: string, departmentId?: string, status?: string }
   */
  getTodayAppointments: (params) =>
    apiClient(`/dashboard/appointments/today${qs(params)}`),

  /**
   * GET /api/v1/dashboard/appointments/upcoming
   * Fetches paginated upcoming appointments.
   * Query params: { page?: number, limit?: number, doctorId?: string, departmentId?: string, status?: string, includeCancelled?: boolean }
   */
  getUpcomingAppointments: (params) =>
    apiClient(`/dashboard/appointments/upcoming${qs(params)}`),
};
