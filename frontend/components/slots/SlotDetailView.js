"use client";

import React, { use, useState } from "react";
import { useRouter } from "next/navigation";
import { PermissionGate } from "@/components/permissions/PermissionGate";
import { PERMISSIONS } from "@/constants/permissions";
import { PageContainer } from "@/components/common/PageContainer";
import { PageHeader } from "@/components/common/PageHeader";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { LoadingState } from "@/components/common/LoadingState";
import { ErrorState } from "@/components/common/ErrorState";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { useSlot, useUpdateSlot } from "@/hooks/queries/useSlotQuery";
import { useToast } from "@/contexts/ToastProvider";
import { formatDate } from "@/lib/utils";
import { FiClock, FiCheckCircle } from "react-icons/fi";

export function SlotDetailView({ params }) {
  const unwrappedParams = use(params);
  const id = unwrappedParams.id;
  const router = useRouter();
  const toast = useToast();

  const { data: slotData, isLoading, error, refetch } = useSlot(id);
  const slot = slotData?.data?.slot || slotData?.data || null;

  const updateMutation = useUpdateSlot();
  const [newStatus, setNewStatus] = useState("");

  const handleUpdateStatus = async () => {
    if (!newStatus) return;
    try {
      await updateMutation.mutateAsync({ id, status: newStatus });
      toast.success(`Slot status updated to ${newStatus}.`);
      refetch();
    } catch (err) {
      toast.error(err?.message || "Failed to update slot status.");
    }
  };

  const start = slot?.startAt ? formatDate(slot.startAt, { time: true }) : slot?.startTime || "—";
  const end = slot?.endAt ? formatDate(slot.endAt, { time: true }) : slot?.endTime || "—";
  const doctorName = slot?.doctor?.user?.name || slot?.doctor?.name || "Doctor";

  return (
    <PermissionGate
      roles={["super_admin", "admin", "doctor", "receptionist"]}
      permission={PERMISSIONS.SLOTS_VIEW}
    >
      <PageContainer maxWidth="compact" className="space-y-6">
        <Breadcrumbs />

        <PageHeader
          title="Consultation Slot Details"
          description={`Time window: ${start} – ${end}`}
        />

        {isLoading ? (
          <LoadingState message="Loading slot details..." fullPage={false} />
        ) : error ? (
          <ErrorState error={error} onRetry={refetch} />
        ) : slot ? (
          <div className="rounded-xl border border-border bg-surface p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-border/80 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <FiClock className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-display text-base font-bold text-text">
                    {start} – {end}
                  </h2>
                  <p className="text-xs text-muted">Dr. {doctorName}</p>
                </div>
              </div>
              <Badge variant={slot.status === "available" ? "success" : "secondary"} size="md">
                {slot.status}
              </Badge>
            </div>

            <div className="space-y-3 pt-2">
              <Select
                label="Update Slot Status"
                value={newStatus || slot.status}
                onChange={(e) => setNewStatus(e.target.value)}
              >
                <option value="available">Available (Open for booking)</option>
                <option value="booked">Booked (Reserved)</option>
              </Select>

              <div className="flex items-center justify-end gap-3 pt-3">
                <Button variant="outline" size="sm" onClick={() => router.push("/slots")}>
                  Back to Calendar
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  loading={updateMutation.isPending}
                  onClick={handleUpdateStatus}
                >
                  Save Status
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-12 text-center text-muted">Slot not found.</div>
        )}
      </PageContainer>
    </PermissionGate>
  );
}
