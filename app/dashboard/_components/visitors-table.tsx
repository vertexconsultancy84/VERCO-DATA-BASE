"use client";

import { useEffect, useState, useMemo } from "react";
import { Globe, Monitor, RefreshCw, Users, TrendingUp, Trash, BarChart3, Clock, FileText, PieChart as PieIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell,
  PieChart, Pie, Legend,
} from "recharts";

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

const BROWSER_COLORS = ["#0097A7", "#D4A017", "#06B6D4", "#1e3a5f", "#94a3b8"];
const DEVICE_COLORS = ["#023E4A", "#0097A7"];

function ChartCard({
  title, icon: Icon, children, className = "",
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-2xl border border-gray-200 bg-white p-5 shadow-sm ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <span className="w-8 h-8 rounded-lg bg-cyan-50 flex items-center justify-center text-[#023E4A] shrink-0">
          <Icon className="w-4 h-4" />
        </span>
        <h4 className="font-semibold text-gray-800 text-sm">{title}</h4>
      </div>
      {children}
    </div>
  );
}

export default function VisitorsTable() {
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [loading, setLoading] = useState(true);
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

  // ── Analytics datasets (computed once per visitors change) ──────────
  const dailyData = useMemo(() => {
    const map = new Map<string, number>();
    visitors.forEach((v) => {
      const key = new Date(v.createdAt).toISOString().split("T")[0];
      map.set(key, (map.get(key) ?? 0) + 1);
    });
    const out: { date: string; visits: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split("T")[0];
      out.push({
        date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        visits: map.get(key) ?? 0,
      });
    }
    return out;
  }, [visitors]);

  const hourlyData = useMemo(() => {
    const buckets = Array.from({ length: 24 }, (_, h) => ({ hour: String(h), visits: 0 }));
    visitors.forEach((v) => {
      const h = new Date(v.createdAt).getHours();
      buckets[h].visits += 1;
    });
    return buckets;
  }, [visitors]);

  const deviceData = useMemo(() => {
    let mobile = 0, desktop = 0;
    visitors.forEach((v) => {
      parseDevice(v.userAgent).device === "Mobile" ? mobile++ : desktop++;
    });
    return [
      { name: "Desktop", value: desktop },
      { name: "Mobile", value: mobile },
    ].filter((d) => d.value > 0);
  }, [visitors]);

  const browserData = useMemo(() => {
    const m = new Map<string, number>();
    visitors.forEach((v) => {
      const b = parseDevice(v.userAgent).browser;
      m.set(b, (m.get(b) ?? 0) + 1);
    });
    return Array.from(m, ([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [visitors]);

  const pageData = useMemo(() => {
    const m = new Map<string, number>();
    visitors.forEach((v) => {
      const p = v.page || "/";
      m.set(p, (m.get(p) ?? 0) + 1);
    });
    return Array.from(m, ([page, visits]) => ({
      page,
      label: page.length > 24 ? page.slice(0, 23) + "…" : page,
      visits,
    }))
      .sort((a, b) => b.visits - a.visits)
      .slice(0, 6);
  }, [visitors]);

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
      {/* Header / controls */}
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-semibold text-gray-800">Visitor Analytics</h3>
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

      {/* ── Analytics ──────────────────────────────────────────── */}
      {visitors.length > 0 && (
        <div className="space-y-4">
          {/* Daily visits — bar chart */}
          <ChartCard title="Visits — Last 14 Days" icon={BarChart3}>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={dailyData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef2f5" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#94a3b8" interval={0} angle={-30} textAnchor="end" height={50} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <Tooltip cursor={{ fill: "#0097A710" }} contentStyle={{ borderRadius: 12, border: "1px solid #e5e7eb", fontSize: 12 }} />
                <Bar dataKey="visits" fill="#0097A7" radius={[4, 4, 0, 0]} maxBarSize={42} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Hourly distribution — histogram */}
            <ChartCard title="Visits by Hour of Day" icon={Clock} className="lg:col-span-2">
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={hourlyData} barCategoryGap={1} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef2f5" />
                  <XAxis dataKey="hour" tick={{ fontSize: 10 }} stroke="#94a3b8" interval={1} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="#94a3b8" />
                  <Tooltip
                    cursor={{ fill: "#023E4A10" }}
                    contentStyle={{ borderRadius: 12, border: "1px solid #e5e7eb", fontSize: 12 }}
                    labelFormatter={(h) => `${h}:00 – ${h}:59`}
                  />
                  <Bar dataKey="visits" fill="#023E4A" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* Device split — donut (circle) */}
            <ChartCard title="Device Breakdown" icon={Monitor}>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={deviceData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    stroke="none"
                  >
                    {deviceData.map((_, i) => (
                      <Cell key={i} fill={DEVICE_COLORS[i % DEVICE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e5e7eb", fontSize: 12 }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Top pages — horizontal bar */}
            <ChartCard title="Top Pages" icon={FileText} className="lg:col-span-2">
              <ResponsiveContainer width="100%" height={Math.max(180, pageData.length * 38)}>
                <BarChart data={pageData} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#eef2f5" />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} stroke="#94a3b8" />
                  <YAxis type="category" dataKey="label" tick={{ fontSize: 11 }} stroke="#94a3b8" width={150} />
                  <Tooltip cursor={{ fill: "#0097A710" }} contentStyle={{ borderRadius: 12, border: "1px solid #e5e7eb", fontSize: 12 }} />
                  <Bar dataKey="visits" fill="#06B6D4" radius={[0, 4, 4, 0]} maxBarSize={26} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* Browser split — donut (circle) */}
            <ChartCard title="Browser Share" icon={PieIcon}>
              <ResponsiveContainer width="100%" height={Math.max(180, pageData.length * 38)}>
                <PieChart>
                  <Pie
                    data={browserData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    stroke="none"
                  >
                    {browserData.map((_, i) => (
                      <Cell key={i} fill={BROWSER_COLORS[i % BROWSER_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e5e7eb", fontSize: 12 }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        </div>
      )}

      {visitors.length === 0 && (
        <div className="rounded-lg border border-dashed p-10 text-center text-gray-500">
          No visitors recorded yet. Analytics will appear here as customers browse the site.
        </div>
      )}
    </div>
  );
}
