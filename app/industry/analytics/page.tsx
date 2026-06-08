"use client";

import { useState, useEffect, useMemo } from "react";
import { getUserProducts } from "@/app/actions/product";
import { getOrdersForMyIndustryProducts } from "@/app/actions/order";
import { getProductAnalytics, saveProductAnalytics, AnalyticsRow } from "@/app/actions/industry";
import IndustryNavbar from "@/components/IndustryNavbar";
import Header from "@/components/Header";
import Link from "next/link";
import {
  BarChart2, ArrowLeft, Save, TrendingUp, TrendingDown,
  DollarSign, Package, Pencil, Eye, RotateCcw, Trash2,
  FileText, FileSpreadsheet, ShoppingCart,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, Legend,
  BarChart, Bar,
} from "recharts";

interface Product { id: string; title: string; price?: number | null; category: string; }
interface Order {
  productId: string;
  quantity: number;
  status: string;
  createdAt: Date;
  productPrice: number;
  paymentMethod?: string | null;
}
interface TableRow extends AnalyticsRow { quantityOnline: number; }

const usd = (n: number) =>
  "RWF " + n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

const MONTHS = ["January","February","March","April","May","June",
                "July","August","September","October","November","December"];
const SHORT_MONTHS = MONTHS.map(m => m.slice(0, 3));

const PIE_COLORS: Record<string, string> = {
  cash: "#14b8a6", mobile_money: "#f59e0b", card: "#3b82f6", "": "#9ca3af",
};
const PIE_LABELS: Record<string, string> = {
  cash: "Cash", mobile_money: "Mobile Money", card: "Card",
};
const CHART_COLORS = ["#14b8a6","#0ea5e9","#f59e0b","#8b5cf6","#ef4444","#22c55e"];

