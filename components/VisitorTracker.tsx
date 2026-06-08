"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function VisitorTracker() {
  const pathname = usePathname();

  useEffect(() => {
    // Skip admin/dashboard pages — no need to track internal views
    if (pathname.startsWith("/dashboard") || pathname.startsWith("/admin")) return;

    fetch("/api/visitors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        page: pathname,
        referrer: document.referrer || "",
      }),
    }).catch(() => {});
  }, [pathname]);

  return null;
}
