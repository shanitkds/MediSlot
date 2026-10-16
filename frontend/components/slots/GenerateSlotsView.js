"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { PermissionGate } from "@/components/permissions/PermissionGate";
import { PERMISSIONS } from "@/constants/permissions";
import { PageContainer } from "@/components/common/PageContainer";
import { PageHeader } from "@/components/common/PageHeader";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { DoctorSelect } from "@/components/medical/DoctorSelect";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { useGenerateSlots } from "@/hooks/queries/useSlotQuery";
import { useDoctorSchedule } from "@/hooks/queries/useDoctorScheduleQuery";
import { useDoctor } from "@/hooks/queries/useDoctorQuery";
import { useToast } from "@/contexts/ToastProvider";
import {
  FiClock,
  FiCalendar,
  FiCheck,
  FiAlertCircle,
  FiCoffee,
  FiArrowRight,
  FiPlusCircle,
  FiCheckCircle,
  FiLayers,
} from "react-icons/fi";
import { cn } from "@/lib/utils";

const weekDayNames = [
  { num: 1, name: "Monday", short: "Mon" },
  { num: 2, name: "Tuesday", short: "Tue" },
  { num: 3, name: "Wednesday", short: "Wed" },
  { num: 4, name: "Thursday", short: "Thu" },
  { num: 5, name: "Friday", short: "Fri" },
  { num: 6, name: "Saturday", short: "Sat" },
  { num: 0, name: "Sunday", short: "Sun" },
];

function formatTimeUtc(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", timeZone: "UTC" });
}

function timeToMinutes(timeStr) {
  if (!timeStr || typeof timeStr !== "string") return 0;
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours * 60 + minutes;
}