function currentYearMonth() {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}`;
}
function monthLabel(ym: string) {
  const [y, m] = ym.split("-");
  return `${MONTHS[parseInt(m) - 1]} ${y}`;
}

// Custom tooltip for recharts
const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2 text-xs">
      <p className="font-bold text-gray-700 mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: <strong>{typeof p.value === "number" && p.value > 100 ? usd(p.value) : p.value}</strong>
        </p>
      ))}
    </div>
  );
};

export default function AnalyticsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders]     = useState<Order[]>([]);
  const [rows, setRows]         = useState<TableRow[]>([]);
  const [excludedIds, setExcludedIds] = useState<string[]>([]);
  const [month, setMonth]       = useState(currentYearMonth());
  const [loading, setLoading]   = useState(true);
  const [saveStatus, setSaveStatus] = useState<"idle"|"saving"|"saved"|"error">("idle");

  const monthOptions = useMemo(() => {
    const opts: string[] = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      opts.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    }
    return opts;
  }, []);

  useEffect(() => {
    Promise.all([getUserProducts(), getOrdersForMyIndustryProducts()]).then(([p, o]) => {
      setProducts(((p || []) as Product[]).filter(x => x.category === "Industry"));
      setOrders((o || []) as Order[]);
    });
  }, []);

  useEffect(() => {
    if (products.length === 0) { setLoading(false); return; }
    getProductAnalytics(month).then(({ rows: saved, excludedProductIds }) => {
      setExcludedIds(excludedProductIds);
      const [y, m] = month.split("-").map(Number);
      const newRows: TableRow[] = products
        .filter(p => !excludedProductIds.includes(p.id))
        .map((p) => {
          const existing = saved.find(r => r.productId === p.id);
          const onlineQty = orders
            .filter(o => {
              if (o.productId !== p.id || o.status === "cancelled") return false;
              const d = new Date(o.createdAt);
              return d.getFullYear() === y && d.getMonth() + 1 === m;
            })
            .reduce((s, o) => s + o.quantity, 0);
          return {
            productId: p.id, productName: p.title,
            sellingPrice: existing?.sellingPrice ?? p.price ?? 0,
            productCost: existing?.productCost ?? 0,
            afterSoldPrice: existing?.afterSoldPrice ?? p.price ?? 0,
            totalQuantity: existing?.totalQuantity ?? 0,
            quantityManual: existing?.quantityManual ?? 0,
            quantityOnline: onlineQty,
            soldAt: existing?.soldAt ?? "",
          };
        });
      setRows(newRows);
      setLoading(false);
    });
  }, [month, products, orders]);

  const update = (idx: number, field: keyof AnalyticsRow, val: string) => {
    setSaveStatus("idle");
    setRows(prev => prev.map((r, i) => i !== idx ? r : {
      ...r,
      [field]: ["sellingPrice","productCost","afterSoldPrice","totalQuantity","quantityManual"].includes(field)
        ? Number(val) || 0 : val,
    }));
  };

  const derived = useMemo(() => rows.map(r => {
    const totalSold = r.quantityOnline + r.quantityManual;
    const remained  = Math.max(r.totalQuantity - totalSold, 0);
    const amount    = r.afterSoldPrice * totalSold;
    const profitLoss = amount - r.sellingPrice * totalSold;
    const netProfitPerUnit = r.sellingPrice - r.productCost;
    const netProfit = netProfitPerUnit * totalSold;
    return { totalSold, remained, amount, profitLoss, netProfitPerUnit, netProfit };
  }), [rows]);

  const totals = useMemo(() => ({
    sellingPrice:    rows.reduce((s, r) => s + r.sellingPrice, 0),
    productCost:     rows.reduce((s, r) => s + r.productCost, 0),
    afterSoldPrice:  rows.reduce((s, r) => s + r.afterSoldPrice, 0),
    netProfitPerUnit: derived.reduce((s, d) => s + d.netProfitPerUnit, 0),
    totalQuantity:   rows.reduce((s, r) => s + r.totalQuantity, 0),
    quantityOnline:  rows.reduce((s, r) => s + r.quantityOnline, 0),
    quantityManual:  rows.reduce((s, r) => s + r.quantityManual, 0),
    totalSold:       derived.reduce((s, d) => s + d.totalSold, 0),
    remained:        derived.reduce((s, d) => s + d.remained, 0),
    amount:          derived.reduce((s, d) => s + d.amount, 0),
    netProfit:       derived.reduce((s, d) => s + (d.netProfit > 0 ? d.netProfit : 0), 0),
    losses:          derived.reduce((s, d) => s + (d.netProfit < 0 ? Math.abs(d.netProfit) : 0), 0),
    totalNetProfit:  derived.reduce((s, d) => s + d.netProfit, 0),
    priceDiff:       derived.reduce((s, d) => s + d.profitLoss, 0),
  }), [rows, derived]);

  // ── Chart data ─────────────────────────────────────────────────────

  // Monthly revenue chart (full year based on orders)
  const monthlyChartData = useMemo(() => {
    const year = new Date().getFullYear();
    return SHORT_MONTHS.map((label, idx) => {
      const mo = orders.filter(o => {
        if (o.status === "cancelled") return false;
        const d = new Date(o.createdAt);
        return d.getFullYear() === year && d.getMonth() === idx;
      });
      const revenue = mo.reduce((s, o) => s + (o.productPrice ?? 0) * o.quantity, 0);
      const qty     = mo.reduce((s, o) => s + o.quantity, 0);
      return { month: label, Revenue: revenue, "Qty Sold": qty };
    });
  }, [orders]);

  // Payments donut
  const paymentData = useMemo(() => {
    const counts: Record<string, number> = {};
    orders.forEach(o => {
      const pm = (o as any).paymentMethod || "cash";
      counts[pm] = (counts[pm] || 0) + 1;
    });
    return Object.entries(counts).map(([key, val]) => ({
      name: PIE_LABELS[key] ?? key,
      value: val,
      pct: orders.length ? ((val / orders.length) * 100).toFixed(1) : "0",
      color: PIE_COLORS[key] ?? "#9ca3af",
    }));
  }, [orders]);

  // Revenue by product bar chart
  const revenueByProduct = useMemo(() =>
    rows.map((r, i) => ({
      name: r.productName.length > 18 ? r.productName.slice(0, 18) + "…" : r.productName,
      Revenue: derived[i].amount,
      "Net Profit": Math.max(derived[i].netProfit, 0),
    })).sort((a, b) => b.Revenue - a.Revenue),
    [rows, derived]
  );

  // Global KPIs from all orders
  const allOrdersQty      = orders.filter(o => o.status !== "cancelled").reduce((s, o) => s + o.quantity, 0);
  const allOrdersRevenue  = orders.filter(o => o.status !== "cancelled").reduce((s, o) => s + (o.productPrice ?? 0) * o.quantity, 0);
  const allTransactions   = orders.filter(o => o.status !== "cancelled").length;

  // ── Actions ────────────────────────────────────────────────────────
  const handleSave = async () => {
    setSaveStatus("saving");
    const payload: AnalyticsRow[] = rows.map(({ quantityOnline: _q, ...r }) => r);
    const res = await saveProductAnalytics(month, payload, excludedIds);
    setSaveStatus(res.success ? "saved" : "error");
  };

  const handleResetRow = (idx: number) => {
    if (!confirm("Reset all values for this row to zero?")) return;
    setSaveStatus("idle");
    setRows(prev => prev.map((r, i) => i !== idx ? r : {
      ...r, sellingPrice: 0, productCost: 0, afterSoldPrice: 0,
      totalQuantity: 0, quantityManual: 0, soldAt: "",
    }));
  };

  const handleRemoveRow = async (idx: number) => {
    if (!confirm("Remove this product from this month's analytics? It will be hidden until you refresh the month.")) return;
    const removedId = rows[idx].productId;
    const newRows = rows.filter((_, i) => i !== idx);
    const newExcluded = [...excludedIds, removedId];
    setRows(newRows);
    setExcludedIds(newExcluded);
    setSaveStatus("saving");
    const payload: AnalyticsRow[] = newRows.map(({ quantityOnline: _q, ...r }) => r);
    const res = await saveProductAnalytics(month, payload, newExcluded);
    setSaveStatus(res.success ? "saved" : "error");
  };

  const downloadCSV = () => {
    const headers = ["#","Product Name","Selling Price","Product Cost","Net Profit/Unit",
      "After Sold Price","Quantity","Sold Online","Sold Manually","Remained",
      "Amount","Total Net Profit","Time Sold On","Price Diff"];
    const escape = (v: string | number) =>
      typeof v === "string" && v.includes(",") ? `"${v}"` : String(v);
    const dataRows = rows.map((r, i) => {
      const d = derived[i];
      return [i+1, escape(r.productName), r.sellingPrice, r.productCost,
        d.netProfitPerUnit.toFixed(0), r.afterSoldPrice, r.totalQuantity,
        r.quantityOnline, r.quantityManual, d.remained, d.amount.toFixed(0),
        d.netProfit.toFixed(0), r.soldAt || "", d.profitLoss.toFixed(0)].join(",");
    });
    const totalRow = ["TOTAL","","—","—",usd(totals.netProfit),"—",
      totals.totalQuantity, totals.quantityOnline, totals.quantityManual,
      totals.remained, totals.amount.toFixed(0),
      (totals.netProfit - totals.losses).toFixed(0),"",totals.priceDiff.toFixed(0)].join(",");
    const csv = [headers.join(","), ...dataRows, totalRow].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = `analytics-${month}.csv`;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
  };

  const downloadPDF = () => {
    const tRows = rows.map((r, i) => {
      const d = derived[i];
      const npColor  = d.netProfitPerUnit >= 0 ? "#15803d" : "#dc2626";
      const npuLabel = r.productCost > 0
        ? (d.netProfitPerUnit >= 0 ? "+" : "") + usd(d.netProfitPerUnit)
        : "—";
      const npLabel  = d.totalSold > 0 && r.productCost > 0
        ? (d.netProfit >= 0 ? "+" : "") + usd(d.netProfit)
        : "—";
      const npTotalColor = d.netProfit >= 0 ? "#15803d" : "#dc2626";
      const bg = i % 2 === 0 ? "#fff" : "#f0fdfa";
      return `<tr style="background:${bg}">
        <td style="text-align:center;color:#6b7280">${i + 1}</td>
        <td style="font-weight:700;color:#1e3a5f;max-width:160px">${r.productName}</td>
        <td class="r">${usd(r.sellingPrice)}</td>
        <td class="r">${r.productCost > 0 ? usd(r.productCost) : "—"}</td>
        <td class="r" style="color:${npColor};font-weight:700">${npuLabel}</td>
        <td class="r">${usd(r.afterSoldPrice)}</td>
        <td class="r">${r.totalQuantity}</td>
        <td class="r" style="color:#1d4ed8">${r.quantityOnline}</td>
        <td class="r">${r.quantityManual}</td>
        <td class="r" style="color:#b45309">${d.remained}</td>
        <td class="r" style="font-weight:700;color:#1e3a5f">${d.amount > 0 ? usd(d.amount) : "—"}</td>
        <td class="r" style="color:${npTotalColor};font-weight:700">${npLabel}</td>
        <td style="color:#6b7280">${r.soldAt || "—"}</td>
      </tr>`;
    }).join("");

    const npTotalColor = totals.totalNetProfit >= 0 ? "#86efac" : "#fca5a5";
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/>
<title>Analytics — ${monthLabel(month)}</title>
<style>
  @page{size:A4 landscape;margin:15mm 12mm}
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:Arial,sans-serif;font-size:10px;color:#111;background:#fff}
  h1{font-size:18px;color:#1e3a5f;margin-bottom:2px;font-weight:900}
  .meta{color:#555;font-size:9px;margin-bottom:14px}
  .kpis{display:flex;gap:8px;margin-bottom:16px}
  .kpi{flex:1;padding:10px 12px;border-radius:6px;background:#f0fdfa;border:1px solid #99f6e4}
  .kpi h3{font-size:8px;color:#555;margin-bottom:4px;text-transform:uppercase;letter-spacing:.5px}
  .kpi p{font-size:15px;font-weight:900}
  .t1{color:#0f766e}.t2{color:#0369a1}.t3{color:#1e3a5f}.t5{color:#15803d}
  table{width:100%;border-collapse:collapse;border-radius:6px;overflow:hidden;border:1px solid #e2e8f0}
  thead tr{background:#1e3a5f;color:#fff}
  th{padding:7px 6px;font-size:8.5px;font-weight:700;text-align:left;white-space:nowrap;letter-spacing:.3px}
  th.r{text-align:right}
  td{padding:6px;border-bottom:1px solid #e5e7eb;font-size:9px}
  .r{text-align:right}
  tfoot tr{background:#1e3a5f;color:#fff}
  tfoot td{padding:7px 6px;font-weight:700;font-size:9px}
</style></head><body>
<h1>Sales Analytics Report</h1>
<p class="meta">Period: <strong>${monthLabel(month)}</strong> &nbsp;·&nbsp; Generated: ${new Date().toLocaleDateString("en-US",{dateStyle:"long"})}</p>
<div class="kpis">
  <div class="kpi"><h3>Transactions</h3><p class="t1">${allTransactions}</p></div>
  <div class="kpi"><h3>Qty Sold</h3><p class="t2">${allOrdersQty}</p></div>
  <div class="kpi"><h3>Revenue</h3><p class="t3">${usd(allOrdersRevenue)}</p></div>
  <div class="kpi"><h3>Net Profit</h3><p class="t5">${usd(totals.totalNetProfit)}</p></div>
</div>
<table>
  <thead><tr>
    <th style="width:24px">#</th>
    <th>Product Name</th>
    <th class="r">Sell Price</th>
    <th class="r">Product Cost</th>
    <th class="r">Net/Unit</th>
    <th class="r">After Sold Price</th>
    <th class="r">Total Qty</th>
    <th class="r">Online</th>
    <th class="r">Manual</th>
    <th class="r">Remained</th>
    <th class="r">Amount</th>
    <th class="r">Net Profit</th>
    <th>Date Sold</th>
  </tr></thead>
  <tbody>${tRows}</tbody>
  <tfoot><tr>
    <td colspan="2" style="font-size:10px">TOTAL</td>
    <td class="r">—</td>
    <td class="r">—</td>
    <td class="r">—</td>
    <td class="r">—</td>
    <td class="r">${totals.totalQuantity}</td>
    <td class="r">${totals.quantityOnline}</td>
    <td class="r">${totals.quantityManual}</td>
    <td class="r">${totals.remained}</td>
    <td class="r">${usd(totals.amount)}</td>
    <td class="r" style="color:${npTotalColor}">${totals.totalNetProfit >= 0 ? "+" : ""}${usd(totals.totalNetProfit)}</td>
    <td>—</td>
  </tr></tfoot>
</table>
</body></html>`;

    const win = window.open("", "_blank", "width=1200,height=800");
    if (!win) { alert("Pop-up blocked — allow pop-ups and try again."); return; }
    win.document.write(html);
    win.document.close();
    win.onload = () => { win.focus(); win.print(); };
  };

  const numCell = (idx: number, field: keyof AnalyticsRow, val: number) => (
    <input type="number" min={0} value={val || ""} placeholder="0"
      onChange={e => update(idx, field, e.target.value)}
      className="w-full px-2 py-1 text-xs border-0 outline-none bg-transparent focus:bg-cyan-50 text-right" />
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-cyan-50/30 to-blue-50/20">
      <Header />
      <IndustryNavbar />

      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#023E4A] to-[#0097A7] text-white">
        <div className="absolute inset-0 bg-black/10" />
        <div className="relative max-w-7xl mx-auto px-4 pt-28 pb-14 sm:px-6 lg:px-8">
          <Link href="/industry/dashboard"
            className="inline-flex items-center gap-1.5 text-white/70 hover:text-white text-sm mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center shrink-0">
              <BarChart2 className="w-8 h-8 text-white" />
            </div>
            <div>
              <p className="text-white/70 text-sm font-medium uppercase tracking-wide">Stock Management</p>
              <h1 className="text-3xl font-bold">Sales Analytics</h1>
              <p className="mt-1 text-white/80">Monthly product sales tracker — revenue, profit &amp; trends</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-6">

        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-white rounded-xl px-4 py-3 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <label className="text-sm font-semibold text-gray-700">Month:</label>
            <select value={month}
              onChange={e => { setMonth(e.target.value); setSaveStatus("idle"); setLoading(true); }}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#0097A7] bg-white">
              {monthOptions.map(m => <option key={m} value={m}>{monthLabel(m)}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            {saveStatus === "saved" && <span className="text-green-700 text-xs font-medium">Saved ✓</span>}
            {saveStatus === "error" && <span className="text-red-600 text-xs font-medium">Failed to save</span>}
            <button onClick={downloadCSV} disabled={rows.length === 0} title="Download CSV"
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-[#0097A7] text-white text-sm font-semibold px-3 py-2 rounded-lg transition-colors disabled:opacity-40">
              <FileSpreadsheet className="w-4 h-4" /> CSV
            </button>
            <button onClick={downloadPDF} disabled={rows.length === 0} title="Download PDF"
              className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold px-3 py-2 rounded-lg transition-colors disabled:opacity-40">
              <FileText className="w-4 h-4" /> PDF
            </button>
            <button onClick={handleSave} disabled={saveStatus === "saving" || rows.length === 0}
              className="flex items-center gap-1.5 bg-[#023E4A] hover:bg-[#012830] text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors disabled:opacity-40">
              <Save className="w-4 h-4" />
              {saveStatus === "saving" ? "Saving…" : "Save"}
            </button>
          </div>
        </div>

        {/* ── KPI Cards ────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Transactions",  value: allTransactions,         icon: ShoppingCart, color: "text-[#0097A7]",  bg: "bg-cyan-50"  },
            { label: "Quantity Sold", value: allOrdersQty,            icon: Package,      color: "text-cyan-600",  bg: "bg-cyan-50"  },
            { label: "Revenue",       value: usd(allOrdersRevenue),   icon: DollarSign,   color: "text-blue-700",  bg: "bg-blue-50"  },
            { label: "Net Profit",    value: usd(totals.netProfit),   icon: TrendingUp,   color: "text-green-700", bg: "bg-green-50" },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full ${bg} flex items-center justify-center shrink-0`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">{label}</p>
                <p className={`text-base font-black ${color} leading-tight`}>{value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Charts Row 1 ─────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Monthly Revenue line chart — 2/3 width */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h3 className="text-sm font-bold text-gray-800 mb-4">Monthly Revenue</h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={monthlyChartData} margin={{ top: 5, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
                <Tooltip content={<ChartTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="Revenue" stroke="#14b8a6" strokeWidth={2.5}
                  dot={{ r: 3, fill: "#14b8a6" }} activeDot={{ r: 5 }} />
                <Line type="monotone" dataKey="Qty Sold" stroke="#0ea5e9" strokeWidth={2}
                  dot={{ r: 3, fill: "#0ea5e9" }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Payments Used donut — 1/3 width */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h3 className="text-sm font-bold text-gray-800 mb-4">Payments Used</h3>
            {paymentData.length === 0 ? (
              <div className="flex items-center justify-center h-[220px] text-gray-400 text-xs">No order data yet</div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={paymentData} cx="50%" cy="50%" innerRadius={45} outerRadius={72}
                      dataKey="value" paddingAngle={3}>
                      {paymentData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v, n) => [v, n]} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-2 space-y-1.5">
                  {paymentData.map((d, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: d.color }} />
                        <span className="text-gray-600">{d.name}</span>
                      </div>
                      <span className="font-bold text-gray-800">{d.pct}%</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── Charts Row 2 ─────────────────────────────────────────── */}
        {revenueByProduct.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Revenue by Product */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h3 className="text-sm font-bold text-gray-800 mb-4">Revenue by Product</h3>
              <ResponsiveContainer width="100%" height={Math.max(revenueByProduct.length * 40, 160)}>
                <BarChart data={revenueByProduct} layout="vertical"
                  margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10 }}
                    tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={110} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="Revenue" radius={[0, 4, 4, 0]}>
                    {revenueByProduct.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Net Profit by Product */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h3 className="text-sm font-bold text-gray-800 mb-4">Net Profit by Product</h3>
              <ResponsiveContainer width="100%" height={Math.max(revenueByProduct.length * 40, 160)}>
                <BarChart data={revenueByProduct} layout="vertical"
                  margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10 }}
                    tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={110} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="Net Profit" radius={[0, 4, 4, 0]}>
                    {revenueByProduct.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[(i + 2) % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* ── Analytics Table ───────────────────────────────────────── */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#0097A7]" />
          </div>
        ) : rows.length === 0 ? (
          <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No Industry products found</p>
            <p className="text-gray-400 text-sm mt-1">Upload products first from the dashboard.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-[#023E4A] text-white">
                  <th className="px-3 py-3 text-left font-semibold whitespace-nowrap">#</th>
                  <th className="px-3 py-3 text-left font-semibold whitespace-nowrap">Product Name</th>
                  <th className="px-3 py-3 text-right font-semibold whitespace-nowrap">Selling Price</th>
                  <th className="px-3 py-3 text-right font-semibold whitespace-nowrap">Product Cost</th>
                  <th className="px-3 py-3 text-right font-semibold whitespace-nowrap">Net Profit / Unit</th>
                  <th className="px-3 py-3 text-right font-semibold whitespace-nowrap">After Sold Price</th>
                  <th className="px-3 py-3 text-right font-semibold whitespace-nowrap">Quantity</th>
                  <th className="px-3 py-3 text-right font-semibold whitespace-nowrap">Sold Online</th>
                  <th className="px-3 py-3 text-right font-semibold whitespace-nowrap">Sold Manually</th>
                  <th className="px-3 py-3 text-right font-semibold whitespace-nowrap">Remained</th>
                  <th className="px-3 py-3 text-right font-semibold whitespace-nowrap">Amount</th>
                  <th className="px-3 py-3 text-right font-semibold whitespace-nowrap">Net Profit</th>
                  <th className="px-3 py-3 text-left font-semibold whitespace-nowrap">Time Sold On</th>
                  <th className="px-3 py-3 text-center font-semibold whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => {
                  const d = derived[i];
                  return (
                    <tr key={row.productId}
                      className={`border-b border-gray-100 hover:bg-cyan-50/30 transition-colors ${i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}>
                      <td className="px-3 py-2 text-gray-400 font-mono">{i + 1}</td>
                      <td className="px-3 py-2 font-semibold text-[#023E4A] max-w-[160px] truncate">{row.productName}</td>

                      <td className="p-0 border-r border-gray-100 min-w-[110px]">{numCell(i,"sellingPrice",row.sellingPrice)}</td>
                      <td className="p-0 border-r border-gray-100 min-w-[110px]">{numCell(i,"productCost",row.productCost)}</td>

                      <td className={`px-3 py-2 text-right font-bold font-mono ${d.netProfitPerUnit > 0 ? "text-green-700" : d.netProfitPerUnit < 0 ? "text-red-600" : "text-gray-400"}`}>
                        {row.productCost > 0 ? (d.netProfitPerUnit >= 0 ? "+" : "") + usd(d.netProfitPerUnit) : <span className="text-gray-300">—</span>}
                      </td>

                      <td className="p-0 border-r border-gray-100 min-w-[110px]">{numCell(i,"afterSoldPrice",row.afterSoldPrice)}</td>
                      <td className="p-0 border-r border-gray-100 min-w-[90px]">{numCell(i,"totalQuantity",row.totalQuantity)}</td>

                      <td className="px-3 py-2 text-right font-mono text-blue-700 font-semibold">{row.quantityOnline}</td>

                      <td className="p-0 border-r border-gray-100 min-w-[90px]">{numCell(i,"quantityManual",row.quantityManual)}</td>

                      <td className={`px-3 py-2 text-right font-bold font-mono ${d.remained === 0 ? "text-gray-400" : d.remained < 0 ? "text-red-600" : "text-gray-800"}`}>
                        {d.remained}
                      </td>
                      <td className="px-3 py-2 text-right font-bold font-mono text-[#023E4A]">
                        {d.amount > 0 ? usd(d.amount) : <span className="text-gray-300">—</span>}
                      </td>

                      <td className={`px-3 py-2 text-right font-bold font-mono ${d.netProfit > 0 ? "text-green-700" : d.netProfit < 0 ? "text-red-600" : "text-gray-400"}`}>
                        {row.productCost > 0 && d.totalSold > 0
                          ? (d.netProfit >= 0 ? "+" : "") + usd(d.netProfit)
                          : <span className="text-gray-300">—</span>}
                      </td>

                      <td className="p-0 border-r border-gray-100 min-w-[130px]">
                        <input type="date" value={row.soldAt}
                          onChange={e => update(i,"soldAt",e.target.value)}
                          className="w-full px-2 py-1 text-xs border-0 outline-none bg-transparent focus:bg-cyan-50" />
                      </td>

                      <td className="px-3 py-2">
                        <div className="flex items-center justify-center gap-1">
                          <Link href={`/product-details?id=${row.productId}`} target="_blank"
                            title="View product"
                            className="p-1.5 rounded-lg text-gray-500 hover:text-[#0097A7] hover:bg-cyan-50 transition-colors">
                            <Eye className="w-3.5 h-3.5" />
                          </Link>
                          <Link href={`/user/edit-product?id=${row.productId}`}
                            title="Edit product"
                            className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors">
                            <Pencil className="w-3.5 h-3.5" />
                          </Link>
                          <button onClick={() => handleResetRow(i)} title="Reset row to zero"
                            className="p-1.5 rounded-lg text-orange-500 hover:bg-orange-50 transition-colors">
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleRemoveRow(i)} title="Remove from analytics"
                            className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-[#023E4A] text-white font-bold text-xs">
                  <td className="px-3 py-2.5" colSpan={2}>TOTAL</td>
                  <td className="px-3 py-2.5 text-right font-mono">{usd(totals.sellingPrice)}</td>
                  <td className="px-3 py-2.5 text-right font-mono">{usd(totals.productCost)}</td>
                  <td className="px-3 py-2.5 text-right font-mono">
                    <span className={totals.netProfitPerUnit >= 0 ? "text-green-300" : "text-red-300"}>
                      {totals.netProfitPerUnit >= 0 ? "+" : ""}{usd(totals.netProfitPerUnit)}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono">{usd(totals.afterSoldPrice)}</td>
                  <td className="px-3 py-2.5 text-right font-mono">{totals.totalQuantity}</td>
                  <td className="px-3 py-2.5 text-right font-mono">{totals.quantityOnline}</td>
                  <td className="px-3 py-2.5 text-right font-mono">{totals.quantityManual}</td>
                  <td className="px-3 py-2.5 text-right font-mono">{totals.remained}</td>
                  <td className="px-3 py-2.5 text-right font-mono">{usd(totals.amount)}</td>
                  <td className="px-3 py-2.5 text-right font-mono">
                    <span className={totals.totalNetProfit >= 0 ? "text-green-300" : "text-red-300"}>
                      {totals.totalNetProfit >= 0 ? "+" : ""}{usd(totals.totalNetProfit)}
                    </span>
                  </td>
                  <td className="px-3 py-2.5" />
                  <td className="px-3 py-2.5" />
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {/* ── Profit / Loss summary panels ─────────────────────────── */}
        {rows.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-xl border border-green-200 bg-green-50 p-5">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <h3 className="font-bold text-green-800 text-sm uppercase tracking-wide">Net Profit</h3>
              </div>
              <p className="text-3xl font-black text-green-700">{usd(totals.netProfit)}</p>
              <p className="text-xs text-green-600 mt-1">(Selling Price − Product Cost) × Units Sold</p>
              <div className="mt-3 space-y-1">
                {rows.map((r, i) => derived[i].netProfit > 0 && (
                  <div key={r.productId} className="flex justify-between text-xs text-green-700">
                    <span className="truncate max-w-[60%]">{r.productName}</span>
                    <span className="font-mono font-semibold">+{usd(derived[i].netProfit)}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-red-200 bg-red-50 p-5">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="w-5 h-5 text-red-600" />
                <h3 className="font-bold text-red-800 text-sm uppercase tracking-wide">Losses</h3>
              </div>
              <p className="text-3xl font-black text-red-700">{usd(totals.losses)}</p>
              <p className="text-xs text-red-600 mt-1">Products where Product Cost exceeded Selling Price</p>
              <div className="mt-3 space-y-1">
                {rows.map((r, i) => derived[i].netProfit < 0 && (
                  <div key={r.productId} className="flex justify-between text-xs text-red-700">
                    <span className="truncate max-w-[60%]">{r.productName}</span>
                    <span className="font-mono font-semibold">-{usd(Math.abs(derived[i].netProfit))}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
