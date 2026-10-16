import { EditDoctorView } from "@/components/doctors";

export const metadata = {
  title: "Edit Doctor | MediSlot",
  description: "Update doctor practitioner account and configure their clinical profile.",
};

export default function EditDoctorPage({ params }) {
  return <EditDoctorView params={params} />;
}
