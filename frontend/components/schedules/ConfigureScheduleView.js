"use client";

import React, { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PermissionGate } from "@/components/permissions/PermissionGate";
import { PERMISSIONS } from "@/constants/permissions";
import { PageContainer } from "@/components/common/PageContainer";
import { PageHeader } from "@/components/common/PageHeader";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { DoctorSelect } from "@/components/medical/DoctorSelect";
import { WorkingDaysSelector } from "@/components/medical/WorkingDaysSelector";
import { SessionTimePicker } from "@/components/medical/SessionTimePicker";
import { BreakTimeEditor } from "@/components/medical/BreakTimeEditor";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import {
  useDoctorSchedule,
  useConfigureDoctorSchedule,
  useUpdateDoctorScheduleByDoctor,
} from "@/hooks/queries/useDoctorScheduleQuery";
import { useDoctor } from "@/hooks/queries/useDoctorQuery";
import { useToast } from "@/contexts/ToastProvider";
import { FiSave } from "react-icons/fi";

const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;
const timeRegex = TIME_REGEX;

function timeToMinutes(timeStr) {
  if (!timeStr || typeof timeStr !== "string") return 0;
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours * 60 + minutes;
}

export function ConfigureScheduleView({ params }) {
  const router = useRouter();
  const toast = useToast();

  const unwrappedParams = params ? use(params) : null;
  const paramDoctorId = unwrappedParams?.doctorId;

  const [doctorId, setDoctorId] = useState(paramDoctorId || "");
  const [workingDays, setWorkingDays] = useState([1, 2, 3, 4, 5]);
  const [sessions, setSessions] = useState([
    { startTime: "09:00", endTime: "17:00" },
  ]);
  const [breaks, setBreaks] = useState([{ startTime: "13:00", endTime: "14:00" }]);
  const [slotDurationMinutes, setSlotDurationMinutes] = useState(15);
  const [error, setError] = useState(null);

  const { data: docData } = useDoctor(doctorId, { enabled: Boolean(doctorId) });
  const doctor = docData?.data?.doctor || docData?.data || null;

  const { data: schedData } = useDoctorSchedule(doctorId, { enabled: Boolean(doctorId) });
  const existingSchedule = schedData?.data?.schedule || schedData?.data || null;

  useEffect(() => {
    if (existingSchedule) {
      if (Array.isArray(existingSchedule.workingDays)) {
        setWorkingDays(existingSchedule.workingDays);
      }
      if (Array.isArray(existingSchedule.sessions) && existingSchedule.sessions.length) {
        setSessions(
          existingSchedule.sessions.map((sess) => ({
            startTime: sess.startTime || sess.start || "09:00",
            endTime: sess.endTime || sess.end || "17:00",
          }))
        );
      }
      if (Array.isArray(existingSchedule.breaks)) {
        setBreaks(
          existingSchedule.breaks.map((brk) => ({
            startTime: brk.startTime || brk.start || "13:00",
            endTime: brk.endTime || brk.end || "14:00",
          }))
        );
      }
      if (existingSchedule.slotDurationMinutes) {
        setSlotDurationMinutes(existingSchedule.slotDurationMinutes);
      }
    }
  }, [existingSchedule]);

  const createMutation = useConfigureDoctorSchedule();
  const updateMutation = useUpdateDoctorScheduleByDoctor();

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const scheduleMetrics = React.useMemo(() => {
    let grossMinutes = 0;
    (sessions || []).forEach((s) => {
      const start = (s.startTime || s.start || "").trim();
      const end = (s.endTime || s.end || "").trim();
      if (timeRegex.test(start) && timeRegex.test(end)) {
        let sm = timeToMinutes(start);
        let em = timeToMinutes(end);
        if (em <= sm) {
          const [eh, emm] = end.split(":").map(Number);
          if (eh < 12 && (eh + 12) * 60 + emm > sm) {
            em = (eh + 12) * 60 + emm;
          }
        }
        if (em > sm) {
          grossMinutes += em - sm;
        }
      }
    });

    let breakMinutes = 0;
    (breaks || []).forEach((b) => {
      const start = (b.startTime || b.start || "").trim();
      const end = (b.endTime || b.end || "").trim();
      if (timeRegex.test(start) && timeRegex.test(end)) {
        let bmStart = timeToMinutes(start);
        let bmEnd = timeToMinutes(end);
        if (bmEnd <= bmStart) {
          const [bh, bmm] = end.split(":").map(Number);
          if (bh < 12 && (bh + 12) * 60 + bmm > bmStart) {
            bmEnd = (bh + 12) * 60 + bmm;
          }
        }
        if (bmEnd > bmStart) {
          breakMinutes += bmEnd - bmStart;
        }
      }
    });

    const netMinutes = Math.max(0, grossMinutes - breakMinutes);
    const duration = Math.max(5, Number(slotDurationMinutes) || 15);
    const estimatedSlots = Math.floor(netMinutes / duration);

    const formatMins = (mins) => {
      const h = Math.floor(mins / 60);
      const m = mins % 60;
      if (h === 0) return `${m}m`;
      if (m === 0) return `${h}h`;
      return `${h}h ${m}m`;
    };

    return {
      grossMinutes,
      grossFormatted: formatMins(grossMinutes),
      breakMinutes,
      breakFormatted: formatMins(breakMinutes),
      netMinutes,
      netFormatted: formatMins(netMinutes),
      duration,
      estimatedSlots,
    };
  }, [sessions, breaks, slotDurationMinutes]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!doctorId) {
      setError("Please select a doctor to configure their schedule.");
      return;
    }

    if (!workingDays.length) {
      setError("Please select at least one working day.");
      return;
    }

    if (!Array.isArray(sessions) || sessions.length === 0) {
      setError("At least one consultation session is required.");
      return;
    }

    // Validate sessions format and chronological order
    const cleanedSessions = sessions.map((s) => ({
      startTime: (s.startTime || s.start || "").trim(),
      endTime: (s.endTime || s.end || "").trim(),
    }));

    // Auto-correct PM if user typed e.g. 05:00 instead of 17:00 when shift start is 09:00
    cleanedSessions.forEach((s) => {
      if (timeRegex.test(s.startTime) && timeRegex.test(s.endTime)) {
        const sm = timeToMinutes(s.startTime);
        const em = timeToMinutes(s.endTime);
        if (em <= sm) {
          const [eh, emm] = s.endTime.split(":").map(Number);
          if (eh < 12 && (eh + 12) * 60 + emm > sm) {
            s.endTime = `${String(eh + 12).padStart(2, "0")}:${String(emm).padStart(2, "0")}`;
          }
        }
      }
    });

    for (let i = 0; i < cleanedSessions.length; i++) {
      const s = cleanedSessions[i];
      if (!timeRegex.test(s.startTime)) {
        setError(`Session ${i + 1} has an invalid start time format (HH:mm required, e.g. 09:00).`);
        return;
      }
      if (!timeRegex.test(s.endTime)) {
        setError(`Session ${i + 1} has an invalid end time format (HH:mm required, e.g. 17:00).`);
        return;
      }

      const startMin = timeToMinutes(s.startTime);
      const endMin = timeToMinutes(s.endTime);

      if (startMin >= endMin) {
        setError(`Session ${i + 1} start time (${s.startTime}) must be earlier than end time (${s.endTime}).`);
        return;
      }
    }

    // Validate no overlapping sessions
    const sortedSessions = [...cleanedSessions].sort(
      (a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
    );
    for (let i = 1; i < sortedSessions.length; i++) {
      const prev = sortedSessions[i - 1];
      const curr = sortedSessions[i];
      if (timeToMinutes(curr.startTime) < timeToMinutes(prev.endTime)) {
        setError(
          `Overlapping sessions detected between ${prev.startTime}-${prev.endTime} and ${curr.startTime}-${curr.endTime}.`
        );
        return;
      }
    }

    // Validate breaks format, order, and overlap
    const cleanedBreaks = (breaks || []).map((b) => ({
      startTime: (b.startTime || b.start || "").trim(),
      endTime: (b.endTime || b.end || "").trim(),
    }));

    // Auto-correct PM on break if e.g. 01:00 to 02:00 was typed
    cleanedBreaks.forEach((b) => {
      if (timeRegex.test(b.startTime) && timeRegex.test(b.endTime)) {
        const sm = timeToMinutes(b.startTime);
        const em = timeToMinutes(b.endTime);
        if (em <= sm) {
          const [eh, emm] = b.endTime.split(":").map(Number);
          if (eh < 12 && (eh + 12) * 60 + emm > sm) {
            b.endTime = `${String(eh + 12).padStart(2, "0")}:${String(emm).padStart(2, "0")}`;
          }
        }
      }
    });

    for (let i = 0; i < cleanedBreaks.length; i++) {
      const b = cleanedBreaks[i];
      if (!timeRegex.test(b.startTime)) {
        setError(`Break ${i + 1} has an invalid start time format (HH:mm required, e.g. 13:00).`);
        return;
      }
      if (!timeRegex.test(b.endTime)) {
        setError(`Break ${i + 1} has an invalid end time format (HH:mm required, e.g. 14:00).`);
        return;
      }

      const startMin = timeToMinutes(b.startTime);
      const endMin = timeToMinutes(b.endTime);

      if (startMin >= endMin) {
        setError(`Break ${i + 1} start time (${b.startTime}) must be earlier than end time (${b.endTime}).`);
        return;
      }
    }

    const sortedBreaks = [...cleanedBreaks].sort(
      (a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
    );
    for (let i = 1; i < sortedBreaks.length; i++) {
      const prev = sortedBreaks[i - 1];
      const curr = sortedBreaks[i];
      if (timeToMinutes(curr.startTime) < timeToMinutes(prev.endTime)) {
        setError(
          `Overlapping breaks detected between ${prev.startTime}-${prev.endTime} and ${curr.startTime}-${curr.endTime}.`
        );
        return;
      }
    }

    // Sync state in case auto-corrections were applied
    setSessions(cleanedSessions);
    setBreaks(cleanedBreaks);

    try {
      const payload = {
        doctorId,
        workingDays,
        sessions: sortedSessions,
        breaks: sortedBreaks,
        slotDurationMinutes: Math.max(5, Math.min(240, Number(slotDurationMinutes) || 15)),
      };

      if (existingSchedule) {
        await updateMutation.mutateAsync({ doctorId, ...payload });
        toast.success("Schedule updated successfully.");
      } else {
        try {
          await createMutation.mutateAsync(payload);
          toast.success("Schedule configured successfully.");
        } catch (createErr) {
          // If schedule already exists (409 Conflict), seamlessly fallback to update
          if (
            createErr?.status === 409 ||
            createErr?.message?.toLowerCase().includes("already configured")
          ) {
            await updateMutation.mutateAsync({ doctorId, ...payload });
            toast.success("Existing schedule updated successfully.");
          } else {
            throw createErr;
          }
        }
      }

      if (paramDoctorId) {
        router.push(`/doctors/${paramDoctorId}/schedule`);
      } else {
        router.push("/schedules");
      }
    } catch (err) {
      const msg = err?.message || "Failed to save schedule. Please check the session times.";
      setError(msg);
      toast.error(msg);
    }
  };

  const doctorName = doctor?.userId?.name || doctor?.user?.name || doctor?.name || "Doctor";

  return (
    <PermissionGate
      roles={["super_admin", "admin"]}
      permission={PERMISSIONS.DOCTORSCHEDULE_UPDATE}
    >
      <PageContainer maxWidth="compact" className="space-y-6">
        <Breadcrumbs />

        <PageHeader
          title={paramDoctorId ? `Configure Schedule: Dr. ${doctorName}` : "Doctor Timetable Setup"}
          description="Establish doctor workdays, recurring shifts, rest breaks, and slot time units."
        />

        <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && <Alert variant="danger" title="Schedule Error" description={error} />}

            {/* Doctor Picker (if not fixed in path) */}
            {!paramDoctorId && (
              <DoctorSelect
                value={doctorId}
                onChange={(id) => setDoctorId(id)}
                required
              />
            )}

            {/* Working Days */}
            <WorkingDaysSelector
              value={workingDays}
              onChange={(days) => setWorkingDays(days)}
            />

            {/* Consultation Sessions */}
            <SessionTimePicker
              sessions={sessions}
              onChange={(newSessions) => setSessions(newSessions)}
            />

            {/* Break Times */}
            <BreakTimeEditor
              breaks={breaks}
              onChange={(newBreaks) => setBreaks(newBreaks)}
            />

            {/* Live Break-Deduction & Slot Calculation Summary */}
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                  Shift Schedule & Break Deduction Calculation
                </span>
                <span className="text-xs text-muted">
                  Auto-calculated from your shift and breaks
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="rounded-lg bg-surface border border-border p-2.5">
                  <span className="block text-[11px] font-medium text-muted">Gross Shift</span>
                  <span className="text-sm font-bold text-text">
                    {scheduleMetrics.grossFormatted}
                  </span>
                </div>

                <div className="rounded-lg bg-surface border border-amber-200 dark:border-amber-800/40 p-2.5">
                  <span className="block text-[11px] font-medium text-amber-600 dark:text-amber-400">
                    Deducted Breaks
                  </span>
                  <span className="text-sm font-bold text-amber-600 dark:text-amber-400">
                    -{scheduleMetrics.breakFormatted}
                  </span>
                </div>

                <div className="rounded-lg bg-surface border border-emerald-200 dark:border-emerald-800/40 p-2.5">
                  <span className="block text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                    Net Clinical Time
                  </span>
                  <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                    ={scheduleMetrics.netFormatted}
                  </span>
                </div>

                <div className="rounded-lg bg-primary/10 border border-primary/30 p-2.5">
                  <span className="block text-[11px] font-medium text-primary">
                    Bookable Slots
                  </span>
                  <span className="text-sm font-extrabold text-primary">
                    {scheduleMetrics.estimatedSlots} slots
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-muted">
                Entering your single work shift (e.g. 09:00 AM – 05:00 PM) automatically subtracts your configured break periods to generate {scheduleMetrics.estimatedSlots} available patient appointment slots ({scheduleMetrics.duration} mins each).
              </p>
            </div>

            {/* Slot Duration */}
            <Input
              label="Consultation Slot Duration (Minutes)"
              type="number"
              min="5"
              max="120"
              value={slotDurationMinutes ?? ""}
              onChange={(e) => setSlotDurationMinutes(e.target.value)}
              hint="Duration allocated per patient booking (e.g. 15, 20, 30 min)."
              required
            />

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
              <Button type="button" variant="outline" onClick={() => router.push("/schedules")}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" loading={isSubmitting} className="gap-2">
                <FiSave className="h-4 w-4" />
                {existingSchedule ? "Update Schedule" : "Save Schedule"}
              </Button>
            </div>
          </form>
        </div>
      </PageContainer>
    </PermissionGate>
  );
}
