"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Activity, AlertTriangle, Wallet,
  Search, Boxes, ImageIcon, CheckCircle2, EyeOff,
  ArrowRight, Settings, TrendingUp, TrendingDown, PackageCheck,
  Truck, Clock, PackageX, Snowflake,
} from "lucide-react";
import {
  getFinishedProductStockRecords,
  getStockMovements,
  publishFinishedProductToMarketplace,
  type FinishedProductStockRecord,
  type StockMovement,
} from "@/app/actions/industry";

const frw = (n: number) =>
  "RWF " + n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

interface InvItem {
  id: string;
  name: string;
  imageUrl?: string;
  initial: number;
  current: number;
  unit: string;
  threshold: number;
  reserved: number;
  unitCost: number;
  published?: boolean;
  low: boolean;
  // ── derived analytics (Tier 1) ──
  dailyRate: number;     // avg units sold per day (last 30d)
  daysOfCover: number;   // current / dailyRate (Infinity when no sales)
  reorderPoint: number;  // dailyRate × leadTime + safety stock
  suggestedQty: number;  // recommended reorder quantity
  needsReorder: boolean; // current at/below smart reorder point
  isStockout: boolean;   // out of stock while still published
  isDeadStock: boolean;  // on-hand but no sale in 90+ days
}

// rounding window for the sales-velocity calc
const VELOCITY_WINDOW_DAYS = 30;
const SAFETY_DAYS = 3;       // buffer added on top of lead-time demand
const DEAD_STOCK_DAYS = 90;  // no OUT movement for this long ⇒ dead stock
const DAY_MS = 86_400_000;

// ── Summary card ────────────────────────────────────────────────────────────
function StatCard({
  icon: Icon, label, value, sub, accent,
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
  sub: string;
  accent: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 flex items-start gap-3">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${accent}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">{label}</p>
        <p className="text-lg font-bold text-[#023E4A] leading-tight truncate">{value}</p>
        <p className="text-[11px] text-gray-400">{sub}</p>
      </div>
    </div>
  );
}

