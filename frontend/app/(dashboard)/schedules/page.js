import { SchedulesView } from "@/components/schedules";

export const metadata = {
  title: "Doctor Schedules",
  description: "Configure working days, consultation sessions, and break times.",
};

export default function SchedulesPage() {
  return <SchedulesView />;
}
