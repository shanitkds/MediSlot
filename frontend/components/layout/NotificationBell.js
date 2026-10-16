"use client";

import React, { useState } from "react";
import { FiBell, FiCheck, FiInfo, FiCalendar, FiClock } from "react-icons/fi";
import { Dropdown } from "@/components/ui/Dropdown";
import { useToast } from "@/contexts/ToastProvider";
import { cn } from "@/lib/utils";

const initialNotifications = [
  {
    id: "notif-1",
    title: "Slot Schedule Generated",
    message: "Morning and afternoon clinical slots generated for tomorrow.",
    time: "10 mins ago",
    unread: true,
    icon: <FiCalendar className="text-primary" />,
  },
  {
    id: "notif-2",
    title: "New Patient Registered",
    message: "Patient John Doe was registered by reception.",
    time: "45 mins ago",
    unread: true,
    icon: <FiInfo className="text-emerald-500" />,
  },
  {
    id: "notif-3",
    title: "Shift Schedule Reminder",
    message: "Cardiology department schedule starts at 09:00 AM.",
    time: "2 hours ago",
    unread: false,
    icon: <FiClock className="text-amber-500" />,
  },
];

export function NotificationBell({ className }) {
  const [notifications, setNotifications] = useState(initialNotifications);
  const toast = useToast();

  const unreadCount = notifications.filter((n) => n.unread).length;

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
    toast.success("All notifications marked as read");
  };

  const handleNotificationClick = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, unread: false } : n))
    );
  };

  return (
    <Dropdown
      align="right"
      className={className}
      menuClassName="w-80 sm:w-96 p-0 shadow-xl"
      trigger={
        <button
          type="button"
          aria-label="View notifications"
          className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface text-muted hover:bg-slate-100 hover:text-text dark:hover:bg-slate-800 transition-colors shadow-sm cursor-pointer"
        >
          <FiBell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-danger text-[10px] font-bold text-white ring-2 ring-surface animate-pulse">
              {unreadCount}
            </span>
          )}
        </button>
      }
    >
      <div className="flex items-center justify-between border-b border-border/80 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="font-display text-sm font-semibold text-text">Notifications</span>
          {unreadCount > 0 && (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
              {unreadCount} new
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={markAllRead}
            className="flex items-center gap-1 text-xs text-primary hover:underline font-medium cursor-pointer"
          >
            <FiCheck className="h-3 w-3" />
            <span>Mark all read</span>
          </button>
        )}
      </div>

      <div className="max-h-72 divide-y divide-border/60 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="py-8 text-center text-xs text-muted">No notifications</div>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => handleNotificationClick(notif.id)}
              className={cn(
                "flex items-start gap-3 p-3.5 transition-colors cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60",
                notif.unread && "bg-primary/[0.03] dark:bg-primary/[0.06]"
              )}
            >
              <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                {notif.icon}
              </div>
              <div className="flex-1 space-y-0.5">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-text">{notif.title}</p>
                  <span className="text-[10px] text-muted">{notif.time}</span>
                </div>
                <p className="text-xs text-muted line-clamp-2 leading-relaxed">{notif.message}</p>
              </div>
              {notif.unread && (
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
              )}
            </div>
          ))
        )}
      </div>
    </Dropdown>
  );
}
