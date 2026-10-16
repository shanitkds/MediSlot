import React from "react";
import { Badge } from "@/components/ui/Badge";

// Mapping status tokens to semantic badge variants
const statusVariantMap = {
  // Success / Active states
  active: "success",
  completed: "success",
  confirmed: "success",
  approved: "success",
  available: "success",
  published: "success",
  paid: "success",
  success: "success",
  verified: "success",

  // Warning / In-progress states
  pending: "warning",
  scheduled: "warning",
  waiting: "warning",
  in_progress: "warning",
  "in-progress": "warning",
  processing: "warning",
  review: "warning",
  warning: "warning",

  // Danger / Terminated states
  inactive: "danger",
  disabled: "danger",
  cancelled: "danger",
  rejected: "danger",
  failed: "danger",
  blocked: "danger",
  expired: "danger",
  unpaid: "danger",
  danger: "danger",
  error: "danger",

  // Primary / Info states
  booked: "primary",
  rescheduled: "primary",
  arrived: "primary",
  info: "primary",
  draft: "default",
  archived: "default",
};

function formatStatusText(str = "") {
  return str
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function StatusBadge({
  status = "",
  label,
  size = "md",
  dot = true,
  className,
  ...props
}) {
  const normalizedKey = String(status).toLowerCase().trim();
  const variant = statusVariantMap[normalizedKey] || "default";
  const displayLabel = label || formatStatusText(status);

  return (
    <Badge
      variant={variant}
      size={size}
      dot={dot}
      className={className}
      {...props}
    >
      {displayLabel}
    </Badge>
  );
}
