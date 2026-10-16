"use client";

import React, { useState } from "react";
import {
  FiAlertCircle,
  FiRefreshCw,
  FiChevronDown,
  FiChevronUp,
  FiWifiOff,
  FiLock,
  FiFileText,
  FiServer,
  FiHelpCircle,
} from "react-icons/fi";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import { getErrorMessage } from "@/lib/api/errors";

function resolveErrorDetails(error) {
  if (!error) return { status: null, code: null, fields: {}, raw: null };

  const status = error.status !== undefined ? error.status : null;
  const code = error.code || error.error?.code || null;
  const fields = error.fields || error.error?.fields || {};
  const raw = typeof error === "object" ? error : { error: String(error) };

  return { status, code, fields, raw };
}

function getErrorIcon(status, code) {
  if (status === 0 || code === "NETWORK_ERROR") {
    return <FiWifiOff className="h-6 w-6" aria-hidden="true" />;
  }
  if (status === 403 || status === 401 || code === "FORBIDDEN" || code === "UNAUTHORIZED") {
    return <FiLock className="h-6 w-6" aria-hidden="true" />;
  }
  if (status === 404 || code === "NOT_FOUND") {
    return <FiFileText className="h-6 w-6" aria-hidden="true" />;
  }
  if (status >= 500 || code === "SERVER_ERROR" || code === "INTERNAL") {
    return <FiServer className="h-6 w-6" aria-hidden="true" />;
  }
  return <FiAlertCircle className="h-6 w-6" aria-hidden="true" />;
}

function resolveContextualTitle(explicitTitle, status, code) {
  if (explicitTitle && explicitTitle !== "Something went wrong") {
    return explicitTitle;
  }
  if (status === 0 || code === "NETWORK_ERROR") {
    return "Network Connection Error";
  }
  if (status === 404 || code === "NOT_FOUND") {
    return "Resource Not Found (404)";
  }
  if (status === 403 || code === "FORBIDDEN") {
    return "Access Denied (403)";
  }
  if (status === 401 || code === "UNAUTHORIZED") {
    return "Authentication Required (401)";
  }
  if (status === 409 || code === "CONFLICT") {
    return "Conflict / Duplicate Entry (409)";
  }
  if (status === 422 || code === "VALIDATION_ERROR") {
    return "Validation Error (422)";
  }
  if (status >= 500) {
    return `Server Error (${status})`;
  }
  return explicitTitle || "Something went wrong";
}

export function ErrorState({
  title,
  message,
  description,
  error,
  onRetry,
  retryLabel = "Try Again",
  action,
  showDetails = true,
  className,
}) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const { status, code, fields, raw } = resolveErrorDetails(error);

  const errorText =
    message ||
    description ||
    getErrorMessage(error, "An unexpected error occurred while loading this data. Please try again.");

  const computedTitle = resolveContextualTitle(title, status, code);
  const hasFields = fields && typeof fields === "object" && Object.keys(fields).length > 0;
  const hasMeta = Boolean(status !== null || code);

  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-rose-200 bg-rose-50/50 dark:border-rose-900/40 dark:bg-rose-950/20 px-6 py-10 text-center transition-all",
        className
      )}
    >
      {/* Visual Status Icon */}
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-600 dark:bg-rose-900/60 dark:text-rose-400">
        {getErrorIcon(status, code)}
      </div>

      {/* Meta Badges */}
      {hasMeta && (
        <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5">
          {status !== null && (
            <Badge variant={status >= 500 ? "danger" : status === 404 ? "warning" : "default"}>
              {status === 0 ? "Offline / Network" : `HTTP ${status}`}
            </Badge>
          )}
          {code && (
            <Badge variant="outline" className="font-mono text-[10px] tracking-wider uppercase">
              {code}
            </Badge>
          )}
        </div>
      )}

      {/* Title */}
      <h3 className="mt-3 font-display text-base font-semibold text-rose-950 dark:text-rose-200">
        {computedTitle}
      </h3>

      {/* Main Error Message */}
      <p className="mt-1.5 max-w-lg text-xs sm:text-sm text-rose-800/90 dark:text-rose-300/90 leading-relaxed font-normal">
        {errorText}
      </p>

      {/* Field Validation Errors Breakdown */}
      {hasFields && (
        <div className="mt-4 w-full max-w-md rounded-lg border border-rose-200/80 bg-surface/90 dark:border-rose-900/50 dark:bg-rose-950/40 p-3.5 text-left shadow-xs">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-900 dark:text-rose-200 mb-2">
            <FiHelpCircle className="h-3.5 w-3.5 text-rose-600" />
            <span>Specific Field Errors</span>
          </div>
          <ul className="space-y-1.5 text-xs text-rose-800 dark:text-rose-300">
            {Object.entries(fields).map(([field, msg]) => (
              <li key={field} className="flex items-start gap-1.5">
                <span className="font-mono font-medium text-rose-700 dark:text-rose-400 shrink-0">
                  {field}:
                </span>
                <span className="break-words">{String(msg)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Expandable Technical Details */}
      {showDetails && raw && (
        <div className="mt-4 w-full max-w-md">
          <button
            type="button"
            onClick={() => setDetailsOpen(!detailsOpen)}
            className="inline-flex items-center gap-1 text-xs text-rose-700/80 hover:text-rose-900 dark:text-rose-400 dark:hover:text-rose-200 underline underline-offset-2 transition-colors cursor-pointer"
          >
            <span>{detailsOpen ? "Hide technical details" : "Show technical details"}</span>
            {detailsOpen ? <FiChevronUp className="h-3 w-3" /> : <FiChevronDown className="h-3 w-3" />}
          </button>

          {detailsOpen && (
            <div className="mt-2 rounded-lg border border-rose-200 bg-rose-100/60 dark:border-rose-900/60 dark:bg-slate-900/90 p-3 text-left font-mono text-[11px] text-rose-950 dark:text-rose-200 overflow-x-auto max-h-48">
              <pre className="whitespace-pre-wrap break-words">
                {JSON.stringify(
                  {
                    message: raw.message,
                    status: raw.status,
                    code: raw.code,
                    fields: raw.fields,
                    details: raw.details || raw.stack || undefined,
                  },
                  null,
                  2
                )}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* Actions & Retry */}
      {action ? (
        <div className="mt-5">{action}</div>
      ) : onRetry ? (
        <div className="mt-5">
          <Button variant="danger" size="sm" onClick={onRetry} className="gap-2 shadow-xs">
            <FiRefreshCw className="h-4 w-4" aria-hidden="true" />
            <span>{retryLabel}</span>
          </Button>
        </div>
      ) : null}
    </div>
  );
}
