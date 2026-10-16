import { AuditLogsView } from "@/components/audit";

export const metadata = {
  title: "Audit Logs",
  description: "Review security events, access logs, and administrative actions.",
};

export default function AuditLogsPage() {
  return <AuditLogsView />;
}
