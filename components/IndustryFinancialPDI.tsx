"use client";

import { useState, useMemo } from "react";
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  BarChart, Bar,
} from "recharts";
import { TrendingUp, TrendingDown, DollarSign, Package, BarChart2, Download } from "lucide-react";

interface Product {
  id: string;
  title: string;
  description: string;
  price?: number | null;
  subcategory?: string | null;
  available: boolean;
  media?: { images: string[]; mainImage?: string | null } | null;
}

interface MonthData {
  month: string;
  projectedRevenue: number;
  actualRevenue: number;
  totalPMaterials: number;
  taxes: number;
  transport: number;
  commission: number;
  boxes: number;
}

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

const SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const INITIAL: MonthData[] = MONTHS.map((month) => ({
  month,
  projectedRevenue: 0,
  actualRevenue: 0,
  totalPMaterials: 0,
  taxes: 0,
  transport: 0,
  commission: 0,
  boxes: 0,
}));

const PIE_COLORS = ["#1e3a5f", "#7c9cc0", "#c8d8e8"];
const LINE_PROJECTED = "#a0aec0";
const LINE_ACTUAL = "#1e3a5f";

const usd = (n: number) =>
  "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const pct = (n: number) =>
  (n >= 0 ? "+" : "") + n.toFixed(2) + "%";

interface Props {
  products: Product[];
}

