"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  FiSearch,
  FiUser,
  FiPhone,
  FiCalendar,
  FiX,
  FiCheck,
} from "react-icons/fi";
import { usePatients } from "@/hooks/queries/usePatientQuery";
import { Avatar } from "@/components/ui/Avatar";
import { Spinner } from "@/components/ui/Spinner";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

export function PatientSearch({
  onSelect,
  placeholder = "Search patient by name, mobile, or ID (e.g. PT-001)...",
  className,
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  // Fetch patients matching search
  const { data, isLoading } = usePatients(
    { search: query },
    { enabled: query.trim().length >= 1 }
  );

  const patients =
    data?.data?.items ||
    data?.data?.patients ||
    (Array.isArray(data?.data) ? data.data : []);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (patient) => {
    onSelect?.(patient);
    setQuery("");
    setOpen(false);
  };

  return (
    <div className={cn("relative w-full text-left", className)} ref={containerRef}>
      <div className="relative flex items-center">
        <FiSearch className="pointer-events-none absolute left-3.5 h-4 w-4 text-muted" />

        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            if (query.trim().length >= 1) setOpen(true);
          }}
          placeholder={placeholder}
          className="h-11 w-full rounded-xl border border-border bg-surface pl-10 pr-10 text-sm text-text placeholder:text-muted transition-colors outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 shadow-sm"
        />

        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setOpen(false);
            }}
            aria-label="Clear search"
            className="absolute right-3 flex h-5 w-5 items-center justify-center rounded-full text-muted hover:bg-slate-200 hover:text-text dark:hover:bg-slate-700 transition-colors"
          >
            <FiX className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Results Dropdown */}
      {open && query.trim().length >= 1 && (
        <div className="absolute left-0 right-0 z-40 mt-2 max-h-80 overflow-y-auto rounded-xl border border-border bg-surface p-1 text-text shadow-xl ring-1 ring-black/5 dark:ring-white/5 animate-scaleUp">
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 py-8 text-xs text-muted">
              <Spinner size="sm" />
              <span>Searching patient records...</span>
            </div>
          ) : patients.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted">
              <p>No patient records found matching &ldquo;{query}&rdquo;</p>
              <p className="mt-1 text-[11px] text-muted/80">Try searching with full name or phone number</p>
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {patients.map((patient) => (
                <div
                  key={patient.id || patient._id || patient.patientId}
                  onClick={() => handleSelect(patient)}
                  className="flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 rounded-lg transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <Avatar name={patient.name} size="sm" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-text">{patient.name}</span>
                        <Badge variant="outline" size="sm" className="font-mono text-[10px] py-0 px-1.5">
                          {patient.patientId}
                        </Badge>
                      </div>
                      <div className="mt-0.5 flex items-center gap-3 text-[11px] text-muted">
                        <span className="flex items-center gap-1">
                          <FiPhone className="h-3 w-3" />
                          {patient.mobile}
                        </span>
                        <span>•</span>
                        <span className="capitalize">{patient.gender || "Unspecified"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="hidden sm:inline text-xs text-primary font-medium">Select</span>
                    <FiCheck className="h-4 w-4 text-primary" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
