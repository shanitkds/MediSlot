import { AppointmentDetailView } from "@/components/appointments";

export const metadata = {
  title: "Appointment Details | MediSlot",
  description: "View and manage appointment details, patient arrival check-in, and clinical consultation notes.",
};

export default function AppointmentDetailPage({ params }) {
  return <AppointmentDetailView params={params} />;
}
