"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";

const positionClasses = {
  top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
  bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
  left: "right-full top-1/2 -translate-y-1/2 mr-2",
  right: "left-full top-1/2 -translate-y-1/2 ml-2",
};

const arrowClasses = {
  top: "top-full left-1/2 -translate-x-1/2 border-t-slate-900 border-x-transparent border-b-transparent",
  bottom: "bottom-full left-1/2 -translate-x-1/2 border-b-slate-900 border-x-transparent border-t-transparent",
  left: "left-full top-1/2 -translate-y-1/2 border-l-slate-900 border-y-transparent border-r-transparent",
  right: "right-full top-1/2 -translate-y-1/2 border-r-slate-900 border-y-transparent border-l-transparent",
};

export function Tooltip({
  label,
  content,
  children,
  position = "top",
  className,
}) {
  const [visible, setVisible] = useState(false);
  const text = label || content;

  if (!text) return children;

  return (
    <div
      className="relative inline-flex items-center"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      {children}

      {visible && (
        <div
          role="tooltip"
          className={cn(
            "pointer-events-none absolute z-50 whitespace-nowrap rounded-md bg-slate-900 px-2.5 py-1 text-xs font-medium text-white shadow-md dark:bg-slate-100 dark:text-slate-900 animate-fadeIn",
            positionClasses[position] || positionClasses.top,
            className
          )}
        >
          {text}
          <span
            className={cn(
              "absolute border-4",
              arrowClasses[position] || arrowClasses.top,
              "dark:border-t-slate-100 dark:border-b-slate-100 dark:border-l-slate-100 dark:border-r-slate-100"
            )}
          />
        </div>
      )}
    </div>
  );
}
