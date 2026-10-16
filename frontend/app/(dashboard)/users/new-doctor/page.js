import { CreateDoctorUserView } from "@/components/users";

export const metadata = {
  title: "New Doctor | MediSlot",
  description: "Create and register a new medical doctor account and clinical profile.",
};

export default function NewDoctorUserPage() {
  return <CreateDoctorUserView />;
}