export function GenerateSlotsView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  const generateMutation = useGenerateSlots();

  const queryDoctorId = searchParams.get("doctorId") || "";
  const [doctorId, setDoctorId] = useState(queryDoctorId);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [error, setError] = useState(null);
  const [resultData, setResultData] = useState(null);

  useEffect(() => {
    if (queryDoctorId && !doctorId) {
      setDoctorId(queryDoctorId);
    }
  }, [queryDoctorId, doctorId]);

  // Fetch Doctor Profile & Schedule
  const { data: docData, isLoading: loadingDoctor } = useDoctor(doctorId, {
    enabled: Boolean(doctorId),
  });
  const doctor = docData?.data?.doctor || docData?.data || null;

  const {
    data: schedData,
    isLoading: loadingSchedule,
    refetch: refetchSchedule,
  } = useDoctorSchedule(doctorId, {
    enabled: Boolean(doctorId),
  });
  const schedule = schedData?.data?.schedule || schedData?.data || null;

  // Day of Week calculations for the selected date
  const dayEvaluation = useMemo(() => {
    if (!date) return null;
    const [year, month, day] = date.split("-").map(Number);
    const dateObj = new Date(Date.UTC(year, month - 1, day));
    const jsDay = dateObj.getUTCDay(); // 0 = Sun, 1 = Mon ...
    const isoDay = jsDay === 0 ? 7 : jsDay;

    const weekdayItem = weekDayNames.find((w) => w.num === jsDay) || {
      name: "Day",
      short: "Day",
    };

    if (!schedule) {
      return {
        weekdayName: weekdayItem.name,
        weekdayShort: weekdayItem.short,
        isWorkingDay: true,
        hasSchedule: false,
      };
    }

    const workingDays = Array.isArray(schedule.workingDays)
      ? schedule.workingDays
      : [1, 2, 3, 4, 5];
    const isWorkingDay =
      workingDays.includes(jsDay) || workingDays.includes(isoDay);

    return {
      weekdayName: weekdayItem.name,
      weekdayShort: weekdayItem.short,
      isWorkingDay,
      hasSchedule: true,
      workingDays,
    };
  }, [date, schedule]);

  // Schedule shift metrics
  const scheduleMetrics = useMemo(() => {
    if (!schedule) return null;
    const sessions = schedule.sessions || [];
    const breaks = schedule.breaks || [];
    const duration = Math.max(5, Number(schedule.slotDurationMinutes) || 15);

    let grossMinutes = 0;
    sessions.forEach((s) => {
      const sStart = s.startTime || s.start;
      const sEnd = s.endTime || s.end;
      if (sStart && sEnd) {
        grossMinutes += Math.max(0, timeToMinutes(sEnd) - timeToMinutes(sStart));
      }
    });

    let breakMinutes = 0;
    breaks.forEach((b) => {
      const bStart = b.startTime || b.start;
      const bEnd = b.endTime || b.end;
      if (bStart && bEnd) {
        breakMinutes += Math.max(0, timeToMinutes(bEnd) - timeToMinutes(bStart));
      }
    });

    const netMinutes = Math.max(0, grossMinutes - breakMinutes);
    const estimatedSlots = Math.floor(netMinutes / duration);

    return {
      sessions,
      breaks,
      duration,
      grossMinutes,
      breakMinutes,
      netMinutes,
      estimatedSlots,
    };
  }, [schedule]);

  // Jump to doctor's next working day helper
  const handleJumpToNextWorkingDay = () => {
    if (!schedule || !Array.isArray(schedule.workingDays) || schedule.workingDays.length === 0) {
      return;
    }
    const [year, month, day] = (date || new Date().toISOString().split("T")[0])
      .split("-")
      .map(Number);
    const d = new Date(Date.UTC(year, month - 1, day));

    for (let offset = 1; offset <= 7; offset++) {
      const nextDate = new Date(d.getTime() + offset * 86400000);
      const jsDay = nextDate.getUTCDay();
      const isoDay = jsDay === 0 ? 7 : jsDay;
      if (schedule.workingDays.includes(jsDay) || schedule.workingDays.includes(isoDay)) {
        const ny = nextDate.getUTCFullYear();
        const nm = String(nextDate.getUTCMonth() + 1).padStart(2, "0");
        const nd = String(nextDate.getUTCDate()).padStart(2, "0");
        setDate(`${ny}-${nm}-${nd}`);
        setError(null);
        return;
      }
    }
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    setError(null);
    setResultData(null);

    if (!doctorId) {
      setError("Please select a doctor to generate consultation slots.");
      return;
    }

    if (!date) {
      setError("Please select an appointment calendar date.");
      return;
    }

    if (dayEvaluation?.hasSchedule && !dayEvaluation?.isWorkingDay) {
      setError(
        `Dr. ${doctor?.userId?.name || doctor?.name || "Doctor"} is not scheduled to work on ${dayEvaluation.weekdayName}s (${date}).`
      );
      return;
    }

    try {
      const res = await generateMutation.mutateAsync({
        doctorId,
        date,
      });

      const slots = res?.data?.slots || res?.data?.items || (Array.isArray(res?.data) ? res.data : []);
      const count = slots.length;

      toast.success(`${count} consultation slots generated successfully for ${date}.`);
      setResultData({
        count,
        slots,
        date,
      });
    } catch (err) {
      const msg = err?.message || "Failed to generate slots for the selected date.";
      setError(msg);
      toast.error(msg);
    }
  };

  const doctorName = doctor?.userId?.name || doctor?.user?.name || doctor?.name || "Practitioner";

  return (
    <PermissionGate
      roles={["super_admin", "admin", "receptionist"]}
      permission={PERMISSIONS.SLOTS_CREATE}
    >
      <PageContainer maxWidth="compact" className="space-y-6">
        <Breadcrumbs />

        <PageHeader
          title="Slot Generator"
          description="Create bookable consultation slots strictly based on doctor working sessions, automatically skipping break periods."
        />

        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
            <form onSubmit={handleGenerate} className="space-y-5">
              {error && <Alert variant="danger" title="Generation Error" description={error} />}

              {/* Doctor Selector */}
              <DoctorSelect
                value={doctorId}
                onChange={(id) => {
                  setDoctorId(id);
                  setError(null);
                  setResultData(null);
                }}
                required
              />

              {/* Doctor Schedule Information Card */}
              {doctorId && (
                <div className="rounded-xl border border-border/80 bg-slate-50/70 dark:bg-slate-800/40 p-4 space-y-3.5">
                  {loadingSchedule ? (
                    <div className="flex items-center gap-2 text-xs text-muted py-2">
                      <Spinner size="xs" />
                      <span>Loading doctor schedule details...</span>
                    </div>
                  ) : !schedule ? (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-amber-700 dark:text-amber-400">
                      <div className="flex items-center gap-2">
                        <FiAlertCircle className="h-4 w-4 shrink-0" />
                        <span>
                          <strong>No schedule configured yet:</strong> Please establish doctor shift sessions and break hours first.
                        </span>
                      </div>
                      <Link href={`/schedules/${doctorId}`}>
                        <Button variant="outline" size="xs" className="gap-1 shrink-0">
                          <FiPlusCircle className="h-3 w-3" />
                          Configure Hours
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between border-b border-border/60 pb-2">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-text">
                          <FiLayers className="h-3.5 w-3.5 text-primary" />
                          <span>Dr. {doctorName.replace(/^Dr\.\s*/i, "")}&apos;s Active Shift Rules</span>
                        </div>
                        <Badge variant="outline" size="sm">
                          {scheduleMetrics?.duration || 15} min / slot
                        </Badge>
                      </div>

                      {/* Sessions and Breaks Display */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        {/* Clinical Sessions */}
                        <div className="rounded-lg bg-surface border border-border p-3 space-y-1.5">
                          <span className="text-[11px] font-semibold uppercase tracking-wider text-primary flex items-center gap-1">
                            <FiClock className="h-3 w-3" />
                            Clinical Sessions ({scheduleMetrics?.sessions?.length || 0})
                          </span>
                          <div className="space-y-1">
                            {scheduleMetrics?.sessions?.map((s, idx) => (
                              <div key={idx} className="flex items-center justify-between font-mono font-semibold text-text">
                                <span>Shift {idx + 1}</span>
                                <span>{s.startTime || s.start} — {s.endTime || s.end}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Break Periods */}
                        <div className="rounded-lg bg-surface border border-amber-200/60 dark:border-amber-800/40 p-3 space-y-1.5">
                          <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1">
                            <FiCoffee className="h-3 w-3" />
                            Break Times (Avoided) ({scheduleMetrics?.breaks?.length || 0})
                          </span>
                          <div className="space-y-1">
                            {scheduleMetrics?.breaks?.length === 0 ? (
                              <span className="text-muted italic">No rest breaks configured</span>
                            ) : (
                              scheduleMetrics?.breaks?.map((b, idx) => (
                                <div key={idx} className="flex items-center justify-between font-mono font-semibold text-amber-700 dark:text-amber-300">
                                  <span>Break {idx + 1}</span>
                                  <span>{b.startTime || b.start} — {b.endTime || b.end}</span>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Weekly Roster Pills */}
                      <div className="space-y-1.5 pt-1">
                        <span className="text-[11px] uppercase tracking-wider font-semibold text-muted">
                          Scheduled Days of Week
                        </span>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {weekDayNames.map((d) => {
                            const isWorking = schedule.workingDays?.includes(d.num) || (d.num === 0 && schedule.workingDays?.includes(7));
                            return (
                              <span
                                key={d.num}
                                className={cn(
                                  "px-2.5 py-1 rounded-md text-[11px] font-bold border",
                                  isWorking
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
                                    : "bg-slate-100 text-slate-400 border-border dark:bg-slate-800/60 line-through opacity-60"
                                )}
                              >
                                {d.short}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Appointment Date Picker */}
              <div className="space-y-2">
                <Input
                  label="Appointment Date *"
                  type="date"
                  value={date}
                  onChange={(e) => {
                    setDate(e.target.value);
                    setError(null);
                    setResultData(null);
                  }}
                  required
                  leftIcon={<FiCalendar className="h-4 w-4 text-muted" />}
                  hint="Select the calendar date to generate time slots based on the doctor's active schedule."
                />

                {/* Date Status & Off-Day Banner */}
                {dayEvaluation && dayEvaluation.hasSchedule && (
                  <div>
                    {!dayEvaluation.isWorkingDay ? (
                      <div className="rounded-xl border border-rose-300 bg-rose-50/80 dark:border-rose-900/50 dark:bg-rose-950/30 p-3.5 space-y-2 text-xs text-rose-900 dark:text-rose-200 animate-fadeIn">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <FiAlertCircle className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0" />
                            <span>
                              <strong>Off Duty Day:</strong> {dayEvaluation.weekdayName} ({date}) is an off-day for Dr. {doctorName.replace(/^Dr\.\s*/i, "")}. Slot creation is disabled.
                            </span>
                          </div>
                          <Badge variant="danger" size="sm">
                            Doctor Off
                          </Badge>
                        </div>
                        <div className="pt-1 flex items-center justify-end">
                          <Button
                            type="button"
                            variant="secondary"
                            size="xs"
                            onClick={handleJumpToNextWorkingDay}
                            className="gap-1"
                          >
                            Jump to Next Working Day
                            <FiArrowRight className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-emerald-300/80 bg-emerald-50/60 dark:border-emerald-900/40 dark:bg-emerald-950/20 p-3 flex items-center justify-between text-xs text-emerald-900 dark:text-emerald-200">
                        <div className="flex items-center gap-2">
                          <FiCheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span>
                            <strong>On Duty:</strong> {dayEvaluation.weekdayName} is a scheduled work day (~{scheduleMetrics?.estimatedSlots || 0} slots available).
                          </span>
                        </div>
                        <Badge variant="success" size="sm">
                          Working Day
                        </Badge>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-between gap-3 pt-4 border-t border-border">
                <Button type="button" variant="outline" onClick={() => router.push("/slots")}>
                  Back to Slots
                </Button>

                <Button
                  type="submit"
                  variant="primary"
                  loading={generateMutation.isPending}
                  disabled={dayEvaluation?.hasSchedule && !dayEvaluation?.isWorkingDay}
                  className="gap-2"
                >
                  <FiClock className="h-4 w-4" />
                  Generate Slots
                </Button>
              </div>
            </form>
          </div>

          {/* Generated Slots Live Preview Card */}
          {resultData && (
            <div className="rounded-xl border border-emerald-500/40 bg-surface p-6 shadow-sm space-y-4 animate-scaleUp">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                    <FiCheck className="h-5 w-5 font-bold" />
                  </div>
                  <div>
                    <h4 className="font-display text-base font-bold text-text">
                      Slots Generated Successfully ({resultData.count})
                    </h4>
                    <p className="text-xs text-muted">
                      Created for Dr. {doctorName.replace(/^Dr\.\s*/i, "")} on {resultData.date}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Link href={`/appointments/new?doctorId=${doctorId}&date=${date}`}>
                    <Button variant="primary" size="xs" className="gap-1">
                      Book Appointment
                      <FiArrowRight className="h-3 w-3" />
                    </Button>
                  </Link>
                  <Link href={`/slots?doctorId=${doctorId}&date=${date}`}>
                    <Button variant="outline" size="xs">
                      View in Slot Table
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Slot Grid Chips */}
              <div className="space-y-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                  Bookable Time Windows (Break times avoided)
                </span>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 pt-1 max-h-72 overflow-y-auto p-1">
                  {resultData.slots.map((s, idx) => (
                    <div
                      key={s._id || idx}
                      className="rounded-lg border border-border bg-slate-50/70 dark:bg-slate-800/40 p-2 text-center text-xs font-mono font-semibold text-text shadow-sm"
                    >
                      <span className="block text-primary">{formatTimeUtc(s.startAt)}</span>
                      <span className="block text-[10px] text-muted opacity-80">to {formatTimeUtc(s.endAt)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </PageContainer>
    </PermissionGate>
  );
}
