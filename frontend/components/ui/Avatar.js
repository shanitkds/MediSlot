import React from "react";
import { cn, initials } from "@/lib/utils";

const sizeMap = {
  xs: "h-6 w-6 text-[10px]",
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
  xl: "h-16 w-16 text-xl",
};

const statusColors = {
  online: "bg-emerald-500",
  offline: "bg-slate-400",
  busy: "bg-rose-500",
  away: "bg-amber-500",
};

export function Avatar({
  name = "",
  src,
  alt,
  size = "md",
  status,
  className,
  ...props
}) {
  const isPresetSize = typeof size === "string" && sizeMap[size];
  const customStyle = !isPresetSize && typeof size === "number" ? { width: size, height: size } : undefined;

  return (
    <div
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center rounded-full select-none",
        isPresetSize ? sizeMap[size] : "h-10 w-10 text-sm",
        className
      )}
      style={customStyle}
      {...props}
    >
      {src ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={src}
          alt={alt || name || "Avatar"}
          className="h-full w-full rounded-full object-cover"
        />
      ) : (
        <span className="flex h-full w-full items-center justify-center rounded-full bg-gradient-to-tr from-indigo-500 to-indigo-600 font-semibold text-white shadow-inner">
          {initials(name) || "?"}
        </span>
      )}

      {status && statusColors[status] && (
        <span
          className={cn(
            "absolute bottom-0 right-0 block rounded-full ring-2 ring-surface",
            statusColors[status],
            size === "xs" || size === "sm" ? "h-2 w-2" : "h-2.5 w-2.5"
          )}
          aria-label={`Status: ${status}`}
        />
      )}
    </div>
  );
}
