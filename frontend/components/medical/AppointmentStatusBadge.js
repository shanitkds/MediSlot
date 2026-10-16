import React from "react";
import { Badge } from "@/components/ui/Badge";

const appointmentVariants = {
  available: { variant: "success", label: "Available" },
  scheduled: { variant: "primary", label: "Scheduled" },
  booked: { variant: "primary", label: "Booked" },
  confirmed: { variant: "primary", label: "Confirmed" },
  arrived: { variant: "warning", label: "Arrived" },
  checked_in: { variant: "warning", label: "Checked In" },
  in_progress: { variant: "warning", label: "In Consultation" },
  completed: { variant: "success", label: "Completed" },
  cancelled: { variant: "danger", label: "Cancelled" },
  no_show: { variant: "danger", label: "No Show" },
  default: { variant: "default", label: "Pending" },
};

export function AppointmentStatusBadge({
  status = "available",
  label,
  size = "md",
  dot = true,
  className,
}) {
  const normalized = String(status).toLowerCase().trim();
  const config = appointmentVariants[normalized] || appointmentVariants.default;
  const displayLabel = label || config.label;

  return (
    <Badge
      variant={config.variant}
      size={size}
      dot={dot}
      className={className}
    >
      {displayLabel}
    </Badge>
  );
}
