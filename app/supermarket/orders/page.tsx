"use client";

import { useState, useEffect, useRef } from "react";
import { getOrdersForMyIndustryProducts } from "@/app/actions/order";
import SupermarketNavbar from "@/components/SupermarketNavbar";
import Header from "@/components/Header";
import Link from "next/link";
import { ShoppingBag, ArrowLeft, Save, Trash2, ChevronDown, Loader2, CheckCircle2, Download } from "lucide-react";

type Order = Awaited<ReturnType<typeof getOrdersForMyIndustryProducts>>[number];

const ORDER_STATUSES = ["pending", "confirmed", "preparing", "out_for_delivery", "delivered", "cancelled"];
const PAYMENT_STATUSES = ["pending", "paid", "verified", "failed"];

const STATUS_COLORS: Record<string, string> = {
  pending:          "bg-yellow-100 text-yellow-700 border-yellow-200",
  confirmed:        "bg-blue-100 text-blue-700 border-blue-200",
  preparing:        "bg-purple-100 text-purple-700 border-purple-200",
  out_for_delivery: "bg-orange-100 text-orange-700 border-orange-200",
  delivered:        "bg-green-100 text-green-700 border-green-200",
  cancelled:        "bg-red-100 text-red-700 border-red-200",
};

const PAYMENT_COLORS: Record<string, string> = {
  pending:  "bg-yellow-100 text-yellow-700 border-yellow-200",
  paid:     "bg-green-100 text-green-700 border-green-200",
  verified: "bg-cyan-100 text-[#0097A7] border-emerald-200",
  failed:   "bg-red-100 text-red-700 border-red-200",
};

async function updateOrder(orderId: string, data: Record<string, unknown>) {
  const res = await fetch("/api/orders", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ orderId, ...data }),
  });
  return res.json();
}

