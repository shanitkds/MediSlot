import { AppointmentsView } from "@/components/appointments";

export const metadata = {
  title: "Appointments | MediSlot",
  description: "View, filter, and manage clinic appointments, check-ins, and doctor consultations.",
};

export default function AppointmentsPage() {
  return <AppointmentsView />;
}