export default function StockInventoryDashboard({ productsSlot }: { productsSlot?: React.ReactNode } = {}) {
  const [finished, setFinished] = useState<FinishedProductStockRecord[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    Promise.all([
      getFinishedProductStockRecords(),
      getStockMovements(),
    ]).then(([f, m]) => {
      setFinished(f); setMovements(m); setLoading(false);
    });
  }, []);

  // publish / unpublish a finished product (optimistic)
  const [publishing, setPublishing] = useState<string | null>(null);
  const togglePublish = async (id: string, current: boolean) => {
    setPublishing(id);
    setFinished((prev) => prev.map((f) => (f.id === id ? { ...f, published: !current } : f)));
    const res = await publishFinishedProductToMarketplace(id, !current);
    // roll back the optimistic update if the server rejected it
    if (!res.success) {
      setFinished((prev) => prev.map((f) => (f.id === id ? { ...f, published: current } : f)));
    }
    setPublishing(null);
  };

  // total IN / OUT per record id, plus recent sales velocity and last-sale date
  const moveTotals = useMemo(() => {
    const map: Record<string, { in: number; out: number }> = {};
    for (const m of movements) {
      const e = map[m.recordId] ?? { in: 0, out: 0 };
      if (m.movement === "in") e.in += m.quantity; else e.out += m.quantity;
      map[m.recordId] = e;
    }
    return map;
  }, [movements]);

  // recent OUT velocity (units/day over the last 30d) + last OUT date per record
  const sales = useMemo(() => {
    const since = Date.now() - VELOCITY_WINDOW_DAYS * DAY_MS;
    const recentOut: Record<string, number> = {};
    const lastOut: Record<string, number> = {};
    for (const m of movements) {
      if (m.movement !== "out") continue;
      const t = +new Date(m.date);
      if (t >= since) recentOut[m.recordId] = (recentOut[m.recordId] ?? 0) + m.quantity;
      if (!lastOut[m.recordId] || t > lastOut[m.recordId]) lastOut[m.recordId] = t;
    }
    return { recentOut, lastOut };
  }, [movements]);

  // finished-products inventory list, enriched with velocity-based analytics
  const items = useMemo<InvItem[]>(() => {
    const now = Date.now();
    return finished.map((r) => {
      const base = r.currentStock != null ? r.currentStock : r.quantityProduced;
      const mv = moveTotals[r.id] ?? { in: 0, out: 0 };
      const current = base + mv.in - mv.out;
      const threshold = r.lowStockThreshold ?? 0;

      // velocity & forecasting
      const dailyRate = (sales.recentOut[r.id] ?? 0) / VELOCITY_WINDOW_DAYS;
      const daysOfCover = dailyRate > 0 ? current / dailyRate : Infinity;
      const leadTime = r.leadTimeDays ?? 0;
      const safetyStock = dailyRate * SAFETY_DAYS;
      const reorderPoint = dailyRate * leadTime + safetyStock;
      // cover lead time + one window of demand, minus what's already on hand
      const suggestedQty = Math.max(
        0,
        Math.ceil(dailyRate * (leadTime + VELOCITY_WINDOW_DAYS) - current)
      );

      // flags
      const low = current <= 0 || (threshold > 0 && current <= threshold);
      const needsReorder = dailyRate > 0 ? current <= reorderPoint : low;
      const isStockout = current <= 0 && !!r.published;
      const lastSale = sales.lastOut[r.id];
      const isDeadStock =
        current > 0 && (!lastSale || now - lastSale > DEAD_STOCK_DAYS * DAY_MS) && dailyRate === 0;

      return {
        id: r.id, name: r.productName, imageUrl: r.imageUrl,
        initial: r.quantityProduced, current, unit: r.unitOfMeasure ?? "Piece",
        threshold, reserved: r.reservedStock ?? 0, unitCost: r.costPerUnit,
        published: r.published, low,
        dailyRate, daysOfCover, reorderPoint, suggestedQty,
        needsReorder, isStockout, isDeadStock,
      };
    });
  }, [finished, moveTotals, sales]);

  // movements that belong to finished products only
  const finishedMovements = useMemo(() => {
    const ids = new Set(finished.map((f) => f.id));
    return movements.filter((m) => ids.has(m.recordId));
  }, [movements, finished]);

  // ── KPIs ──
  const reorderCount = items.filter((i) => i.needsReorder).length;
  const stockoutCount = items.filter((i) => i.isStockout).length;
  const deadStockItems = items.filter((i) => i.isDeadStock);
  const deadStockCount = deadStockItems.length;
  const deadStockValue = deadStockItems.reduce((s, i) => s + i.current * i.unitCost, 0);
  const totalUnits = items.reduce((s, i) => s + Math.max(0, i.current), 0);
  const totalIn = finishedMovements.filter((m) => m.movement === "in").reduce((s, m) => s + m.quantity, 0);
  const totalOut = finishedMovements.filter((m) => m.movement === "out").reduce((s, m) => s + m.quantity, 0);
  const incomingCount = finishedMovements.filter((m) => m.movement === "in").length;
  const outgoingCount = finishedMovements.filter((m) => m.movement === "out").length;
  const totalReserved = items.reduce((s, i) => s + i.reserved, 0);
  const stockValue = items.reduce((s, i) => s + Math.max(0, i.current) * i.unitCost, 0);
  const healthy = reorderCount === 0 && stockoutCount === 0;
  const publishedCount = finished.filter((f) => f.published).length;

  const filtered = items.filter((i) => {
    const q = query.trim().toLowerCase();
    return !q || i.name.toLowerCase().includes(q);
  });

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#0097A7] mx-auto mb-3" />
        <p className="text-gray-500 text-sm">Loading inventory…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Summary cards ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          icon={Activity}
          label="Overall Status"
          value={<span className={healthy ? "text-emerald-600" : "text-amber-600"}>{healthy ? "Healthy" : "Attention"}</span>}
          sub={`Current stock level (${totalUnits.toLocaleString()} units)`}
          accent={healthy ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}
        />
        <StatCard
          icon={AlertTriangle}
          label="Reorder Needed"
          value={reorderCount}
          sub={stockoutCount > 0 ? `${stockoutCount} out of stock now` : "Below smart reorder point"}
          accent={stockoutCount > 0 ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-600"}
        />
        <StatCard
          icon={Snowflake}
          label="Dead Stock"
          value={deadStockCount}
          sub={deadStockCount > 0 ? `${frw(deadStockValue)} frozen` : "No idle products"}
          accent="bg-cyan-50 text-cyan-600"
        />
        <StatCard
          icon={Truck}
          label="Incoming Stock"
          value={incomingCount}
          sub={`Stock IN (${totalIn.toLocaleString()} units)`}
          accent="bg-sky-50 text-sky-600"
        />
        <StatCard
          icon={PackageCheck}
          label="Outgoing Orders"
          value={outgoingCount}
          sub={`Reserved ${totalReserved.toLocaleString()} · ${totalOut.toLocaleString()} out`}
          accent="bg-indigo-50 text-indigo-600"
        />
        <StatCard
          icon={Wallet}
          label="Stock Value"
          value={frw(stockValue)}
          sub="Total inventory value"
          accent="bg-[#023E4A]/10 text-[#023E4A]"
        />
      </div>

      {/* ── Main grid: inventory table + sidebar ──────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Master inventory — caller may supply the full records table in place of
            the built-in simplified inventory list */}
        {productsSlot ? (
          <div className="lg:col-span-2 min-w-0">{productsSlot}</div>
        ) : (
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Boxes className="w-5 h-5 text-[#0097A7]" />
              <h3 className="font-bold text-[#023E4A]">Finished Products Inventory</h3>
            </div>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search…"
                className="pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0097A7]/40 w-40"
              />
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="p-12 text-center">
              <Boxes className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">
                {items.length === 0 ? "No finished product records yet." : "No products match your search."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse min-w-[640px]">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 border-b border-gray-200">
                    {["Product", "Initial", "Current Stock", "Days Left", "Unit", "Reorder At", "Reserved", "Status"].map((h) => (
                      <th key={h} className="px-4 py-2.5 text-left font-semibold whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((it) => (
                    <tr key={it.id} className="border-b border-gray-50 hover:bg-[#0097A7]/5 transition-colors">
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 shrink-0 rounded-lg overflow-hidden border border-gray-200 bg-gray-50 flex items-center justify-center">
                            {it.imageUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={it.imageUrl} alt={it.name} className="w-full h-full object-cover" />
                            ) : (
                              <ImageIcon className="w-4 h-4 text-gray-300" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-[#023E4A] truncate max-w-[180px]" title={it.name}>{it.name}</p>
                            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-teal-100 text-teal-700">
                              Finished
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-gray-500">{it.initial.toLocaleString()}</td>
                      <td className="px-4 py-2.5">
                        <span className={`font-bold ${it.isStockout || it.low ? "text-red-600" : "text-emerald-600"}`}>
                          {it.current.toLocaleString()}
                        </span>
                        {it.isStockout ? (
                          <span className="ml-1.5 inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 align-middle" title="Published but out of stock">
                            <PackageX className="w-3 h-3" /> Out
                          </span>
                        ) : it.isDeadStock ? (
                          <span className="ml-1.5 inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-cyan-100 text-cyan-700 align-middle" title="No sales in 90+ days">
                            <Snowflake className="w-3 h-3" /> Idle
                          </span>
                        ) : it.low ? (
                          <span className="ml-1.5 inline-block w-1.5 h-1.5 rounded-full bg-red-500 align-middle" title="Low stock" />
                        ) : null}
                      </td>
                      {/* Days of cover at current sales rate */}
                      <td className="px-4 py-2.5">
                        {it.daysOfCover === Infinity ? (
                          <span className="text-gray-400" title="No recent sales to estimate from">—</span>
                        ) : (
                          <span
                            className={`inline-flex items-center gap-1 font-semibold ${
                              it.needsReorder ? "text-red-600" : it.daysOfCover < 14 ? "text-amber-600" : "text-emerald-600"
                            }`}
                            title={`~${Math.round(it.dailyRate * 100) / 100} ${it.unit}/day`}
                          >
                            <Clock className="w-3.5 h-3.5" />
                            {Math.round(it.daysOfCover)}d
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{it.unit}</span>
                      </td>
                      {/* Smart reorder point + suggested quantity */}
                      <td className="px-4 py-2.5">
                        <span className="text-gray-500">
                          {it.reorderPoint > 0 ? Math.round(it.reorderPoint).toLocaleString() : (it.threshold > 0 ? Math.round(it.threshold).toLocaleString() : "—")}
                        </span>
                        {it.needsReorder && it.suggestedQty > 0 && (
                          <span className="ml-1.5 inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 align-middle" title="Suggested reorder quantity">
                            <Truck className="w-3 h-3" /> +{it.suggestedQty.toLocaleString()}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-gray-500">{it.reserved.toLocaleString()}</td>
                      <td className="px-4 py-2.5">
                        <button
                          onClick={() => togglePublish(it.id, !!it.published)}
                          disabled={publishing === it.id}
                          title={it.published ? "Click to unpublish" : "Click to publish"}
                          className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-colors disabled:opacity-50 ${
                            it.published
                              ? "bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100"
                              : "bg-[#D4A017]/10 border-[#D4A017]/40 text-[#a8800f] hover:bg-[#D4A017]/20"
                          }`}
                        >
                          {it.published ? <CheckCircle2 className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                          {publishing === it.id ? "Saving…" : it.published ? "Available" : "Publish"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
            <p className="text-xs text-gray-400">{filtered.length} of {items.length} products</p>
            <Link
              href="/industry/finished-products"
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#0097A7] hover:gap-2 transition-all"
            >
              <Settings className="w-3.5 h-3.5" /> Manage records <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
        )}

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Order fulfillment status */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <h3 className="font-bold text-[#023E4A] mb-4">Order Fulfillment Status</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Published (Available)
                </span>
                <span className="font-bold text-emerald-600">{publishedCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-2 text-sm text-gray-600">
                  <EyeOff className="w-4 h-4 text-gray-400" /> Draft (Not available)
                </span>
                <span className="font-bold text-gray-500">{finished.length - publishedCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-2 text-sm text-gray-600">
                  <PackageCheck className="w-4 h-4 text-indigo-500" /> Reserved units
                </span>
                <span className="font-bold text-indigo-600">{totalReserved.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-2 text-sm text-gray-600">
                  <PackageX className="w-4 h-4 text-red-500" /> Out of stock
                </span>
                <span className={`font-bold ${stockoutCount > 0 ? "text-red-600" : "text-gray-400"}`}>{stockoutCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-2 text-sm text-gray-600">
                  <AlertTriangle className="w-4 h-4 text-amber-500" /> Needs reorder
                </span>
                <span className={`font-bold ${reorderCount > 0 ? "text-amber-600" : "text-gray-400"}`}>{reorderCount}</span>
              </div>
            </div>
            <Link
              href="/industry/finished-products"
              className={`mt-4 w-full inline-flex items-center justify-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-lg transition-colors ${
                reorderCount > 0
                  ? "bg-[#D4A017] hover:bg-[#b8890f] text-white"
                  : "bg-gray-100 text-gray-400 cursor-default pointer-events-none"
              }`}
            >
              <Truck className="w-4 h-4" /> Restock{reorderCount > 0 ? ` (${reorderCount})` : ""}
            </Link>
          </div>

          {/* Stock movement snapshot */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <h3 className="font-bold text-[#023E4A] mb-4">Movement Snapshot</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-3 text-center">
                <TrendingDown className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
                <p className="text-base font-bold text-emerald-700">
                  {totalIn.toLocaleString()}
                </p>
                <p className="text-[10px] text-emerald-600 font-medium">Total IN</p>
              </div>
              <div className="rounded-xl bg-red-50 border border-red-100 p-3 text-center">
                <TrendingUp className="w-5 h-5 text-red-500 mx-auto mb-1" />
                <p className="text-base font-bold text-red-600">
                  {totalOut.toLocaleString()}
                </p>
                <p className="text-[10px] text-red-500 font-medium">Total OUT</p>
              </div>
            </div>
          </div>

          {/* Quick actions */}
          <div className="bg-gradient-to-br from-[#023E4A] to-[#0097A7] rounded-2xl shadow-sm p-5 text-white">
            <h3 className="font-bold mb-1">Manage Inventory</h3>
            <p className="text-white/70 text-xs mb-4">Add records, edit stock and record IN / OUT movements.</p>
            <div className="space-y-2">
              {[
                { href: "/industry/finished-products", label: "Finished Products", icon: PackageCheck },
                { href: "/industry/financial-kpi", label: "Stock Records", icon: Boxes },
              ].map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center justify-between bg-white/10 hover:bg-white/20 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
                >
                  <span className="inline-flex items-center gap-2"><Icon className="w-4 h-4" /> {label}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
