import React from "react";
import { FiHelpCircle } from "react-icons/fi";
import { Tooltip } from "@/components/ui/Tooltip";
import { cn } from "@/lib/utils";

export function FormField({
  label,
  htmlFor,
  required = false,
  tooltip,
  hint,
  error,
  children,
  className,
}) {
  return (
    <div className={cn("w-full space-y-1.5 text-left", className)}>
      {label && (
        <div className="flex items-center gap-1.5 select-none">
          <label
            htmlFor={htmlFor}
            className="text-sm font-medium text-text cursor-pointer"
          >
            {label}
            {required && <span className="ml-1 text-danger font-bold">*</span>}
          </label>

          {tooltip && (
            <Tooltip content={tooltip}>
              <span className="inline-flex text-muted hover:text-text cursor-help">
                <FiHelpCircle className="h-3.5 w-3.5" aria-hidden="true" />
              </span>
            </Tooltip>
          )}
        </div>
      )}

      {children}

      {hint && !error && (
        <p className="text-xs text-muted">{hint}</p>
      )}

      {error && (
        <p className="text-xs font-medium text-danger animate-fadeIn">{error}</p>
      )}
    </div>
  );
}
