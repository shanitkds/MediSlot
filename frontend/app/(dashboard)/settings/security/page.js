import { SecuritySettingsView } from "@/components/settings";

export const metadata = {
  title: "Security Settings",
  description: "Manage credentials, password updates, and session security.",
};

export default function SecuritySettingsPage() {
  return <SecuritySettingsView />;
}
