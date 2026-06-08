"use client";

import { useEffect, useState } from "react";
import { Globe, Monitor, Smartphone, RefreshCw, Users, TrendingUp, Trash2, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Visitor {
  id: string;
  ip: string | null;
  userAgent: string | null;
  page: string;
  referrer: string | null;
  createdAt: string;
}

function parseDevice(ua: string | null): { browser: string; device: string } {
  if (!ua) return { browser: "Unknown", device: "Unknown" };
  const isMobile = /Mobile|Android|iPhone|iPad/.test(ua);
  const device = isMobile ? "Mobile" : "Desktop";
  let browser = "Other";
  if (ua.includes("Chrome") && !ua.includes("Edg")) browser = "Chrome";
  else if (ua.includes("Firefox")) browser = "Firefox";
  else if (ua.includes("Safari") && !ua.includes("Chrome")) browser = "Safari";
  else if (ua.includes("Edg")) browser = "Edge";
  return { browser, device };
}

function timeAgo(dateStr: string): string {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function VisitorsTable() {
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [clearingAll, setClearingAll] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/visitors");
      const data = await res.json();
      if (data.success) setVisitors(data.visitors || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const deleteOne = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch("/api/visitors", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (data.success) setVisitors((prev) => prev.filter((v) => v.id !== id));
    } finally {
      setDeletingId(null);
    }
  };

  const clearAll = async () => {
    if (!confirm(`Delete all ${visitors.length} visitor records? This cannot be undone.`)) return;
    setClearingAll(true);
    try {
      const res = await fetch("/api/visitors", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      });
      const data = await res.json();
      if (data.success) setVisitors([]);
    } finally {
      setClearingAll(false);
    }
  };

  const uniqueIPs = new Set(visitors.map((v) => v.ip)).size;
  const todayVisits = visitors.filter(
    (v) => new Date(v.createdAt).toDateString() === new Date().toDateString()
  ).length;

  if (loading) {
    return (
      <div className="rounded-lg border px-6 py-10 text-center text-sm text-gray-600">
        <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-[#023E4A] border-t-transparent" />
        Loading visitors…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-[#023E4A] text-white rounded-xl p-5 flex items-center gap-4">
          <Users className="w-8 h-8 opacity-80" />
          <div>
            <p className="text-2xl font-bold">{visitors.length}</p>
            <p className="text-sm opacity-80">Total Visits</p>
          </div>
        </div>
        <div className="bg-[#D4A017] text-[#023E4A] rounded-xl p-5 flex items-center gap-4">
          <Globe className="w-8 h-8 opacity-80" />
          <div>
            <p className="text-2xl font-bold">{uniqueIPs}</p>
            <p className="text-sm opacity-70">Unique Visitors</p>
          </div>
        </div>
        <div className="bg-cyan-50 border border-cyan-200 rounded-xl p-5 flex items-center gap-4">
          <TrendingUp className="w-8 h-8 text-[#023E4A]" />
          <div>
            <p className="text-2xl font-bold text-[#023E4A]">{todayVisits}</p>
            <p className="text-sm text-gray-600">Visits Today</p>
          </div>
        </div>
      </div>

      {/* Table header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-800">Recent Visitors</h3>
        <div className="flex items-center gap-2">
          {visitors.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearAll}
              disabled={clearingAll}
              className="flex items-center gap-2 border-red-300 text-red-600 hover:bg-red-600 hover:text-white"
            >
              <Trash className="w-4 h-4" />
              {clearingAll ? "Clearing…" : "Clear All"}
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={load}
            className="flex items-center gap-2 border-[#023E4A] text-[#023E4A] hover:bg-[#023E4A] hover:text-white"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>
      </div>

      {visitors.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center text-gray-500">
          No visitors recorded yet. They will appear here as customers browse the site.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-[#023E4A] text-white">
              <tr>
                <th className="px-4 py-3 text-left font-medium">#</th>
                <th className="px-4 py-3 text-left font-medium">IP Address</th>
                <th className="px-4 py-3 text-left font-medium">Page Visited</th>
                <th className="px-4 py-3 text-left font-medium">Device</th>
                <th className="px-4 py-3 text-left font-medium">Browser</th>
                <th className="px-4 py-3 text-left font-medium">Referrer</th>
                <th className="px-4 py-3 text-left font-medium">Time</th>
                <th className="px-4 py-3 text-left font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {visitors.map((v, i) => {
                const { browser, device } = parseDevice(v.userAgent);
                return (
                  <tr key={v.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-400">{i + 1}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-700">
                      {v.ip || "—"}
                    </td>
                    <td className="px-4 py-3 text-[#023E4A] font-medium max-w-[160px] truncate">
                      {v.page}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 text-gray-600">
                        {device === "Mobile" ? (
                          <Smartphone className="w-3.5 h-3.5" />
                        ) : (
                          <Monitor className="w-3.5 h-3.5" />
                        )}
                        {device}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{browser}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs max-w-[120px] truncate">
                      {v.referrer || "Direct"}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                      {timeAgo(v.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => deleteOne(v.id)}
                        disabled={deletingId === v.id}
                        className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 hover:text-red-700 transition-colors disabled:opacity-40"
                        title="Delete this visitor record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
