"use client";

import React, { useEffect } from "react";
import { ErrorState } from "@/components/common/ErrorState";

export default function GlobalErrorPage({ error, reset }) {
  useEffect(() => {
    // Log unexpected client runtime error
    console.error("Application runtime error boundary caught:", error);
  }, [error]);

  return (
    <div className="flex min-h-[70vh] items-center justify-center p-6">
      <div className="w-full max-w-lg">
        <ErrorState
          error={error}
          title="Application Encountered an Error"
          message={error?.message || "An unexpected error interrupted application execution."}
          onRetry={() => reset()}
          retryLabel="Reload Component"
        />
      </div>
    </div>
  );
}
