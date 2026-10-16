import { UsersView } from "@/components/users";

export const metadata = {
  title: "User Management",
  description: "Manage medical staff, doctor accounts, receptionists, and system roles.",
};

export default function UsersPage() {
  return <UsersView />;
}
