import { Suspense } from "react";
import { GenerateSlotsView } from "@/components/slots";

export default function GenerateSlotsPage() {
  return (
    <Suspense fallback={<div className="p-6 text-xs text-muted">Loading Slot Generator...</div>}>
      <GenerateSlotsView />
    </Suspense>
  );
}
