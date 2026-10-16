"use client";

import React from "react";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import { getErrorMessage } from "@/lib/api/errors";

export function FormError({
  error,
  title,
  dismissible = true,
  onDismiss,
  className,
}) {
  if (!error) return null;

  let mainMessage = "";
  let fieldErrors = [];
  let status = null;
  let code = null;

  if (typeof error === "string") {
    mainMessage = error;
  } else if (Array.isArray(error)) {
    fieldErrors = error;
  } else if (typeof error === "object") {
    status = error.status || null;
    code = error.code || error.error?.code || null;
    mainMessage = getErrorMessage(error, "Submission could not be completed.");

    // Parse fields object or array (common in 422 VALIDATION_ERROR responses)
    const fields = error.fields || error.error?.fields;
    if (fields && typeof fields === "object") {
      if (Array.isArray(fields)) {
        fieldErrors = fields.map((f) => (typeof f === "string" ? f : `${f.field || f.path}: ${f.message}`));
      } else {
        fieldErrors = Object.entries(fields).map(([field, msg]) => `${field}: ${msg}`);
      }
    }
  }

  const alertTitle = title || (fieldErrors.length > 0 ? "Validation Error" : status === 409 ? "Conflict Error" : "Submission Error");

  return (
    <Alert
      variant="danger"
      title={alertTitle}
      dismissible={dismissible}
      onDismiss={onDismiss}
      className={cn("mb-4 animate-fadeIn", className)}
    >
      <div className="space-y-1.5">
        {(status || code) && (
          <div className="flex items-center gap-1.5 mb-1">
            {status && (
              <Badge variant="danger" size="sm">
                HTTP {status}
              </Badge>
            )}
            {code && (
              <Badge variant="outline" size="sm" className="font-mono text-[10px] uppercase">
                {code}
              </Badge>
            )}
          </div>
        )}

        {mainMessage && <p className="font-medium text-xs sm:text-sm">{mainMessage}</p>}

        {fieldErrors.length > 0 && (
          <ul className="mt-2 list-disc list-inside space-y-1 text-xs">
            {fieldErrors.map((err, idx) => (
              <li key={idx} className="font-medium">
                {err}
              </li>
            ))}
          </ul>
        )}
      </div>
    </Alert>
  );
}
