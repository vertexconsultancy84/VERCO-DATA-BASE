"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Bell, Check, Trash2, X } from "lucide-react";
import { getUserSession } from "@/app/actions/auth";
import {
  getMyNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  type NotificationItem,
} from "@/app/actions/notification";

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

export default function NotificationBell() {
  const [isUser, setIsUser] = useState(false);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const panelRef = useRef<HTMLDivElement>(null);

  const unread = items.filter((n) => !n.read).length;

  const refresh = useCallback(async () => {
    const list = await getMyNotifications();
    setItems(list);
  }, []);

  // Only show the bell to logged-in users; poll periodically for new messages.
  useEffect(() => {
    let active = true;
    let interval: ReturnType<typeof setInterval> | undefined;
    (async () => {
      const user = await getUserSession();
      if (!active) return;
      if (user) {
        setIsUser(true);
        await refresh();
        interval = setInterval(refresh, 60000);
      }
    })();
    return () => {
      active = false;
      if (interval) clearInterval(interval);
    };
  }, [refresh]);

  // Close the dropdown when clicking outside it.
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const handleOpen = async () => {
    const next = !open;
    setOpen(next);
    if (next) await refresh();
  };

  const handleMarkRead = async (id: string) => {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    await markNotificationRead(id);
  };

  const handleMarkAll = async () => {
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    await markAllNotificationsRead();
  };

  const handleDelete = async (id: string) => {
    setItems((prev) => prev.filter((n) => n.id !== id));
    await deleteNotification(id);
  };

  if (!isUser) return null;

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={handleOpen}
        className="relative p-2 rounded-full hover:bg-white/10 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5 text-white" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 max-h-[28rem] bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-50 flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 bg-[#023E4A] text-white">
            <span className="font-semibold text-sm">Notifications</span>
            <div className="flex items-center gap-2">
              {unread > 0 && (
                <button
                  onClick={handleMarkAll}
                  className="text-[11px] text-cyan-200 hover:text-white transition-colors"
                >
                  Mark all read
                </button>
              )}
              <button onClick={() => setOpen(false)} aria-label="Close">
                <X className="w-4 h-4 text-white/80 hover:text-white" />
              </button>
            </div>
          </div>

          <div className="overflow-y-auto">
            {items.length === 0 ? (
              <div className="py-10 text-center text-sm text-gray-400">
                <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                No messages yet
              </div>
            ) : (
              items.map((n) => (
                <div
                  key={n.id}
                  className={`group px-4 py-3 border-b border-gray-100 last:border-0 ${
                    n.read ? "bg-white" : "bg-cyan-50/60"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      {n.title && (
                        <p className="font-semibold text-sm text-gray-900 truncate">{n.title}</p>
                      )}
                      <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">
                        {n.message}
                      </p>
                      <p className="text-[11px] text-gray-400 mt-1">{timeAgo(n.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!n.read && (
                        <button
                          onClick={() => handleMarkRead(n.id)}
                          title="Mark as read"
                          className="p-1 text-gray-400 hover:text-green-600"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(n.id)}
                        title="Delete"
                        className="p-1 text-gray-400 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
