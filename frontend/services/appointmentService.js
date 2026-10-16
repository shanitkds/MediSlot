import { apiClient } from "@/lib/api/apiClient";
import { qs } from "@/lib/api/queryString";

export const appointmentService = {
  /**
   * GET /api/v1/appointments
   * List, filter, and paginate appointments.
   */
  list: (params) => apiClient(`/appointments${qs(params)}`),

  /**
   * GET /api/v1/appointments/:id
   * Get single appointment by ID.
   */
  get: (id) => apiClient(`/appointments/${id}`),

  /**
   * POST /api/v1/appointments
   * Book an appointment.
   */
  book: (body) => apiClient("/appointments", { method: "POST", body }),

  /**
   * PATCH /api/v1/appointments/:id
   * Update appointment details (notes, purpose, slot).
   */
  update: (id, body) => apiClient(`/appointments/${id}`, { method: "PATCH", body }),

  /**
   * DELETE /api/v1/appointments/:id
   * Cancel an appointment.
   */
  cancel: (id) => apiClient(`/appointments/${id}`, { method: "DELETE" }),

  /**
   * POST /api/v1/appointments/:id/arrive
   * Mark patient as arrived.
   */
  arrive: (id) => apiClient(`/appointments/${id}/arrive`, { method: "POST" }),

  /**
   * POST /api/v1/appointments/:id/complete
   * Mark appointment as completed with optional notes.
   */
  complete: (id, body = {}) =>
    apiClient(`/appointments/${id}/complete`, { method: "POST", body }),
};
