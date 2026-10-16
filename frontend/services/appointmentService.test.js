import { appointmentService } from "./appointmentService";
import * as apiClientModule from "@/lib/api/apiClient";

jest.mock("@/lib/api/apiClient", () => ({
  apiClient: jest.fn(),
}));

describe("appointmentService API Integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("lists appointments with query parameters", async () => {
    apiClientModule.apiClient.mockResolvedValueOnce({
      success: true,
      data: { items: [], pagination: { total: 0 } },
    });

    const res = await appointmentService.list({
      page: 1,
      limit: 10,
      status: "scheduled",
      doctorId: "661234567890abcdef123456",
    });

    expect(apiClientModule.apiClient).toHaveBeenCalledWith(
      expect.stringContaining("/appointments?")
    );
    expect(res.success).toBe(true);
  });

  it("retrieves a single appointment by ID", async () => {
    apiClientModule.apiClient.mockResolvedValueOnce({
      success: true,
      data: { appointment: { _id: "appt-123", status: "scheduled" } },
    });

    const res = await appointmentService.get("appt-123");

    expect(apiClientModule.apiClient).toHaveBeenCalledWith("/appointments/appt-123");
    expect(res.data.appointment._id).toBe("appt-123");
  });

  it("books a new appointment via POST", async () => {
    apiClientModule.apiClient.mockResolvedValueOnce({
      success: true,
      data: { appointment: { _id: "appt-new", status: "scheduled" } },
    });

    const payload = {
      patientId: "661111111111111111111111",
      doctorId: "662222222222222222222222",
      slotId: "663333333333333333333333",
      purpose: "Cardiac check-up",
    };

    const res = await appointmentService.book(payload);

    expect(apiClientModule.apiClient).toHaveBeenCalledWith("/appointments", {
      method: "POST",
      body: payload,
    });
    expect(res.data.appointment._id).toBe("appt-new");
  });

  it("updates appointment details and consultation notes via PATCH", async () => {
    apiClientModule.apiClient.mockResolvedValueOnce({
      success: true,
      data: { appointment: { _id: "appt-123", notes: "Patient recovering well" } },
    });

    const res = await appointmentService.update("appt-123", {
      notes: "Patient recovering well",
    });

    expect(apiClientModule.apiClient).toHaveBeenCalledWith("/appointments/appt-123", {
      method: "PATCH",
      body: { notes: "Patient recovering well" },
    });
    expect(res.data.appointment.notes).toBe("Patient recovering well");
  });

  it("cancels an appointment via DELETE", async () => {
    apiClientModule.apiClient.mockResolvedValueOnce({
      success: true,
      data: { appointment: { _id: "appt-123", status: "cancelled" } },
    });

    const res = await appointmentService.cancel("appt-123");

    expect(apiClientModule.apiClient).toHaveBeenCalledWith("/appointments/appt-123", {
      method: "DELETE",
    });
    expect(res.data.appointment.status).toBe("cancelled");
  });

  it("marks a patient as arrived via POST /:id/arrive", async () => {
    apiClientModule.apiClient.mockResolvedValueOnce({
      success: true,
      data: { appointment: { _id: "appt-123", status: "arrived" } },
    });

    const res = await appointmentService.arrive("appt-123");

    expect(apiClientModule.apiClient).toHaveBeenCalledWith(
      "/appointments/appt-123/arrive",
      { method: "POST" }
    );
    expect(res.data.appointment.status).toBe("arrived");
  });

  it("marks an appointment as completed via POST /:id/complete", async () => {
    apiClientModule.apiClient.mockResolvedValueOnce({
      success: true,
      data: { appointment: { _id: "appt-123", status: "completed" } },
    });

    const res = await appointmentService.complete("appt-123", {
      notes: "Follow up in 2 weeks",
    });

    expect(apiClientModule.apiClient).toHaveBeenCalledWith(
      "/appointments/appt-123/complete",
      { method: "POST", body: { notes: "Follow up in 2 weeks" } }
    );
    expect(res.data.appointment.status).toBe("completed");
  });
});
