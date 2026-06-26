"use client";

import { useState, useEffect, useRef } from "react";
import { getOrdersForMyIndustryProducts, getMyProductsForSale } from "@/app/actions/order";
import IndustryNavbar from "@/components/IndustryNavbar";
import Header from "@/components/Header";
import Link from "next/link";
import { ShoppingBag, ArrowLeft, Save, Trash2, ChevronDown, Loader2, CheckCircle2, Download, Plus, X, Receipt } from "lucide-react";

type Order = Awaited<ReturnType<typeof getOrdersForMyIndustryProducts>>[number];
type SaleProduct = Awaited<ReturnType<typeof getMyProductsForSale>>[number];

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

async function updateOrder(orderId: string, data: Record<string, any>) {
  const res = await fetch("/api/orders", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ orderId, ...data }),
  });
  return res.json();
}

export default function IndustryOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  // Per-row saving spinners for dropdowns
  const [savingStatus, setSavingStatus] = useState<Record<string, boolean>>({});
  const [savingPayment, setSavingPayment] = useState<Record<string, boolean>>({});

  // Per-row text field edits (delivery person + address)
  const [textEdits, setTextEdits] = useState<Record<string, { deliveryPersonName?: string; deliveryAddress?: string }>>({});
  const [savingText, setSavingText] = useState<Record<string, boolean>>({});

  // Brief "saved" flash per row
  const [savedFlash, setSavedFlash] = useState<Record<string, boolean>>({});
  const flashTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const [deleting, setDeleting] = useState<Record<string, boolean>>({});
  const [downloading, setDownloading] = useState(false);

  // ── Manual sale recording ──────────────────────────────────────────
  const [showManualModal, setShowManualModal] = useState(false);
  const [myProducts, setMyProducts] = useState<SaleProduct[]>([]);
  const [savingManual, setSavingManual] = useState(false);
  const emptyManual = {
    productId: "",
    unitPrice: "",
    quantity: "1",
    customerName: "",
    customerPhone: "",
    paymentMethod: "cash",
    paymentStatus: "paid",
    status: "delivered",
  };
  const [manual, setManual] = useState({ ...emptyManual });

  const openManualModal = () => {
    setManual({ ...emptyManual });
    setShowManualModal(true);
    if (myProducts.length === 0) {
      getMyProductsForSale().then((data) => setMyProducts(data as SaleProduct[]));
    }
  };

  const selectManualProduct = (productId: string) => {
    const p = myProducts.find((mp) => mp.id === productId);
    setManual((m) => ({
      ...m,
      productId,
      unitPrice: p && p.price ? String(p.price) : m.unitPrice,
    }));
  };

  const manualTotal =
    (parseFloat(manual.unitPrice) || 0) * (parseInt(manual.quantity) || 0);

  const handleRecordManualSale = async () => {
    const product = myProducts.find((p) => p.id === manual.productId);
    if (!product) {
      alert("Please select a product.");
      return;
    }
    if (!manual.customerName.trim()) {
      alert("Please enter the customer name.");
      return;
    }
    const unitPrice = parseFloat(manual.unitPrice);
    const quantity = parseInt(manual.quantity);
    if (!unitPrice || unitPrice <= 0) {
      alert("Please enter a valid unit price.");
      return;
    }
    if (!quantity || quantity <= 0) {
      alert("Please enter a valid quantity.");
      return;
    }

    setSavingManual(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          productTitle: product.title,
          productPrice: unitPrice,
          quantity,
          userName: manual.customerName.trim(),
          customerPhone: manual.customerPhone.trim() || undefined,
          paymentMethod: manual.paymentMethod,
          paymentStatus: manual.paymentStatus,
          status: manual.status,
          fulfillmentMethod: "pickup",
          saleChannel: "manual",
          category: product.category,
          subcategory: product.subcategory ?? undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowManualModal(false);
        // Reload orders so the new manual sale appears
        const fresh = await getOrdersForMyIndustryProducts();
        setOrders(fresh as Order[]);
      } else {
        alert(data.message || "Failed to record the sale.");
      }
    } catch {
      alert("Network error. Please try again.");
    } finally {
      setSavingManual(false);
    }
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
      const navy: [number,number,number] = [30, 58, 95];
      const white: [number,number,number] = [255, 255, 255];
      const light: [number,number,number] = [248, 250, 252];

      const trunc = (s: string | null | undefined, max: number) => {
        const str = s ?? "—";
        return str.length > max ? str.slice(0, max - 1) + "…" : str || "—";
      };

      const cols: { header: string; width: number }[] = [
        { header: "#",               width: 7  },
        { header: "Product",         width: 26 },
        { header: "Source",          width: 16 },
        { header: "Customer",        width: 26 },
        { header: "Phone",           width: 18 },
        { header: "Delivery Person", width: 25 },
        { header: "Delivery Address",width: 26 },
        { header: "Unit Price",      width: 20 },
        { header: "Qty",             width: 8  },
        { header: "Total",           width: 22 },
        { header: "Order Status",    width: 22 },
        { header: "Payment",         width: 18 },
        { header: "Pay Method",      width: 20 },
        { header: "Date",            width: 19 },
      ];

      const PAY_LABELS: Record<string,string> = {
        cash: "Cash", mobile_money: "Mobile Money", card: "Card",
      };

      const drawHeader = (y: number) => {
        pdf.setFillColor(...navy);
        pdf.rect(M, y, usableW, ROW_H, "F");
        pdf.setTextColor(...white);
        pdf.setFontSize(6.5);
        pdf.setFont("helvetica", "bold");
        let x = M + 1.5;
        cols.forEach(c => { pdf.text(c.header, x, y + ROW_H - 2); x += c.width; });
      };

      // Page header
      pdf.setFillColor(...navy);
      pdf.rect(0, 0, PW, 18, "F");
      pdf.setTextColor(...white);
      pdf.setFontSize(13);
      pdf.setFont("helvetica", "bold");
      pdf.text("Customer Orders Report", M, 12);
      pdf.setFontSize(7.5);
      pdf.setFont("helvetica", "normal");
      const filterLabel = filter === "all" ? "All orders" : `Status: ${filter.replace(/_/g, " ")}`;
      pdf.text(
        `${filterLabel}  |  ${filtered.length} record${filtered.length !== 1 ? "s" : ""}  |  Generated: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`,
        PW - M, 12, { align: "right" }
      );

      let y = 24;
      drawHeader(y);
      y += ROW_H;

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(6);

      filtered.forEach((order, i) => {
        // Page break
        if (y + ROW_H > PH - 12) {
          pdf.addPage();
          y = 10;
          drawHeader(y);
          y += ROW_H;
          pdf.setFont("helvetica", "normal");
          pdf.setFontSize(6);
        }

        if (i % 2 === 0) {
          pdf.setFillColor(...light);
          pdf.rect(M, y, usableW, ROW_H, "F");
        }

        pdf.setTextColor(20, 20, 20);

        const cells = [
          String(i + 1),
          trunc(order.productTitle, 18),
          (order as any).saleChannel === "manual" ? "Manual" : "Online",
          trunc(order.userName, 18),
          trunc((order as any).customerPhone, 16),
          trunc((order as any).deliveryPersonName, 20),
          trunc((order as any).deliveryAddress, 26),
          `RWF ${order.productPrice.toLocaleString()}`,
          String(order.quantity),
          `RWF ${(order.productPrice * order.quantity).toLocaleString()}`,
          (order.status ?? "—").replace(/_/g, " "),
          (order as any).paymentStatus ?? "pending",
          PAY_LABELS[(order as any).paymentMethod] ?? (order as any).paymentMethod ?? "—",
          new Date(order.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        ];

        let x = M + 1.5;
        cells.forEach((cell, ci) => {
          pdf.text(cell, x, y + ROW_H - 2);
          x += cols[ci].width;
        });

        y += ROW_H;
      });

      // Totals row
      if (y + ROW_H <= PH - 12) {
        const totalRev = filtered
          .filter(o => o.status !== "cancelled")
          .reduce((s, o) => s + o.productPrice * o.quantity, 0);
        pdf.setFillColor(...navy);
        pdf.rect(M, y, usableW, ROW_H, "F");
        pdf.setTextColor(...white);
        pdf.setFontSize(7);
        pdf.setFont("helvetica", "bold");
        pdf.text("TOTAL REVENUE (excl. cancelled)", M + 1.5, y + ROW_H - 2);
        pdf.text(`RWF ${totalRev.toLocaleString()}`, M + usableW - 2, y + ROW_H - 2, { align: "right" });
        y += ROW_H;
      }

      // Footer
      pdf.setFontSize(7);
      pdf.setTextColor(160, 160, 160);
      pdf.setFont("helvetica", "normal");
      pdf.text("Vertex Industry Management System", M, PH - 4);

      pdf.save(`orders-report-${new Date().toISOString().split("T")[0]}.pdf`);
    } finally {
      setDownloading(false);
    }
  };

  useEffect(() => {
    getOrdersForMyIndustryProducts()
      .then((data) => setOrders(data as Order[]))
      .finally(() => setLoading(false));
  }, []);

  const statuses = ["all", ...ORDER_STATUSES];
  const filtered = filter === "all" ? orders : orders.filter((o) => o.status === filter);

  const totalRevenue = orders
    .filter((o) => o.status !== "cancelled")
    .reduce((s, o) => s + o.productPrice * o.quantity, 0);

  const flashSaved = (orderId: string) => {
    if (flashTimers.current[orderId]) clearTimeout(flashTimers.current[orderId]);
    setSavedFlash((p) => ({ ...p, [orderId]: true }));
    flashTimers.current[orderId] = setTimeout(() => {
      setSavedFlash((p) => ({ ...p, [orderId]: false }));
    }, 1800);
  };

  // ── Auto-save order status on dropdown change ──────────────────────
  const handleStatusChange = async (order: Order, newStatus: string) => {
    const prevStatus = order.status;
    // Optimistic update
    setOrders((prev) => prev.map((o) => o.id === order.id ? { ...o, status: newStatus } : o));
    setSavingStatus((p) => ({ ...p, [order.id]: true }));
    try {
      const data = await updateOrder(order.id, { status: newStatus });
      if (data.success) {
        flashSaved(order.id);
      } else {
        // Revert
        setOrders((prev) => prev.map((o) => o.id === order.id ? { ...o, status: prevStatus } : o));
        alert(data.message || "Failed to update order status.");
      }
    } catch {
      setOrders((prev) => prev.map((o) => o.id === order.id ? { ...o, status: prevStatus } : o));
      alert("Network error. Please try again.");
    } finally {
      setSavingStatus((p) => ({ ...p, [order.id]: false }));
    }
  };

  // ── Auto-save payment status on dropdown change ────────────────────
  const handlePaymentChange = async (order: Order, newPayment: string) => {
    const prevPayment = (order as any).paymentStatus ?? "pending";
    setOrders((prev) => prev.map((o) => o.id === order.id ? { ...o, paymentStatus: newPayment } : o));
    setSavingPayment((p) => ({ ...p, [order.id]: true }));
    try {
      const data = await updateOrder(order.id, { paymentStatus: newPayment });
      if (data.success) {
        flashSaved(order.id);
      } else {
        setOrders((prev) => prev.map((o) => o.id === order.id ? { ...o, paymentStatus: prevPayment } : o));
        alert(data.message || "Failed to update payment status.");
      }
    } catch {
      setOrders((prev) => prev.map((o) => o.id === order.id ? { ...o, paymentStatus: prevPayment } : o));
      alert("Network error. Please try again.");
    } finally {
      setSavingPayment((p) => ({ ...p, [order.id]: false }));
    }
  };

  // ── Text field helpers ─────────────────────────────────────────────
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
        setOrders((prev) =>
          prev.map((o) => o.id === order.id ? { ...o, ...e } : o)
        );
        setTextEdits((prev) => { const n = { ...prev }; delete n[order.id]; return n; });
        flashSaved(order.id);
      } else {
        alert(data.message || "Failed to save changes.");
      }
    } catch {
      alert("Network error. Please try again.");
    } finally {
      setSavingText((p) => ({ ...p, [order.id]: false }));
    }
  };

  // ── Delete ─────────────────────────────────────────────────────────
  const handleDelete = async (orderId: string) => {
    if (!confirm("Delete this order? This cannot be undone.")) return;
    setDeleting((d) => ({ ...d, [orderId]: true }));
    try {
      const res = await fetch("/api/orders", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
      const data = await res.json();
      if (data.success) {
        setOrders((prev) => prev.filter((o) => o.id !== orderId));
      } else {
        alert(data.message || "Failed to delete order.");
      }
    } catch {
      alert("Network error. Please try again.");
    } finally {
      setDeleting((d) => ({ ...d, [orderId]: false }));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <IndustryNavbar />

      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#023E4A] to-[#0097A7] text-white">
        <div className="absolute inset-0 bg-black/10" />
        <div className="relative max-w-7xl mx-auto px-4 pt-28 pb-16 sm:px-6 lg:px-8">
          <Link
            href="/industry/dashboard"
            className="inline-flex items-center gap-1.5 text-white/70 hover:text-white text-sm mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center shrink-0">
              <ShoppingBag className="w-8 h-8 text-white" />
            </div>
            <div>
              <p className="text-white/70 text-sm font-medium uppercase tracking-wide">Stock Management</p>
              <h1 className="text-3xl font-bold">Customer Orders</h1>
              <p className="mt-1 text-white/80">
                Change status and payment directly — saves automatically
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-6">

        {/* Summary cards */}
        <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 flex-1">
          {[
            { label: "Total Orders",  value: orders.length,                                         color: "bg-[#1e3a5f] text-white" },
            { label: "Pending",       value: orders.filter((o) => o.status === "pending").length,   color: "bg-yellow-500 text-white" },
            { label: "Delivered",     value: orders.filter((o) => o.status === "delivered").length, color: "bg-green-600 text-white" },
            { label: "Total Revenue", value: "RWF " + totalRevenue.toLocaleString(),                color: "bg-[#023E4A] text-white" },
          ].map(({ label, value, color }) => (
            <div key={label} className={`rounded-xl p-4 shadow ${color}`}>
              <p className="text-xs font-medium opacity-75">{label}</p>
              <p className="text-2xl font-black mt-1">{value}</p>
            </div>
          ))}
        </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/industry/transactions"
              className="flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl bg-white text-[#023E4A] border border-[#0097A7]/40 hover:bg-[#0097A7]/10 transition-colors"
            >
              <Receipt className="w-4 h-4" />
              Transactions
            </Link>
            <button
              onClick={openManualModal}
              className="flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl bg-[#0097A7] text-white hover:bg-[#007e8c] transition-colors"
            >
              <Plus className="w-4 h-4" />
              Record Manual Sale
            </button>
            <button
              onClick={downloadReport}
              disabled={downloading || orders.length === 0}
              className="flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl bg-[#1e3a5f] text-white hover:bg-[#16304f] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              {downloading ? "Generating…" : "Download Report"}
            </button>
          </div>
        </div>

        {/* Status filter tabs */}
        <div className="flex flex-wrap gap-2">
          {statuses.map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`text-xs px-3 py-1.5 rounded-full font-semibold border transition-colors capitalize ${
                filter === s
                  ? "bg-[#1e3a5f] text-white border-[#1e3a5f]"
                  : "bg-white text-gray-600 border-gray-200 hover:border-[#06B6D4]"
              }`}
            >
              {s.replace(/_/g, " ")}
              {s !== "all" && (
                <span className="ml-1 opacity-60">
                  ({orders.filter((o) => o.status === s).length})
                </span>
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-slate-600" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center">
            <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No orders found</p>
            <p className="text-gray-400 text-sm mt-1">
              {filter === "all"
                ? "Orders placed for your products will appear here."
                : `No orders with status "${filter.replace(/_/g, " ")}".`}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-[#1e3a5f] text-white">
                  <th className="px-4 py-3 text-left font-semibold">#</th>
                  <th className="px-4 py-3 text-left font-semibold">Product</th>
                  <th className="px-4 py-3 text-center font-semibold">Source</th>
                  <th className="px-4 py-3 text-left font-semibold">Customer</th>
                  <th className="px-4 py-3 text-left font-semibold">Phone</th>
                  <th className="px-4 py-3 text-left font-semibold">Delivery Person</th>
                  <th className="px-4 py-3 text-left font-semibold">Delivery Address</th>
                  <th className="px-4 py-3 text-right font-semibold">Unit Price</th>
                  <th className="px-4 py-3 text-right font-semibold">Qty</th>
                  <th className="px-4 py-3 text-right font-semibold">Total</th>
                  <th className="px-4 py-3 text-center font-semibold">Order Status</th>
                  <th className="px-4 py-3 text-center font-semibold">Payment</th>
                  <th className="px-4 py-3 text-center font-semibold whitespace-nowrap">Pay Method</th>
                  <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Date</th>
                  <th className="px-4 py-3 text-center font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((order, i) => {
                  const currentStatus = order.status;
                  const currentPayment = (order as any).paymentStatus ?? "pending";
                  const textDirty = isTextDirty(order);
                  const isSavingText = savingText[order.id];
                  const isDeleting = deleting[order.id];
                  const flashed = savedFlash[order.id];

                  return (
                    <tr
                      key={order.id}
                      className={`border-b border-gray-100 transition-colors ${
                        flashed ? "bg-green-50/60" : i % 2 === 0 ? "bg-white" : "bg-[#f8fafc]"
                      } hover:bg-blue-50/20`}
                    >
                      <td className="px-4 py-3 text-gray-400 font-mono text-xs">{i + 1}</td>

                      <td className="px-4 py-3 font-semibold text-[#1e3a5f] max-w-[140px] truncate">
                        {order.productTitle}
                      </td>

                      {/* Sale source — manual (sold in person) vs online (placed on site) */}
                      <td className="px-4 py-3 text-center">
                        {(() => {
                          const isManual = (order as any).saleChannel === "manual";
                          return (
                            <span
                              className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full border whitespace-nowrap ${
                                isManual
                                  ? "bg-purple-100 text-purple-700 border-purple-200"
                                  : "bg-sky-100 text-sky-700 border-sky-200"
                              }`}
                            >
                              {isManual ? "Manual" : "Online"}
                            </span>
                          );
                        })()}
                      </td>

                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-800 leading-tight">{order.userName}</p>
                        <p className="text-xs text-gray-400 leading-tight">{order.userEmail}</p>
                      </td>

                      <td className="px-4 py-3 text-gray-600 text-xs whitespace-nowrap">
                        {order.customerPhone || <span className="text-gray-300">—</span>}
                      </td>

                      {/* Delivery person — text edit */}
                      <td className="px-4 py-3 min-w-[140px]">
                        <input
                          type="text"
                          value={getTextEdit(order, "deliveryPersonName")}
                          onChange={(e) => setTextEdit(order.id, "deliveryPersonName", e.target.value)}
                          placeholder="—"
                          className="w-full text-xs px-2 py-1.5 border border-gray-200 rounded-lg outline-none focus:border-[#06B6D4] focus:ring-1 focus:ring-slate-200 bg-white"
                        />
                      </td>

                      {/* Delivery address — text edit */}
                      <td className="px-4 py-3 min-w-[160px]">
                        <input
                          type="text"
                          value={getTextEdit(order, "deliveryAddress")}
                          onChange={(e) => setTextEdit(order.id, "deliveryAddress", e.target.value)}
                          placeholder="—"
                          className="w-full text-xs px-2 py-1.5 border border-gray-200 rounded-lg outline-none focus:border-[#06B6D4] focus:ring-1 focus:ring-slate-200 bg-white"
                        />
                      </td>

                      <td className="px-4 py-3 text-right font-mono text-gray-700 whitespace-nowrap">
                        RWF {order.productPrice.toLocaleString()}
                      </td>

                      <td className="px-4 py-3 text-right font-bold text-gray-800">
                        {order.quantity}
                      </td>

                      <td className="px-4 py-3 text-right font-bold font-mono text-[#1e3a5f] whitespace-nowrap">
                        RWF {(order.productPrice * order.quantity).toLocaleString()}
                      </td>

                      {/* Order status — auto-saves on change */}
                      <td className="px-4 py-3 text-center min-w-[160px]">
                        <div className="relative inline-flex items-center w-full">
                          {savingStatus[order.id] ? (
                            <div className="flex items-center justify-center w-full gap-1.5 text-xs text-gray-500 py-1.5">
                              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving…
                            </div>
                          ) : (
                            <>
                              <select
                                value={currentStatus}
                                onChange={(e) => handleStatusChange(order, e.target.value)}
                                className={`w-full appearance-none text-xs font-semibold px-2.5 py-1.5 pr-6 rounded-full border cursor-pointer outline-none transition-colors ${
                                  STATUS_COLORS[currentStatus] ?? "bg-gray-100 text-gray-600 border-gray-200"
                                }`}
                              >
                                {ORDER_STATUSES.map((s) => (
                                  <option key={s} value={s}>
                                    {s.replace(/_/g, " ")}
                                  </option>
                                ))}
                              </select>
                              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none opacity-50" />
                            </>
                          )}
                        </div>
                      </td>

                      {/* Payment status — auto-saves on change */}
                      <td className="px-4 py-3 text-center min-w-[130px]">
                        <div className="relative inline-flex items-center w-full">
                          {savingPayment[order.id] ? (
                            <div className="flex items-center justify-center w-full gap-1.5 text-xs text-gray-500 py-1.5">
                              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving…
                            </div>
                          ) : (
                            <>
                              <select
                                value={currentPayment}
                                onChange={(e) => handlePaymentChange(order, e.target.value)}
                                className={`w-full appearance-none text-xs font-semibold px-2.5 py-1.5 pr-6 rounded-full border cursor-pointer outline-none transition-colors ${
                                  PAYMENT_COLORS[currentPayment] ?? "bg-gray-100 text-gray-600 border-gray-200"
                                }`}
                              >
                                {PAYMENT_STATUSES.map((s) => (
                                  <option key={s} value={s}>
                                    {s}
                                  </option>
                                ))}
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
                          const labels: Record<string, string> = {
                            cash: "Cash",
                            mobile_money: "Mobile Money",
                            card: "Card",
                          };
                          const colors: Record<string, string> = {
                            cash:         "bg-teal-100 text-teal-700 border-teal-200",
                            mobile_money: "bg-amber-100 text-amber-700 border-amber-200",
                            card:         "bg-blue-100 text-blue-700 border-blue-200",
                          };
                          return (
                            <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full border whitespace-nowrap ${colors[method] ?? "bg-gray-100 text-gray-600 border-gray-200"}`}>
                              {labels[method] ?? method}
                            </span>
                          );
                        })()}
                      </td>

                      <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                        {new Date(order.createdAt).toLocaleDateString("en-US", {
                          month: "short", day: "numeric", year: "numeric",
                        })}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Save text fields button */}
                          {flashed ? (
                            <span className="flex items-center gap-1 text-xs text-green-600 font-semibold px-2 py-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Saved
                            </span>
                          ) : (
                            <button
                              onClick={() => handleSaveText(order)}
                              disabled={!textDirty || isSavingText}
                              title={textDirty ? "Save delivery info" : "No unsaved text changes"}
                              className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors ${
                                textDirty && !isSavingText
                                  ? "bg-[#1e3a5f] text-white hover:bg-[#162d4a]"
                                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
                              }`}
                            >
                              {isSavingText
                                ? <Loader2 className="w-3 h-3 animate-spin" />
                                : <Save className="w-3 h-3" />
                              }
                              Save
                            </button>
                          )}

                          <button
                            onClick={() => handleDelete(order.id)}
                            disabled={isDeleting}
                            title="Delete order"
                            className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors disabled:opacity-40"
                          >
                            {isDeleting
                              ? <Loader2 className="w-3 h-3 animate-spin" />
                              : <Trash2 className="w-3 h-3" />
                            }
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

      {/* ── Record Manual Sale modal ───────────────────────────────── */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => !savingManual && setShowManualModal(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-[#023E4A] to-[#0097A7] text-white rounded-t-2xl">
              <div>
                <h2 className="text-lg font-bold">Record Manual Sale</h2>
                <p className="text-white/70 text-xs">For products sold in person — not through an online order</p>
              </div>
              <button
                onClick={() => !savingManual && setShowManualModal(false)}
                className="text-white/80 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal body */}
            <div className="p-6 space-y-4">
              {/* Product */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Product *</label>
                <select
                  value={manual.productId}
                  onChange={(e) => selectManualProduct(e.target.value)}
                  className="w-full text-sm px-3 py-2.5 border border-gray-200 rounded-lg outline-none focus:border-[#0097A7] focus:ring-1 focus:ring-[#0097A7] bg-white"
                >
                  <option value="">
                    {myProducts.length === 0 ? "Loading your products…" : "Select a product"}
                  </option>
                  {myProducts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Unit price + quantity */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Unit Price (RWF) *</label>
                  <input
                    type="number"
                    min="0"
                    value={manual.unitPrice}
                    onChange={(e) => setManual((m) => ({ ...m, unitPrice: e.target.value }))}
                    placeholder="0"
                    className="w-full text-sm px-3 py-2.5 border border-gray-200 rounded-lg outline-none focus:border-[#0097A7] focus:ring-1 focus:ring-[#0097A7]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Quantity *</label>
                  <input
                    type="number"
                    min="1"
                    value={manual.quantity}
                    onChange={(e) => setManual((m) => ({ ...m, quantity: e.target.value }))}
                    className="w-full text-sm px-3 py-2.5 border border-gray-200 rounded-lg outline-none focus:border-[#0097A7] focus:ring-1 focus:ring-[#0097A7]"
                  />
                </div>
              </div>

              {/* Customer name + phone */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Customer Name *</label>
                  <input
                    type="text"
                    value={manual.customerName}
                    onChange={(e) => setManual((m) => ({ ...m, customerName: e.target.value }))}
                    placeholder="e.g. John Doe"
                    className="w-full text-sm px-3 py-2.5 border border-gray-200 rounded-lg outline-none focus:border-[#0097A7] focus:ring-1 focus:ring-[#0097A7]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Customer Phone</label>
                  <input
                    type="text"
                    value={manual.customerPhone}
                    onChange={(e) => setManual((m) => ({ ...m, customerPhone: e.target.value }))}
                    placeholder="Optional"
                    className="w-full text-sm px-3 py-2.5 border border-gray-200 rounded-lg outline-none focus:border-[#0097A7] focus:ring-1 focus:ring-[#0097A7]"
                  />
                </div>
              </div>

              {/* Payment method + status */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Payment Method</label>
                  <select
                    value={manual.paymentMethod}
                    onChange={(e) => setManual((m) => ({ ...m, paymentMethod: e.target.value }))}
                    className="w-full text-sm px-3 py-2.5 border border-gray-200 rounded-lg outline-none focus:border-[#0097A7] focus:ring-1 focus:ring-[#0097A7] bg-white"
                  >
                    <option value="cash">Cash</option>
                    <option value="mobile_money">Mobile Money</option>
                    <option value="card">Card</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Payment Status</label>
                  <select
                    value={manual.paymentStatus}
                    onChange={(e) => setManual((m) => ({ ...m, paymentStatus: e.target.value }))}
                    className="w-full text-sm px-3 py-2.5 border border-gray-200 rounded-lg outline-none focus:border-[#0097A7] focus:ring-1 focus:ring-[#0097A7] bg-white"
                  >
                    {PAYMENT_STATUSES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Order status */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Order Status</label>
                <select
                  value={manual.status}
                  onChange={(e) => setManual((m) => ({ ...m, status: e.target.value }))}
                  className="w-full text-sm px-3 py-2.5 border border-gray-200 rounded-lg outline-none focus:border-[#0097A7] focus:ring-1 focus:ring-[#0097A7] bg-white"
                >
                  {ORDER_STATUSES.map((s) => (
                    <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
                  ))}
                </select>
              </div>

              {/* Total preview */}
              <div className="flex items-center justify-between bg-[#f8fafc] border border-gray-200 rounded-lg px-4 py-3">
                <span className="text-sm font-medium text-gray-600">Total</span>
                <span className="text-lg font-black text-[#1e3a5f]">RWF {manualTotal.toLocaleString()}</span>
              </div>
            </div>

            {/* Modal footer */}
            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100">
              <button
                onClick={() => setShowManualModal(false)}
                disabled={savingManual}
                className="text-sm font-semibold px-4 py-2.5 rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                onClick={handleRecordManualSale}
                disabled={savingManual}
                className="flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl bg-[#0097A7] text-white hover:bg-[#007e8c] transition-colors disabled:opacity-50"
              >
                {savingManual
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <Save className="w-4 h-4" />}
                {savingManual ? "Recording…" : "Record Sale"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
