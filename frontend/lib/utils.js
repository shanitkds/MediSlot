import { clsx } from "clsx";

export function cn(...inputs) {
  return clsx(inputs);
}

export function formatDate(value, options = {}) {
  if (!value) return "—";
  const date = new Date(value);
  if (isNaN(date.getTime())) return "—";

  if (options.timeOnly || options.time) {
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: options.timeZone || "UTC",
    });
  }

  if (options.dateOnly) {
    return date.toLocaleDateString([], {
      year: "numeric",
      month: "short",
      day: "numeric",
      timeZone: options.timeZone || "UTC",
    });
  }

  return date.toLocaleString([], options);
}

export function initials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export { getErrorMessage } from "@/lib/api/errors";