export default function SupermarketOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [savingStatus, setSavingStatus] = useState<Record<string, boolean>>({});
  const [savingPayment, setSavingPayment] = useState<Record<string, boolean>>({});
  const [textEdits, setTextEdits] = useState<Record<string, { deliveryPersonName?: string; deliveryAddress?: string }>>({});
  const [savingText, setSavingText] = useState<Record<string, boolean>>({});
  const [savedFlash, setSavedFlash] = useState<Record<string, boolean>>({});
  const flashTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const [deleting, setDeleting] = useState<Record<string, boolean>>({});
  const [downloading, setDownloading] = useState(false);

  const statuses = ["all", ...ORDER_STATUSES];
  const filtered = filter === "all" ? orders : orders.filter((o) => o.status === filter);

  const totalRevenue = orders
    .filter((o) => o.status !== "cancelled")
    .reduce((s, o) => s + o.productPrice * o.quantity, 0);

  useEffect(() => {
    getOrdersForMyIndustryProducts()
      .then((data) => setOrders(data as Order[]))
      .finally(() => setLoading(false));
  }, []);

  const flashSaved = (orderId: string) => {
    if (flashTimers.current[orderId]) clearTimeout(flashTimers.current[orderId]);
    setSavedFlash((p) => ({ ...p, [orderId]: true }));
    flashTimers.current[orderId] = setTimeout(() => {
      setSavedFlash((p) => ({ ...p, [orderId]: false }));
    }, 1800);
  };

  const handleStatusChange = async (order: Order, newStatus: string) => {
    const prev = order.status;
    setOrders((p) => p.map((o) => o.id === order.id ? { ...o, status: newStatus } : o));
    setSavingStatus((p) => ({ ...p, [order.id]: true }));
    try {
      const data = await updateOrder(order.id, { status: newStatus });
      if (data.success) flashSaved(order.id);
      else { setOrders((p) => p.map((o) => o.id === order.id ? { ...o, status: prev } : o)); alert(data.message || "Failed"); }
    } catch { setOrders((p) => p.map((o) => o.id === order.id ? { ...o, status: prev } : o)); alert("Network error."); }
    finally { setSavingStatus((p) => ({ ...p, [order.id]: false })); }
  };

  const handlePaymentChange = async (order: Order, newPayment: string) => {
    const prev = (order as any).paymentStatus ?? "pending";
    setOrders((p) => p.map((o) => o.id === order.id ? { ...o, paymentStatus: newPayment } : o));
    setSavingPayment((p) => ({ ...p, [order.id]: true }));
    try {
      const data = await updateOrder(order.id, { paymentStatus: newPayment });
      if (data.success) flashSaved(order.id);
      else { setOrders((p) => p.map((o) => o.id === order.id ? { ...o, paymentStatus: prev } : o)); alert(data.message || "Failed"); }
    } catch { setOrders((p) => p.map((o) => o.id === order.id ? { ...o, paymentStatus: prev } : o)); alert("Network error."); }
    finally { setSavingPayment((p) => ({ ...p, [order.id]: false })); }
  };

  const getTextEdit = (order: Order, field: "deliveryPersonName" | "deliveryAddress") =>
    textEdits[order.id]?.[field] ?? ((order as any)[field] ?? "");

  const setTextEdit = (orderId: string, field: "deliveryPersonName" | "deliveryAddress", value: string) =>
    setTextEdits((prev) => ({ ...prev, [orderId]: { ...prev[orderId], [field]: value } }));

  const isTextDirty = (order: Order) => {
    const e = textEdits[order.id];
    if (!e) return false;
    return (
      ("deliveryPersonName" in e && e.deliveryPersonName !== ((order as any).deliveryPersonName ?? "")) ||
      ("deliveryAddress" in e && e.deliveryAddress !== ((order as any).deliveryAddress ?? ""))
    );
  };

  const handleSaveText = async (order: Order) => {
    const e = textEdits[order.id];
    if (!e || Object.keys(e).length === 0) return;
    setSavingText((p) => ({ ...p, [order.id]: true }));
    try {
      const data = await updateOrder(order.id, e);
      if (data.success) {
        setOrders((p) => p.map((o) => o.id === order.id ? { ...o, ...e } : o));
        setTextEdits((p) => { const n = { ...p }; delete n[order.id]; return n; });
        flashSaved(order.id);
      } else alert(data.message || "Failed");
    } catch { alert("Network error."); }
    finally { setSavingText((p) => ({ ...p, [order.id]: false })); }
  };

  const handleDelete = async (orderId: string) => {
    if (!confirm("Delete this order? This cannot be undone.")) return;
    setDeleting((d) => ({ ...d, [orderId]: true }));
    try {
      const res = await fetch("/api/orders", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderId }) });
      const data = await res.json();
      if (data.success) setOrders((p) => p.filter((o) => o.id !== orderId));
      else alert(data.message || "Failed");
    } catch { alert("Network error."); }
    finally { setDeleting((d) => ({ ...d, [orderId]: false })); }
  };

  const downloadReport = async () => {
    if (!filtered.length) return;
    setDownloading(true);
    try {
      const { default: jsPDF } = await import("jspdf");
      const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      const PW = 297, PH = 210, M = 10;
      const usableW = PW - 2 * M;
      const ROW_H = 8;
      const green: [number, number, number] = [6, 78, 59];
      const white: [number, number, number] = [255, 255, 255];
      const light: [number, number, number] = [240, 253, 244];
      const trunc = (s: string | null | undefined, max: number) => { const str = s ?? "—"; return str.length > max ? str.slice(0, max - 1) + "…" : str || "—"; };
      const cols = [
        { header: "#", width: 7 }, { header: "Product", width: 30 }, { header: "Customer", width: 30 },
        { header: "Phone", width: 18 }, { header: "Delivery Person", width: 25 }, { header: "Delivery Address", width: 32 },
        { header: "Unit Price", width: 20 }, { header: "Qty", width: 8 }, { header: "Total", width: 22 },
        { header: "Order Status", width: 22 }, { header: "Payment", width: 18 }, { header: "Pay Method", width: 20 }, { header: "Date", width: 19 },
      ];
      const drawHeader = (y: number) => {
        pdf.setFillColor(...green); pdf.rect(M, y, usableW, ROW_H, "F");
        pdf.setTextColor(...white); pdf.setFontSize(6.5); pdf.setFont("helvetica", "bold");
        let x = M + 1.5;
        cols.forEach((c) => { pdf.text(c.header, x, y + ROW_H - 2); x += c.width; });
      };
      pdf.setFillColor(...green); pdf.rect(0, 0, PW, 18, "F");
      pdf.setTextColor(...white); pdf.setFontSize(13); pdf.setFont("helvetica", "bold");
      pdf.text("Supermarket Customer Orders Report", M, 12);
      let y = 24; drawHeader(y); y += ROW_H;
      pdf.setFont("helvetica", "normal"); pdf.setFontSize(6);
      filtered.forEach((order, i) => {
        if (y + ROW_H > PH - 12) { pdf.addPage(); y = 10; drawHeader(y); y += ROW_H; pdf.setFont("helvetica", "normal"); pdf.setFontSize(6); }
        if (i % 2 === 0) { pdf.setFillColor(...light); pdf.rect(M, y, usableW, ROW_H, "F"); }
        pdf.setTextColor(20, 20, 20);
        const cells = [
          String(i + 1), trunc(order.productTitle, 22), trunc(order.userName, 20),
          trunc((order as any).customerPhone, 16), trunc((order as any).deliveryPersonName, 20), trunc((order as any).deliveryAddress, 26),
          `RWF ${order.productPrice.toLocaleString()}`, String(order.quantity), `RWF ${(order.productPrice * order.quantity).toLocaleString()}`,
          (order.status ?? "—").replace(/_/g, " "), (order as any).paymentStatus ?? "pending",
          { cash: "Cash", mobile_money: "Mobile Money", card: "Card" }[(order as any).paymentMethod as string] ?? (order as any).paymentMethod ?? "—",
          new Date(order.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        ];
        let x = M + 1.5;
        cells.forEach((cell, ci) => { pdf.text(cell, x, y + ROW_H - 2); x += cols[ci].width; });
        y += ROW_H;
      });
      pdf.save(`supermarket-orders-${new Date().toISOString().split("T")[0]}.pdf`);
    } finally { setDownloading(false); }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <SupermarketNavbar />

      <div className="relative overflow-hidden bg-gradient-to-r from-[#023E4A] to-[#0097A7] text-white">
        <div className="absolute inset-0 bg-black/10" />
        <div className="relative max-w-7xl mx-auto px-4 pt-28 pb-16 sm:px-6 lg:px-8">
          <Link href="/supermarket/dashboard" className="inline-flex items-center gap-1.5 text-white/70 hover:text-white text-sm mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center shrink-0">
              <ShoppingBag className="w-8 h-8 text-white" />
            </div>
            <div>
              <p className="text-white/70 text-sm font-medium uppercase tracking-wide">Supermarket Management</p>
              <h1 className="text-3xl font-bold">Customer Orders</h1>
              <p className="mt-1 text-white/80">Change status and payment directly — saves automatically</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 flex-1">
            {[
              { label: "Total Orders",  value: orders.length,                                         color: "bg-[#023E4A] text-white" },
              { label: "Pending",       value: orders.filter((o) => o.status === "pending").length,   color: "bg-yellow-500 text-white" },
              { label: "Delivered",     value: orders.filter((o) => o.status === "delivered").length, color: "bg-green-600 text-white" },
              { label: "Total Revenue", value: "RWF " + totalRevenue.toLocaleString(),                color: "bg-[#0097A7] text-white" },
            ].map(({ label, value, color }) => (
              <div key={label} className={`rounded-xl p-4 shadow ${color}`}>
                <p className="text-xs font-medium opacity-75">{label}</p>
                <p className="text-2xl font-black mt-1">{value}</p>
              </div>
            ))}
          </div>
          <button
            onClick={downloadReport}
            disabled={downloading || orders.length === 0}
            className="flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl bg-[#023E4A] text-white hover:bg-[#012830] transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
          >
            <Download className="w-4 h-4" />
            {downloading ? "Generating…" : "Download Report"}
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {statuses.map((s) => (
            <button key={s} onClick={() => setFilter(s)}
              className={`text-xs px-3 py-1.5 rounded-full font-semibold border transition-colors capitalize ${
                filter === s ? "bg-[#023E4A] text-white border-emerald-800" : "bg-white text-gray-600 border-gray-200 hover:border-[#06B6D4]"
              }`}>
              {s.replace(/_/g, " ")}
              {s !== "all" && <span className="ml-1 opacity-60">({orders.filter((o) => o.status === s).length})</span>}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center">
            <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No orders found</p>
            <p className="text-gray-400 text-sm mt-1">
              {filter === "all" ? "Orders placed for your products will appear here." : `No orders with status "${filter.replace(/_/g, " ")}".`}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-[#023E4A] text-white">
                  {["#","Product","Customer","Phone","Delivery Person","Delivery Address","Unit Price","Qty","Total","Order Status","Payment","Pay Method","Date","Actions"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-semibold whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((order, i) => {
                  const currentStatus = order.status;
                  const currentPayment = (order as any).paymentStatus ?? "pending";
                  const textDirty = isTextDirty(order);
                  const flashed = savedFlash[order.id];
                  return (
                    <tr key={order.id} className={`border-b border-gray-100 transition-colors ${flashed ? "bg-green-50/60" : i % 2 === 0 ? "bg-white" : "bg-cyan-50/30"} hover:bg-cyan-50/20`}>
                      <td className="px-4 py-3 text-gray-400 font-mono text-xs">{i + 1}</td>
                      <td className="px-4 py-3 font-semibold text-emerald-800 max-w-[140px] truncate">{order.productTitle}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-800 leading-tight">{order.userName}</p>
                        <p className="text-xs text-gray-400">{order.userEmail}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-xs whitespace-nowrap">{order.customerPhone || <span className="text-gray-300">—</span>}</td>
                      <td className="px-4 py-3 min-w-[140px]">
                        <input type="text" value={getTextEdit(order, "deliveryPersonName")} onChange={(e) => setTextEdit(order.id, "deliveryPersonName", e.target.value)} placeholder="—"
                          className="w-full text-xs px-2 py-1.5 border border-gray-200 rounded-lg outline-none focus:border-[#06B6D4] bg-white" />
                      </td>
                      <td className="px-4 py-3 min-w-[160px]">
                        <input type="text" value={getTextEdit(order, "deliveryAddress")} onChange={(e) => setTextEdit(order.id, "deliveryAddress", e.target.value)} placeholder="—"
                          className="w-full text-xs px-2 py-1.5 border border-gray-200 rounded-lg outline-none focus:border-[#06B6D4] bg-white" />
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-gray-700 whitespace-nowrap">RWF {order.productPrice.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right font-bold text-gray-800">{order.quantity}</td>
                      <td className="px-4 py-3 text-right font-bold font-mono text-emerald-800 whitespace-nowrap">RWF {(order.productPrice * order.quantity).toLocaleString()}</td>
                      <td className="px-4 py-3 text-center min-w-[160px]">
                        <div className="relative inline-flex items-center w-full">
                          {savingStatus[order.id] ? (
                            <div className="flex items-center justify-center w-full gap-1.5 text-xs text-gray-500 py-1.5"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving…</div>
                          ) : (
                            <>
                              <select value={currentStatus} onChange={(e) => handleStatusChange(order, e.target.value)}
                                className={`w-full appearance-none text-xs font-semibold px-2.5 py-1.5 pr-6 rounded-full border cursor-pointer outline-none ${STATUS_COLORS[currentStatus] ?? "bg-gray-100 text-gray-600 border-gray-200"}`}>
                                {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
                              </select>
                              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none opacity-50" />
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center min-w-[130px]">
                        <div className="relative inline-flex items-center w-full">
                          {savingPayment[order.id] ? (
                            <div className="flex items-center justify-center w-full gap-1.5 text-xs text-gray-500 py-1.5"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving…</div>
                          ) : (
                            <>
                              <select value={currentPayment} onChange={(e) => handlePaymentChange(order, e.target.value)}
                                className={`w-full appearance-none text-xs font-semibold px-2.5 py-1.5 pr-6 rounded-full border cursor-pointer outline-none ${PAYMENT_COLORS[currentPayment] ?? "bg-gray-100 text-gray-600 border-gray-200"}`}>
                                {PAYMENT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                              </select>
                              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none opacity-50" />
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {(() => {
                          const method = (order as any).paymentMethod;
                          if (!method) return <span className="text-gray-300 text-xs">—</span>;
                          const labels: Record<string, string> = { cash: "Cash", mobile_money: "Mobile Money", card: "Card" };
                          const colors: Record<string, string> = { cash: "bg-teal-100 text-teal-700 border-teal-200", mobile_money: "bg-amber-100 text-amber-700 border-amber-200", card: "bg-blue-100 text-blue-700 border-blue-200" };
                          return <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full border whitespace-nowrap ${colors[method] ?? "bg-gray-100 text-gray-600 border-gray-200"}`}>{labels[method] ?? method}</span>;
                        })()}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{new Date(order.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1.5">
                          {flashed ? (
                            <span className="flex items-center gap-1 text-xs text-green-600 font-semibold px-2 py-1.5"><CheckCircle2 className="w-3.5 h-3.5" /> Saved</span>
                          ) : (
                            <button onClick={() => handleSaveText(order)} disabled={!textDirty || savingText[order.id]}
                              className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors ${textDirty && !savingText[order.id] ? "bg-[#023E4A] text-white hover:bg-[#012830]" : "bg-gray-100 text-gray-400 cursor-not-allowed"}`}>
                              {savingText[order.id] ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} Save
                            </button>
                          )}
                          <button onClick={() => handleDelete(order.id)} disabled={deleting[order.id]}
                            className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors disabled:opacity-40">
                            {deleting[order.id] ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
