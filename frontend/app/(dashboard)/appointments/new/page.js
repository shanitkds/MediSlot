import { BookAppointmentView } from "@/components/appointments";

export const metadata = {
  title: "Book Appointment | MediSlot",
  description: "Schedule a patient appointment, select doctor and reserve available consultation slot.",
};

export default function NewAppointmentPage() {
  return <BookAppointmentView />;
}
