import React from "react";
import { cn } from "@/lib/utils";

const maxWidths = {
  narrow: "max-w-4xl",
  default: "max-w-7xl",
  wide: "max-w-screen-2xl",
  full: "max-w-full",
};

export function PageContainer({
  children,
  maxWidth = "default",
  className,
  header,
  ...props
}) {
  return (
    <div
      className={cn(
        "mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 transition-all duration-150 animate-fadeIn",
        maxWidths[maxWidth] || maxWidths.default,
        className
      )}
      {...props}
    >
      {header && <div className="mb-6">{header}</div>}
      {children}
    </div>
  );
}
