import { PatientsView } from "@/components/patients";

export const metadata = {
  title: "Patients",
  description: "View and manage clinic patient records, contact information, and history.",
};

export default function PatientsPage() {
  return <PatientsView />;
}