export default function IndustryFinancialPDI({ products }: Props) {
  const [rows, setRows] = useState<MonthData[]>(INITIAL);

  const update = (idx: number, field: keyof MonthData, val: string) => {
    setRows((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: field === "month" ? val : Number(val) || 0 };
      return next;
    });
  };

  const totals = useMemo(() => {
    const projectedRevenue = rows.reduce((s, r) => s + r.projectedRevenue, 0);
    const actualRevenue = rows.reduce((s, r) => s + r.actualRevenue, 0);
    const totalPMaterials = rows.reduce((s, r) => s + r.totalPMaterials, 0);
    const taxes = rows.reduce((s, r) => s + r.taxes, 0);
    const transport = rows.reduce((s, r) => s + r.transport, 0);
    const commission = rows.reduce((s, r) => s + r.commission, 0);
    const boxes = rows.reduce((s, r) => s + r.boxes, 0);
    const operatingExpenses = totalPMaterials + taxes + transport + commission;
    const netProfit = actualRevenue - operatingExpenses;
    const diffPct = projectedRevenue > 0 ? ((actualRevenue - projectedRevenue) / projectedRevenue) * 100 : 0;
    return { projectedRevenue, actualRevenue, totalPMaterials, taxes, transport, commission, boxes, operatingExpenses, netProfit, diffPct };
  }, [rows]);

  const pieData = useMemo(() => {
    const total = totals.actualRevenue + totals.operatingExpenses + Math.max(totals.netProfit, 0);
    if (total === 0) return [
      { name: "Actual Revenue", value: 59 },
      { name: "Operating Expenses", value: 24.5 },
      { name: "Net Profit", value: 16.5 },
    ];
    const ar = totals.actualRevenue;
    const op = totals.operatingExpenses;
    const np = Math.max(totals.netProfit, 0);
    const sum = ar + op + np;
    return [
      { name: "Actual Revenue", value: parseFloat(((ar / sum) * 100).toFixed(1)) },
      { name: "Operating Expenses", value: parseFloat(((op / sum) * 100).toFixed(1)) },
      { name: "Net Profit", value: parseFloat(((np / sum) * 100).toFixed(1)) },
    ];
  }, [totals]);

  const lineData = rows.map((r, i) => ({
    name: SHORT[i],
    Projected: r.projectedRevenue,
    Actual: r.actualRevenue,
  }));

  const barData = rows.map((r, i) => ({
    name: SHORT[i],
    "Actual Revenue": r.actualRevenue,
    "P/Materials": r.totalPMaterials,
    Taxes: r.taxes,
    Transport: r.transport,
    Commission: r.commission,
  }));

  const numInput = (
    idx: number,
    field: keyof MonthData,
    val: number,
    cls = ""
  ) => (
    <input
      type="number"
      min={0}
      className={`w-full px-2 py-1 text-xs border-0 outline-none bg-transparent focus:bg-blue-50 text-right ${cls}`}
      value={val || ""}
      placeholder="0"
      onChange={(e) => update(idx, field, e.target.value)}
    />
  );

  // ── Download financial report as PDF ────────────────────────
  const downloadReport = async () => {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const PW = 297, PH = 210, M = 14, CW = PW - 2 * M;
    const navy: [number, number, number] = [30, 58, 95];
    const light: [number, number, number] = [240, 244, 248];
    const white: [number, number, number] = [255, 255, 255];

    const frw = (n: number) => "Frw " + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    // Header bar
    doc.setFillColor(...navy); doc.rect(0, 0, PW, 22, "F");
    doc.setTextColor(...white); doc.setFontSize(15); doc.setFont("helvetica", "bold");
    doc.text("STOCK MANAGEMENT FINANCIAL REPORT", M, 14);
    doc.setFontSize(7); doc.setFont("helvetica", "normal");
    doc.text(`Generated: ${new Date().toLocaleString()}`, PW - M, 14, { align: "right" });

    let y = 30;

    // KPI cards
    doc.setTextColor(...navy); doc.setFontSize(10); doc.setFont("helvetica", "bold");
    doc.text("Financial Summary", M, y); y += 5;
    const kpis = [
      { label: "Actual Revenue",     value: frw(totals.actualRevenue),     bg: navy },
      { label: "Operating Expenses", value: frw(totals.operatingExpenses), bg: [71, 85, 105] as [number,number,number] },
      { label: "Net Profit",         value: frw(totals.netProfit),         bg: (totals.netProfit >= 0 ? [22,101,52] : [185,28,28]) as [number,number,number] },
      { label: "Total Boxes",        value: totals.boxes.toLocaleString(), bg: [67,56,202] as [number,number,number] },
    ];
    const kw = (CW - 3) / 4;
    kpis.forEach(({ label, value, bg }, i) => {
      const x = M + i * (kw + 1);
      doc.setFillColor(...bg); doc.roundedRect(x, y, kw, 14, 2, 2, "F");
      doc.setTextColor(...white); doc.setFontSize(6.5); doc.setFont("helvetica", "normal");
      doc.text(label, x + 3, y + 5);
      doc.setFontSize(8); doc.setFont("helvetica", "bold");
      doc.text(value, x + 3, y + 12);
    });
    y += 20;

    // Monthly table
    doc.setTextColor(...navy); doc.setFontSize(10); doc.setFont("helvetica", "bold");
    doc.text("Monthly Financial Data", M, y); y += 5;

    const heads = ["Month","Proj. Revenue","Act. Revenue","Diff %","P/Materials","Taxes","Transport","Commission","Boxes"];
    const rawW = [22, 28, 28, 18, 28, 22, 22, 22, 16];
    const totalW = rawW.reduce((a, b) => a + b, 0);
    const colW = rawW.map(w => (w / totalW) * CW);
    const RH = 6.5;

    const drawRow = (cells: string[], rowY: number, isHeader: boolean, isTotal: boolean) => {
      if (isHeader || isTotal) { doc.setFillColor(...navy); doc.rect(M, rowY, CW, RH, "F"); doc.setTextColor(...white); }
      else { doc.setTextColor(30, 30, 30); }
      doc.setFontSize(isHeader || isTotal ? 6.5 : 6);
      doc.setFont("helvetica", isHeader || isTotal ? "bold" : "normal");
      let cx = M + 1;
      cells.forEach((cell, i) => { doc.text(cell, cx, rowY + RH - 1.5); cx += colW[i]; });
    };

    drawRow(heads, y, true, false); y += RH;
    rows.forEach((r, i) => {
      const diff = r.actualRevenue - r.projectedRevenue;
      const dp = r.projectedRevenue > 0 ? (diff / r.projectedRevenue * 100) : 0;
      if (i % 2 === 0) { doc.setFillColor(...light); doc.rect(M, y, CW, RH, "F"); }
      drawRow([
        r.month,
        r.projectedRevenue > 0 ? frw(r.projectedRevenue) : "—",
        r.actualRevenue > 0 ? frw(r.actualRevenue) : "—",
        (r.projectedRevenue > 0 || r.actualRevenue > 0) ? (dp >= 0 ? "+" : "") + dp.toFixed(2) + "%" : "—",
        r.totalPMaterials > 0 ? frw(r.totalPMaterials) : "—",
        r.taxes > 0 ? frw(r.taxes) : "—",
        r.transport > 0 ? frw(r.transport) : "—",
        r.commission > 0 ? frw(r.commission) : "—",
        r.boxes > 0 ? r.boxes.toLocaleString() : "—",
      ], y, false, false);
      y += RH;
    });
    const tp = totals.diffPct;
    drawRow(["Total", frw(totals.projectedRevenue), frw(totals.actualRevenue), (tp >= 0 ? "+" : "") + tp.toFixed(2) + "%", frw(totals.totalPMaterials), frw(totals.taxes), frw(totals.transport), frw(totals.commission), totals.boxes.toLocaleString()], y, false, true);
    y += RH + 8;

    // Products table
    if (products.length > 0) {
      if (y > PH - 45) { doc.addPage(); y = 20; }
      doc.setTextColor(...navy); doc.setFontSize(10); doc.setFont("helvetica", "bold");
      doc.text("Products Being Sold", M, y); y += 5;
      const ph2 = ["#","Product Name","Category","Unit Price","Status","Description"];
      const pw2 = [8, 50, 35, 32, 22, CW - 8 - 50 - 35 - 32 - 22];
      const drawPRow = (cells: string[], ry: number, header: boolean) => {
        if (header) { doc.setFillColor(...navy); doc.rect(M, ry, CW, RH, "F"); doc.setTextColor(...white); }
        else doc.setTextColor(30, 30, 30);
        doc.setFontSize(header ? 6.5 : 6); doc.setFont("helvetica", header ? "bold" : "normal");
        let cx = M + 1;
        cells.forEach((c, i) => { doc.text(c.length > 28 ? c.slice(0, 27) + "…" : c, cx, ry + RH - 1.5); cx += pw2[i]; });
      };
      drawPRow(ph2, y, true); y += RH;
      products.forEach((p, i) => {
        if (y > PH - 10) { doc.addPage(); y = 20; }
        if (i % 2 === 0) { doc.setFillColor(...light); doc.rect(M, y, CW, RH, "F"); }
        drawPRow([
          String(i + 1), p.title,
          p.subcategory?.replace("-", " ") ?? "Industry",
          p.price != null ? frw(p.price) : "—",
          p.available ? "Available" : "Unavailable",
          p.description ?? "—",
        ], y, false);
        y += RH;
      });
    }

    // Footer
    doc.setFontSize(7); doc.setTextColor(150, 150, 150);
    doc.text("Vertex Industry Management System", M, PH - 5);

    doc.save("financial-report.pdf");
  };

  return (
    <div className="space-y-6">
      {/* ── Dashboard header ─────────────────────────────────── */}
      <div className="rounded-xl overflow-hidden shadow-lg border border-gray-200">
        <div className="bg-[#1e3a5f] text-white px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black tracking-widest uppercase">
              Stock Management Dashboard
            </h2>
            <p className="text-blue-200 text-sm mt-0.5">
              Monitoring stock for new materials and manufacturing
            </p>
          </div>
          <button
            onClick={downloadReport}
            className="flex items-center gap-2 bg-white/15 hover:bg-white/25 transition-colors text-white text-sm font-semibold px-4 py-2 rounded-lg border border-white/30"
          >
            <Download className="w-4 h-4" /> Download Report
          </button>
        </div>

        {/* ── Three charts ──────────────────────────────────── */}
        <div className="bg-white p-4 grid grid-cols-1 md:grid-cols-3 gap-4 border-b border-gray-200">
          {/* 1. Revenue Distribution pie */}
          <div>
            <p className="text-xs font-semibold text-center text-gray-600 mb-1">Revenue Distribution</p>
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={pieData} dataKey="value" cx="50%" cy="50%" outerRadius={60} labelLine={false}>
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => `${v}%`} />
                <Legend iconSize={8} wrapperStyle={{ fontSize: 10 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* 2. Monthly production revenue line */}
          <div>
            <p className="text-xs font-semibold text-center text-gray-600 mb-1">Monthly Production Revenue</p>
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={lineData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 9 }} />
                <Tooltip formatter={(v: number) => usd(v)} />
                <Legend iconSize={8} wrapperStyle={{ fontSize: 10 }} />
                <Line type="monotone" dataKey="Projected" stroke={LINE_PROJECTED} strokeWidth={2} dot={{ r: 2 }} />
                <Line type="monotone" dataKey="Actual" stroke={LINE_ACTUAL} strokeWidth={2} dot={{ r: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* 3. Net Profit Summary bar */}
          <div>
            <p className="text-xs font-semibold text-center text-gray-600 mb-1">Net Profit Summary</p>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={barData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 9 }} />
                <Tooltip formatter={(v: number) => usd(v)} />
                <Legend iconSize={8} wrapperStyle={{ fontSize: 10 }} />
                <Bar dataKey="Actual Revenue" fill="#1e3a5f" stackId="a" />
                <Bar dataKey="P/Materials" fill="#4a7fb5" stackId="b" />
                <Bar dataKey="Taxes" fill="#7cabd4" stackId="b" />
                <Bar dataKey="Transport" fill="#a8c8e8" stackId="b" />
                <Bar dataKey="Commission" fill="#c8ddf0" stackId="b" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ── Financial table ───────────────────────────────── */}
        <div className="bg-white overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-[#1e3a5f] text-white">
                {["Month","Projected Revenue","Actual Revenue","Difference","Total P/materials","Taxes","Transport","Commission","Boxes"].map((h) => (
                  <th key={h} className="px-3 py-2 text-left font-semibold border-r border-blue-800 whitespace-nowrap">
                    {h}
                  </th>
                ))}
                <th className="px-3 py-2 text-left font-semibold whitespace-nowrap">Summary</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const diff = r.actualRevenue - r.projectedRevenue;
                const diffP = r.projectedRevenue > 0 ? (diff / r.projectedRevenue) * 100 : 0;
                const isNeg = diff < 0;
                const rowBg = i % 2 === 0 ? "bg-[#f0f4f8]" : "bg-white";
                const summaryLabels: Record<number,{ label: string; val: number; color: string }> = {
                  0: { label: "Actual Revenue", val: totals.actualRevenue, color: "text-blue-900" },
                  1: { label: "Operating Expenses", val: totals.operatingExpenses, color: "text-red-700" },
                  2: { label: "Net Profit", val: totals.netProfit, color: totals.netProfit >= 0 ? "text-green-700" : "text-red-700" },
                };
                return (
                  <tr key={r.month} className={`${rowBg} border-b border-gray-200 hover:bg-blue-50/40 transition-colors`}>
                    <td className="px-3 py-1 font-semibold text-[#1e3a5f] border-r border-gray-200 whitespace-nowrap">
                      {r.month}
                    </td>
                    <td className="border-r border-gray-200 p-0">{numInput(i, "projectedRevenue", r.projectedRevenue)}</td>
                    <td className="border-r border-gray-200 p-0">{numInput(i, "actualRevenue", r.actualRevenue)}</td>
                    <td className={`px-3 py-1 font-medium border-r border-gray-200 whitespace-nowrap ${isNeg ? "text-red-600" : "text-green-700"}`}>
                      {r.projectedRevenue > 0 || r.actualRevenue > 0 ? pct(diffP) : "—"}
                    </td>
                    <td className="border-r border-gray-200 p-0">{numInput(i, "totalPMaterials", r.totalPMaterials)}</td>
                    <td className="border-r border-gray-200 p-0">{numInput(i, "taxes", r.taxes)}</td>
                    <td className="border-r border-gray-200 p-0">{numInput(i, "transport", r.transport)}</td>
                    <td className="border-r border-gray-200 p-0">{numInput(i, "commission", r.commission)}</td>
                    <td className="border-r border-gray-200 p-0">{numInput(i, "boxes", r.boxes)}</td>
                    <td className="px-3 py-1">
                      {summaryLabels[i] && (
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-gray-500 whitespace-nowrap">{summaryLabels[i].label}</span>
                          <span className={`font-bold whitespace-nowrap ${summaryLabels[i].color}`}>
                            {usd(summaryLabels[i].val)}
                          </span>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
              {/* Totals row */}
              <tr className="bg-[#1e3a5f] text-white font-bold text-xs">
                <td className="px-3 py-2 border-r border-blue-800">Total</td>
                <td className="px-3 py-2 border-r border-blue-800 text-right">{usd(totals.projectedRevenue)}</td>
                <td className="px-3 py-2 border-r border-blue-800 text-right">{usd(totals.actualRevenue)}</td>
                <td className={`px-3 py-2 border-r border-blue-800 ${totals.diffPct < 0 ? "text-red-300" : "text-green-300"}`}>
                  {pct(totals.diffPct)}
                </td>
                <td className="px-3 py-2 border-r border-blue-800 text-right">{usd(totals.totalPMaterials)}</td>
                <td className="px-3 py-2 border-r border-blue-800 text-right">{usd(totals.taxes)}</td>
                <td className="px-3 py-2 border-r border-blue-800 text-right">{usd(totals.transport)}</td>
                <td className="px-3 py-2 border-r border-blue-800 text-right">{usd(totals.commission)}</td>
                <td className="px-3 py-2 border-r border-blue-800 text-right">{totals.boxes.toLocaleString()}</td>
                <td className="px-3 py-2" />
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ── KPI summary cards ─────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Actual Revenue", val: totals.actualRevenue, icon: DollarSign, color: "bg-blue-900 text-white" },
          { label: "Operating Expenses", val: totals.operatingExpenses, icon: BarChart2, color: "bg-slate-600 text-white" },
          { label: "Net Profit", val: totals.netProfit, icon: totals.netProfit >= 0 ? TrendingUp : TrendingDown, color: totals.netProfit >= 0 ? "bg-green-600 text-white" : "bg-red-600 text-white" },
          { label: "Total Boxes", val: totals.boxes, icon: Package, color: "bg-indigo-600 text-white", isQty: true },
        ].map(({ label, val, icon: Icon, color, isQty }) => (
          <div key={label} className={`rounded-xl p-4 ${color} shadow`}>
            <div className="flex items-center gap-2 mb-1">
              <Icon className="w-4 h-4 opacity-80" />
              <span className="text-xs font-medium opacity-80">{label}</span>
            </div>
            <p className="text-lg font-black">
              {isQty ? val.toLocaleString() : usd(val)}
            </p>
          </div>
        ))}
      </div>

      {/* ── Product listings ─────────────────────────────────── */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Package className="w-5 h-5 text-[#1e3a5f]" />
          <h3 className="text-lg font-bold text-gray-900">Products Being Sold</h3>
          <span className="ml-auto text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full">
            {products.length} listing{products.length !== 1 ? "s" : ""}
          </span>
        </div>

        {products.length === 0 ? (
          <div className="bg-gray-50 rounded-xl p-8 text-center border border-dashed border-gray-300">
            <Package className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">No products uploaded yet. Use the Upload tab to add listings.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-[#1e3a5f] text-white">
                  <th className="px-4 py-3 text-left font-semibold">#</th>
                  <th className="px-4 py-3 text-left font-semibold">Product Name</th>
                  <th className="px-4 py-3 text-left font-semibold">Category</th>
                  <th className="px-4 py-3 text-right font-semibold">Unit Price</th>
                  <th className="px-4 py-3 text-center font-semibold">Status</th>
                  <th className="px-4 py-3 text-left font-semibold">Description</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p, i) => (
                  <tr
                    key={p.id}
                    className={`border-b border-gray-100 hover:bg-blue-50/40 transition-colors ${i % 2 === 0 ? "bg-[#f0f4f8]" : "bg-white"}`}
                  >
                    <td className="px-4 py-3 text-gray-500 font-mono">{i + 1}</td>
                    <td className="px-4 py-3 font-semibold text-[#1e3a5f]">{p.title}</td>
                    <td className="px-4 py-3">
                      <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full capitalize">
                        {p.subcategory?.replace("-", " ") ?? "Industry"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-gray-800">
                      {p.price != null ? usd(p.price) : <span className="text-gray-400 font-normal">—</span>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.available ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                        {p.available ? "Available" : "Unavailable"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs max-w-xs truncate">
                      {p.description || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
