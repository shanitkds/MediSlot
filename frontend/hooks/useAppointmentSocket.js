"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getSocket, connectSocket } from "@/lib/socket";
import { useAuth } from "@/contexts/AuthProvider";
import { appointmentKeys } from "@/hooks/queries/useAppointmentQuery";
import { dashboardKeys } from "@/hooks/queries/useDashboardQuery";
import { slotKeys } from "@/hooks/queries/useSlotQuery";

export const APPOINTMENT_SOCKET_EVENTS = [
  "appointment:created",
  "appointment:updated",
  "appointment:cancelled",
  "appointment:arrived",
  "appointment:completed",
];

/**
 * Reusable hook that connects to Socket.IO and listens for real-time appointment events.
 * Automatically invalidates and refreshes relevant TanStack Query data (appointments, dashboard, slots)
 * and strictly prevents duplicate connections and event listeners.
 */
export function useAppointmentSocket({ onEvent, enabled = true } = {}) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  useEffect(() => {
    if (!enabled || !user) return;

    const socket = getSocket();
    connectSocket();

    const handleEvent = (eventName) => (payload) => {
      // Invalidate relevant TanStack Query data
      queryClient.invalidateQueries({ queryKey: appointmentKeys.all });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
      queryClient.invalidateQueries({ queryKey: slotKeys.all });

      if (onEventRef.current) {
        onEventRef.current(eventName, payload);
      }
    };

    const listeners = APPOINTMENT_SOCKET_EVENTS.map((eventName) => {
      const handler = handleEvent(eventName);
      socket.on(eventName, handler);
      return { eventName, handler };
    });

    return () => {
      // Clean up event listeners to strictly prevent duplicate listeners
      listeners.forEach(({ eventName, handler }) => {
        socket.off(eventName, handler);
      });
    };
  }, [enabled, user, queryClient]);
}
