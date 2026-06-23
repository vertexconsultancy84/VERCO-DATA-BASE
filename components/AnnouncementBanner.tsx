"use client";

import { useState, useEffect } from "react";
import { Megaphone, X } from "lucide-react";
import { getActiveAnnouncements, type AnnouncementItem } from "@/app/actions/announcement";

const DISMISS_KEY = "dismissed_announcements";

export default function AnnouncementBanner() {
  const [items, setItems] = useState<AnnouncementItem[]>([]);

  useEffect(() => {
    let active = true;
    getActiveAnnouncements().then((list) => {
      if (!active) return;
      let dismissed: string[] = [];
      try {
        dismissed = JSON.parse(localStorage.getItem(DISMISS_KEY) || "[]");
      } catch {
        dismissed = [];
      }
      setItems(list.filter((a) => !dismissed.includes(a.id)));
    });
    return () => {
      active = false;
    };
  }, []);

  const dismiss = (id: string) => {
    setItems((prev) => prev.filter((a) => a.id !== id));
    try {
      const dismissed: string[] = JSON.parse(localStorage.getItem(DISMISS_KEY) || "[]");
      localStorage.setItem(DISMISS_KEY, JSON.stringify([...dismissed, id]));
    } catch {
      /* ignore storage errors */
    }
  };

  if (items.length === 0) return null;

  return (
    <div className="fixed top-0 inset-x-0 z-[60]">
      {items.map((a) => (
        <div
          key={a.id}
          className="bg-[#D4A017] text-[#023E4A] border-b border-[#023E4A]/20"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center gap-3">
            <Megaphone className="w-4 h-4 shrink-0" />
            <p className="text-sm font-medium flex-1 text-center sm:text-left">{a.message}</p>
            <button
              onClick={() => dismiss(a.id)}
              aria-label="Dismiss"
              className="shrink-0 p-1 rounded-full hover:bg-black/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
