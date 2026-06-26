"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Plus, Trash2, AlertCircle, Pencil, X, Receipt, Search,
  Building2, User as UserIcon, Wallet, Download,
} from "lucide-react";
import {
  getServiceTransactions,
  saveServiceTransaction,
  updateServiceTransaction,
  deleteServiceTransaction,
  type ServiceTransaction,
} from "@/app/actions/industry";

const frw = (n: number) =>
  "Frw " + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function today() {
  return new Date().toISOString().split("T")[0];
}

const DEFAULTS = {
  giverCompany: "",
  receiverName: "",
  receiverEmail: "",
  receiverPhone: "",
  receiverId: "",
  serviceDescription: "",
  amountPaid: "",
  date: today(),
};

type FormState = typeof DEFAULTS;

function toForm(t: ServiceTransaction): FormState {
  return {
    giverCompany: t.giverCompany,
    receiverName: t.receiverName,
    receiverEmail: t.receiverEmail,
    receiverPhone: t.receiverPhone,
    receiverId: t.receiverId ?? "",
    serviceDescription: t.serviceDescription ?? "",
    amountPaid: String(t.amountPaid),
    date: t.date.split("T")[0],
  };
}

export default function ServiceTransactions() {
  const [records, setRecords] = useState<ServiceTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(DEFAULTS);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<FormState>(DEFAULTS);
  const [editSaving, setEditSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    getServiceTransactions().then((r) => { setRecords(r); setLoading(false); });
  }, []);

  const totalAmount = useMemo(
    () => records.reduce((s, r) => s + r.amountPaid, 0),
    [records]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return records;
    return records.filter((r) =>
      [r.giverCompany, r.receiverName, r.receiverEmail, r.receiverPhone, r.receiverId, r.serviceDescription]
        .some((v) => (v ?? "").toLowerCase().includes(q))
    );
  }, [records, query]);

  const n = (v: string) => parseFloat(v) || 0;

  const f = (field: keyof FormState, val: string) =>
    setForm((prev) => ({ ...prev, [field]: val }));
  const ef = (field: keyof FormState, val: string) =>
    setEditForm((prev) => ({ ...prev, [field]: val }));

  const resetForm = () => { setForm(DEFAULTS); setError(""); };

  const validate = (s: FormState): string | null => {
    if (!s.giverCompany.trim()) return "Giver company name is required.";
    if (!s.receiverName.trim()) return "Receiver name is required.";
    if (!s.receiverEmail.trim()) return "Receiver email is required.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.receiverEmail.trim())) return "Please enter a valid email.";
    if (!s.receiverPhone.trim()) return "Receiver telephone is required.";
    if (n(s.amountPaid) <= 0) return "Amount paid must be greater than 0.";
    return null;
  };

  const payload = (s: FormState) => ({
    giverCompany: s.giverCompany.trim(),
    receiverName: s.receiverName.trim(),
    receiverEmail: s.receiverEmail.trim(),
    receiverPhone: s.receiverPhone.trim(),
    receiverId: s.receiverId.trim() || undefined,
    serviceDescription: s.serviceDescription.trim() || undefined,
    amountPaid: n(s.amountPaid),
    date: s.date || today(),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const msg = validate(form);
    if (msg) { setError(msg); return; }
    setSaving(true);
    const result = await saveServiceTransaction(payload(form));
    setSaving(false);
    if (result.success) {
      resetForm(); setShowForm(false);
      setRecords(await getServiceTransactions());
    } else { setError(result.message || "Failed to save."); }
  };

  const startEdit = (t: ServiceTransaction) => {
    setEditingId(t.id);
    setEditForm(toForm(t));
  };

  const handleEditSubmit = async (id: string) => {
    const msg = validate(editForm);
    if (msg) { setError(msg); return; }
    setEditSaving(true);
    const result = await updateServiceTransaction(id, payload(editForm));
    setEditSaving(false);
    if (result.success) {
      setEditingId(null);
      setRecords(await getServiceTransactions());
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this transaction record?")) return;
    await deleteServiceTransaction(id);
    setRecords((prev) => prev.filter((r) => r.id !== id));
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
      const navy: [number, number, number] = [2, 62, 74];
      const white: [number, number, number] = [255, 255, 255];
      const light: [number, number, number] = [236, 254, 255];

      const trunc = (s: string | null | undefined, max: number) => {
        const str = s ?? "—";
        return str.length > max ? str.slice(0, max - 1) + "…" : str || "—";
      };

      const cols: { header: string; width: number }[] = [
        { header: "#",               width: 8  },
        { header: "Date",            width: 24 },
        { header: "Giver (Company)", width: 42 },
        { header: "Receiver",        width: 38 },
        { header: "Email",           width: 46 },
        { header: "Telephone",       width: 28 },
        { header: "ID",              width: 26 },
        { header: "Service",         width: 35 },
        { header: "Amount Paid",     width: 30 },
      ];

      const drawHeader = (y: number) => {
        pdf.setFillColor(...navy);
        pdf.rect(M, y, usableW, ROW_H, "F");
        pdf.setTextColor(...white);
        pdf.setFontSize(7);
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
      pdf.text("Service Transactions Report", M, 12);
      pdf.setFontSize(7.5);
      pdf.setFont("helvetica", "normal");
      pdf.text(
        `${filtered.length} record${filtered.length !== 1 ? "s" : ""}  |  Generated: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`,
        PW - M, 12, { align: "right" }
      );

      let y = 24;
      drawHeader(y);
      y += ROW_H;

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(6.5);

      filtered.forEach((r, i) => {
        if (y + ROW_H > PH - 12) {
          pdf.addPage();
          y = 10;
          drawHeader(y);
          y += ROW_H;
          pdf.setFont("helvetica", "normal");
          pdf.setFontSize(6.5);
        }

        if (i % 2 === 0) {
          pdf.setFillColor(...light);
          pdf.rect(M, y, usableW, ROW_H, "F");
        }

        pdf.setTextColor(20, 20, 20);

        const cells = [
          String(i + 1),
          new Date(r.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
          trunc(r.giverCompany, 30),
          trunc(r.receiverName, 26),
          trunc(r.receiverEmail, 32),
          trunc(r.receiverPhone, 18),
          trunc(r.receiverId, 16),
          trunc(r.serviceDescription, 24),
          frw(r.amountPaid),
        ];

        let x = M + 1.5;
        cells.forEach((cell, ci) => {
          pdf.text(cell, x, y + ROW_H - 2);
          x += cols[ci].width;
        });

        y += ROW_H;
      });

      // Totals row
      if (y + ROW_H > PH - 12) { pdf.addPage(); y = 10; }
      const total = filtered.reduce((s, r) => s + r.amountPaid, 0);
      pdf.setFillColor(...navy);
      pdf.rect(M, y, usableW, ROW_H, "F");
      pdf.setTextColor(...white);
      pdf.setFontSize(7.5);
      pdf.setFont("helvetica", "bold");
      pdf.text("TOTAL AMOUNT PAID", M + 1.5, y + ROW_H - 2);
      pdf.text(frw(total), M + usableW - 2, y + ROW_H - 2, { align: "right" });
      y += ROW_H;

      // Footer
      pdf.setFontSize(7);
      pdf.setTextColor(160, 160, 160);
      pdf.setFont("helvetica", "normal");
      pdf.text("Vertex Industry Management System", M, PH - 4);

      pdf.save(`service-transactions-${new Date().toISOString().split("T")[0]}.pdf`);
    } finally {
      setDownloading(false);
    }
  };

  const fieldGrid = (s: FormState, set: (field: keyof FormState, val: string) => void, ring: string) => (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <div className="lg:col-span-3">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5" /> Giver of Services
          </p>
        </div>
        <div className="lg:col-span-3">
          <label className="block text-xs font-medium text-gray-600 mb-1">Company Name *</label>
          <input type="text" value={s.giverCompany} onChange={(e) => set("giverCompany", e.target.value)}
            placeholder="e.g. Vertex Consulting Ltd"
            className={`w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 ${ring}`} />
        </div>

        <div className="lg:col-span-3 pt-1">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
            <UserIcon className="w-3.5 h-3.5" /> Receiver of Services
          </p>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Full Name *</label>
          <input type="text" value={s.receiverName} onChange={(e) => set("receiverName", e.target.value)}
            placeholder="Receiver name"
            className={`w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 ${ring}`} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Email *</label>
          <input type="email" value={s.receiverEmail} onChange={(e) => set("receiverEmail", e.target.value)}
            placeholder="name@example.com"
            className={`w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 ${ring}`} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Telephone *</label>
          <input type="tel" value={s.receiverPhone} onChange={(e) => set("receiverPhone", e.target.value)}
            placeholder="07XX XXX XXX"
            className={`w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 ${ring}`} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            ID <span className="font-normal text-gray-400">(optional)</span>
          </label>
          <input type="text" value={s.receiverId} onChange={(e) => set("receiverId", e.target.value)}
            placeholder="National ID / Passport"
            className={`w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 ${ring}`} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Amount Paid (Frw) *</label>
          <input type="number" min="0" step="any" value={s.amountPaid} onChange={(e) => set("amountPaid", e.target.value)}
            placeholder="0"
            className={`w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 ${ring}`} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Date *</label>
          <input type="date" value={s.date} onChange={(e) => set("date", e.target.value)}
            className={`w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 ${ring}`} />
        </div>
        <div className="lg:col-span-3">
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Service Description <span className="font-normal text-gray-400">(optional)</span>
          </label>
          <input type="text" value={s.serviceDescription} onChange={(e) => set("serviceDescription", e.target.value)}
            placeholder="What service was provided?"
            className={`w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 ${ring}`} />
        </div>
      </div>
    </>
  );

  if (loading) return <div className="py-16 text-center text-gray-500">Loading…</div>;

  return (
    <div className="space-y-5">
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3 shadow-sm">
          <div className="w-11 h-11 rounded-xl bg-cyan-50 flex items-center justify-center shrink-0">
            <Receipt className="w-5 h-5 text-[#023E4A]" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Total Transactions</p>
            <p className="text-xl font-bold text-gray-900">{records.length}</p>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3 shadow-sm">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
            <Wallet className="w-5 h-5 text-emerald-700" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Total Amount Paid</p>
            <p className="text-xl font-bold text-emerald-700">{frw(totalAmount)}</p>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text" value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder="Search company, receiver, email…"
            className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#06B6D4]"
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={downloadReport}
            disabled={downloading || filtered.length === 0}
            className="flex items-center justify-center gap-1.5 bg-[#1e3a5f] hover:bg-[#16304f] text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" /> {downloading ? "Generating…" : "Download PDF"}
          </button>
          <button
            onClick={() => { setShowForm((v) => !v); resetForm(); }}
            className="flex items-center justify-center gap-1.5 bg-[#023E4A] hover:bg-[#012830] text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" /> Record Transaction
          </button>
        </div>
      </div>

      {/* Add form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-cyan-50/60 border border-cyan-200 rounded-xl p-5 space-y-5">
          <h3 className="text-sm font-bold text-[#023E4A] uppercase tracking-wide">New Service Transaction</h3>
          {error && (
            <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}
          {fieldGrid(form, f, "focus:ring-[#06B6D4]")}
          <div className="flex gap-2 justify-end border-t border-cyan-200 pt-4">
            <button type="button" onClick={() => { setShowForm(false); resetForm(); }}
              className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-white transition-colors">Cancel</button>
            <button type="submit" disabled={saving}
              className="px-4 py-2 text-sm bg-[#023E4A] hover:bg-[#012830] text-white font-semibold rounded-lg transition-colors disabled:opacity-60">
              {saving ? "Saving…" : "Save Transaction"}
            </button>
          </div>
        </form>
      )}

      {/* Table */}
      {records.length === 0 ? (
        <div className="bg-gray-50 rounded-xl p-10 text-center border border-dashed border-gray-300">
          <Receipt className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500 text-sm">No transactions recorded yet. Click "Record Transaction" to start.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
          <table className="w-full text-xs border-collapse min-w-[920px]">
            <thead>
              <tr className="bg-[#023E4A] text-white">
                {["#", "Date", "Giver (Company)", "Receiver", "Email", "Telephone", "ID", "Service", "Amount Paid", ""].map((h, i) => (
                  <th key={i} className="px-3 py-2.5 text-left font-semibold whitespace-nowrap border-r border-white/10 last:border-r-0">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={10} className="px-3 py-8 text-center text-gray-400">No transactions match your search.</td></tr>
              ) : filtered.map((r, i) => (
                <tr key={r.id} className={`border-b border-gray-100 hover:bg-cyan-50/40 transition-colors ${i % 2 === 0 ? "bg-cyan-50/20" : "bg-white"}`}>
                  <td className="px-3 py-2 text-gray-400 font-mono">{i + 1}</td>
                  <td className="px-3 py-2 text-gray-600 whitespace-nowrap">
                    {new Date(r.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                  </td>
                  <td className="px-3 py-2 font-semibold text-[#023E4A] whitespace-nowrap">{r.giverCompany}</td>
                  <td className="px-3 py-2 text-gray-800 whitespace-nowrap">{r.receiverName}</td>
                  <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{r.receiverEmail}</td>
                  <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{r.receiverPhone}</td>
                  <td className="px-3 py-2 text-gray-500 whitespace-nowrap">{r.receiverId || <span className="text-gray-300">—</span>}</td>
                  <td className="px-3 py-2 text-gray-500 max-w-[180px] truncate" title={r.serviceDescription}>
                    {r.serviceDescription || <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-3 py-2 text-right font-bold text-emerald-700 whitespace-nowrap">{frw(r.amountPaid)}</td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1">
                      <button onClick={() => startEdit(r)} className="text-blue-400 hover:text-blue-600 transition-colors p-1 rounded" title="Edit">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDelete(r.id)} className="text-red-400 hover:text-red-600 transition-colors p-1 rounded" title="Delete">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            {filtered.length > 0 && (
              <tfoot>
                <tr className="bg-gray-50 border-t border-gray-200 font-bold text-[#023E4A]">
                  <td colSpan={8} className="px-3 py-2.5 text-right">Total</td>
                  <td className="px-3 py-2.5 text-right text-emerald-700 whitespace-nowrap">
                    {frw(filtered.reduce((s, r) => s + r.amountPaid, 0))}
                  </td>
                  <td />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      )}

      {/* Edit modal */}
      {editingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={() => setEditingId(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#023E4A] flex items-center gap-2">
                <Pencil className="w-4 h-4" /> Edit Transaction
              </h3>
              <button onClick={() => setEditingId(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            {error && (
              <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                <AlertCircle className="w-4 h-4 shrink-0" /> {error}
              </div>
            )}
            {fieldGrid(editForm, ef, "focus:ring-blue-400")}
            <div className="flex gap-2 justify-end border-t border-gray-200 pt-4">
              <button type="button" onClick={() => setEditingId(null)}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
              <button type="button" onClick={() => handleEditSubmit(editingId)} disabled={editSaving}
                className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-60">
                {editSaving ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
