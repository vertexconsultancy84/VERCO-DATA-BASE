"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Layers, BoxesIcon, Plus, Trash2, AlertCircle,
  ChevronDown, ChevronRight, ArrowDownCircle, ArrowUpCircle,
  Clock, TrendingUp, TrendingDown, Pencil, X,
} from "lucide-react";
import {
  getRawMaterialRecords,
  saveRawMaterialRecord,
  updateRawMaterialRecord,
  updateRawMaterialCostPerUnit,
  deleteRawMaterialRecord,
  getFinishedProductStockRecords,
  saveFinishedProductStockRecord,
  updateFinishedProductStockRecord,
  deleteFinishedProductStockRecord,
  getStockMovements,
  saveStockMovement,
  deleteStockMovement,
  type RawMaterialRecord,
  type FinishedProductStockRecord,
  type CustomExpense,
  type StockMovement,
} from "@/app/actions/industry";

const frw = (n: number) =>
  "Frw " + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const UNITS = ["Kg", "Liter", "Piece", "Meter", "Ton", "Box", "Bag", "Bottle", "Other"];

function newExpense(): CustomExpense {
  return { id: crypto.randomUUID(), label: "", amount: 0 };
}

function today() {
  return new Date().toISOString().split("T")[0];
}

// ─── Cost Breakdown Panel ────────────────────────────────────────────────────

interface BreakdownRow { label: string; amount: number }

function CostBreakdown({ rows, qty, totalCost, accentClass }: {
  rows: BreakdownRow[];
  qty: number;
  totalCost: number;
  accentClass: string;
}) {
  const nonZero = rows.filter((r) => r.amount > 0);
  if (nonZero.length === 0 || qty <= 0) return null;
  return (
    <div className={`rounded-lg border ${accentClass} overflow-hidden text-xs`}>
      <div className="grid grid-cols-3 font-semibold text-gray-500 px-3 py-1.5 bg-gray-50 border-b border-gray-200">
        <span>Expense</span><span className="text-right">Total</span><span className="text-right">Per Unit</span>
      </div>
      {nonZero.map((row) => (
        <div key={row.label} className="grid grid-cols-3 px-3 py-1.5 border-b border-gray-100 last:border-b-0">
          <span className="text-gray-700">{row.label}</span>
          <span className="text-right text-gray-600">{frw(row.amount)}</span>
          <span className="text-right font-medium text-gray-800">{frw(row.amount / qty)}</span>
        </div>
      ))}
      <div className="grid grid-cols-3 font-bold px-3 py-2 bg-gray-50 border-t border-gray-200">
        <span>Total</span>
        <span className="text-right">{frw(totalCost)}</span>
        <span className="text-right text-emerald-700">{frw(totalCost / qty)}</span>
      </div>
    </div>
  );
}

// ─── Movement Log ────────────────────────────────────────────────────────────

function MovementLog({
  recordId,
  recordName,
  unit,
  type,
  initialQty,
}: {
  recordId: string;
  recordName: string;
  unit: string;
  type: "raw" | "finished";
  initialQty: number;
}) {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState<"in" | "out" | null>(null);
  const [qty, setQty] = useState("");
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState(today());
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setMovements(await getStockMovements(recordId));
    setLoading(false);
  }, [recordId]);

  useEffect(() => { load(); }, [load]);

  const totalIn = movements.filter((m) => m.movement === "in").reduce((s, m) => s + m.quantity, 0);
  const totalOut = movements.filter((m) => m.movement === "out").reduce((s, m) => s + m.quantity, 0);
  // initial purchase/production always counts as the first IN
  const currentStock = initialQty + totalIn - totalOut;

  const handleSave = async () => {
    if (!showAddForm || !qty || parseFloat(qty) <= 0) return;
    setSaving(true);
    await saveStockMovement({
      type,
      recordId,
      recordName,
      unit,
      movement: showAddForm,
      quantity: parseFloat(qty),
      notes: notes.trim() || undefined,
      date,
    });
    setQty(""); setNotes(""); setDate(today()); setShowAddForm(null);
    await load();
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this movement?")) return;
    await deleteStockMovement(id);
    await load();
  };

  const stockColor = currentStock <= 0 ? "text-red-600" : currentStock < initialQty * 0.2 ? "text-amber-600" : "text-emerald-600";

  return (
    <div className="space-y-3">
      {/* Stock summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2.5 text-center">
          <p className="text-xs text-emerald-600 font-medium">Total IN</p>
          <p className="text-sm font-bold text-emerald-700">{(initialQty + totalIn).toLocaleString()} {unit}</p>
          <p className="text-[10px] text-emerald-500">{initialQty} initial + {totalIn} added</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2.5 text-center">
          <p className="text-xs text-red-600 font-medium">Total OUT</p>
          <p className="text-sm font-bold text-red-700">{totalOut.toLocaleString()} {unit}</p>
        </div>
        <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg px-3 py-2.5 text-center">
          <p className="text-xs text-gray-500 font-medium">Current Stock</p>
          <p className={`text-sm font-bold ${stockColor}`}>{currentStock.toLocaleString()} {unit}</p>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => setShowAddForm(showAddForm === "in" ? null : "in")}
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
        >
          <ArrowDownCircle className="w-3.5 h-3.5" /> Stock IN
        </button>
        <button
          onClick={() => setShowAddForm(showAddForm === "out" ? null : "out")}
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors"
        >
          <ArrowUpCircle className="w-3.5 h-3.5" /> Stock OUT
        </button>
      </div>

      {/* Inline movement form */}
      {showAddForm && (
        <div className={`rounded-lg border p-3 space-y-2 ${showAddForm === "in" ? "border-emerald-300 bg-emerald-50" : "border-red-300 bg-red-50"}`}>
          <p className={`text-xs font-bold uppercase tracking-wide ${showAddForm === "in" ? "text-emerald-700" : "text-red-700"}`}>
            {showAddForm === "in" ? "Record Stock IN" : "Record Stock OUT"}
          </p>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs text-gray-600 mb-0.5">Quantity *</label>
              <input
                type="number" min="0" step="any" value={qty}
                onChange={(e) => setQty(e.target.value)}
                placeholder={`Amount in ${unit}`}
                className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-gray-400"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-0.5">Date *</label>
              <input
                type="date" value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-gray-400"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-0.5">Notes</label>
              <input
                type="text" value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Batch #3, Order #12"
                className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-gray-400"
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowAddForm(null)} type="button"
              className="text-xs px-3 py-1.5 border border-gray-300 rounded hover:bg-white transition-colors">
              Cancel
            </button>
            <button
              onClick={handleSave} disabled={saving || !qty || parseFloat(qty) <= 0}
              type="button"
              className={`text-xs px-3 py-1.5 rounded text-white font-semibold transition-colors disabled:opacity-50 ${
                showAddForm === "in" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-500 hover:bg-red-600"
              }`}
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      )}

      {/* Movement history */}
      {loading ? (
        <p className="text-xs text-gray-400 text-center py-2">Loading movements…</p>
      ) : movements.length === 0 ? (
        <div className="text-center py-4 border border-dashed border-gray-200 rounded-lg">
          <Clock className="w-5 h-5 text-gray-300 mx-auto mb-1" />
          <p className="text-xs text-gray-400">No movements recorded yet. Use "Stock IN" or "Stock OUT" to start.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-gray-100 text-gray-600 border-b border-gray-200">
                <th className="px-3 py-2 text-left font-semibold">Type</th>
                <th className="px-3 py-2 text-left font-semibold">Date</th>
                <th className="px-3 py-2 text-right font-semibold">Quantity</th>
                <th className="px-3 py-2 text-left font-semibold">Notes</th>
                <th className="px-3 py-2 text-left font-semibold">Recorded At</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {movements.map((m, i) => (
                <tr key={m.id} className={`border-b border-gray-100 last:border-b-0 ${i % 2 === 0 ? "bg-white" : "bg-gray-50"}`}>
                  <td className="px-3 py-2">
                    {m.movement === "in" ? (
                      <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                        <TrendingDown className="w-3 h-3" /> IN
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-red-600 font-semibold">
                        <TrendingUp className="w-3 h-3" /> OUT
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-gray-700 whitespace-nowrap">
                    {new Date(m.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                  </td>
                  <td className={`px-3 py-2 text-right font-bold whitespace-nowrap ${m.movement === "in" ? "text-emerald-700" : "text-red-600"}`}>
                    {m.movement === "in" ? "+" : "−"}{m.quantity.toLocaleString()} {m.unit}
                  </td>
                  <td className="px-3 py-2 text-gray-500">{m.notes || <span className="text-gray-300">—</span>}</td>
                  <td className="px-3 py-2 text-gray-400 whitespace-nowrap">
                    {new Date(m.createdAt).toLocaleString("en-GB", { dateStyle: "short", timeStyle: "short" })}
                  </td>
                  <td className="px-3 py-2">
                    <button onClick={() => handleDelete(m.id)}
                      className="text-red-300 hover:text-red-500 transition-colors p-0.5 rounded">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Custom Expenses Editor ──────────────────────────────────────────────────

function CustomExpensesEditor({ expenses, onChange, accentColor }: {
  expenses: CustomExpense[];
  onChange: (expenses: CustomExpense[]) => void;
  accentColor: "slate" | "teal";
}) {
  const add = () => onChange([...expenses, newExpense()]);
  const remove = (id: string) => onChange(expenses.filter((e) => e.id !== id));
  const update = (id: string, field: "label" | "amount", val: string) =>
    onChange(expenses.map((e) => e.id === id ? { ...e, [field]: field === "amount" ? parseFloat(val) || 0 : val } : e));

  const ring = accentColor === "slate" ? "focus:ring-slate-400" : "focus:ring-teal-400";
  const btn = accentColor === "slate"
    ? "border-slate-400 text-slate-700 hover:bg-slate-100"
    : "border-teal-500 text-teal-700 hover:bg-teal-50";

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Additional Expenses</p>
        <button type="button" onClick={add}
          className={`flex items-center gap-1 text-xs font-semibold border rounded-lg px-3 py-1.5 transition-colors ${btn}`}>
          <Plus className="w-3.5 h-3.5" /> Add Expense
        </button>
      </div>
      {expenses.length === 0 && (
        <p className="text-xs text-gray-400 italic">No additional expenses. Click "Add Expense" to add one.</p>
      )}
      {expenses.map((exp) => (
        <div key={exp.id} className="flex items-center gap-2">
          <input type="text" value={exp.label} onChange={(e) => update(exp.id, "label", e.target.value)}
            placeholder="Expense name (e.g. Loading fee)"
            className={`flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 ${ring}`} />
          <input type="number" min="0" step="any" value={exp.amount || ""} onChange={(e) => update(exp.id, "amount", e.target.value)}
            placeholder="Amount (Frw)"
            className={`w-40 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 ${ring}`} />
          <button type="button" onClick={() => remove(exp.id)}
            className="text-red-400 hover:text-red-600 p-1.5 rounded transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}

// ─── Raw Materials Tab ───────────────────────────────────────────────────────

const RAW_DEFAULTS = {
  materialName: "", quantityPurchased: "", unit: "Kg",
  purchasePrice: "", tax: "", transportCost: "", otherExpenses: "", currentStock: "",
};

function RawMaterialsTab() {
  const [records, setRecords] = useState<RawMaterialRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(RAW_DEFAULTS);
  const [customExpenses, setCustomExpenses] = useState<CustomExpense[]>([]);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(RAW_DEFAULTS);
  const [editCustomExpenses, setEditCustomExpenses] = useState<CustomExpense[]>([]);
  const [editSaving, setEditSaving] = useState(false);
  // inline cost-per-unit editing: map of recordId → draft string value
  const [cpuDraft, setCpuDraft] = useState<Record<string, string>>({});

  useEffect(() => {
    getRawMaterialRecords().then((r) => { setRecords(r); setLoading(false); });
  }, []);

  const n = (v: string) => parseFloat(v) || 0;

  const totalCost = useMemo(() => {
    const fixed = n(form.purchasePrice) + n(form.tax) + n(form.transportCost) + n(form.otherExpenses);
    return fixed + customExpenses.reduce((s, e) => s + e.amount, 0);
  }, [form.purchasePrice, form.tax, form.transportCost, form.otherExpenses, customExpenses]);

  const costPerUnit = useMemo(() => {
    const qty = n(form.quantityPurchased);
    return qty > 0 ? totalCost / qty : 0;
  }, [totalCost, form.quantityPurchased]);

  const breakdownRows: BreakdownRow[] = [
    { label: "Purchase Price", amount: n(form.purchasePrice) },
    { label: "Tax", amount: n(form.tax) },
    { label: "Transport Cost", amount: n(form.transportCost) },
    { label: "Other Expenses", amount: n(form.otherExpenses) },
    ...customExpenses.map((e) => ({ label: e.label || "Custom", amount: e.amount })),
  ];

  const resetForm = () => { setForm(RAW_DEFAULTS); setCustomExpenses([]); setError(""); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.materialName.trim()) { setError("Material name is required."); return; }
    if (n(form.quantityPurchased) <= 0) { setError("Quantity must be greater than 0."); return; }
    setSaving(true);
    const result = await saveRawMaterialRecord({
      materialName: form.materialName.trim(),
      quantityPurchased: n(form.quantityPurchased),
      unit: form.unit,
      purchasePrice: n(form.purchasePrice),
      tax: n(form.tax),
      transportCost: n(form.transportCost),
      otherExpenses: n(form.otherExpenses),
      customExpenses,
      totalCost,
      costPerUnit,
      currentStock: n(form.currentStock),
    });
    setSaving(false);
    if (result.success) {
      resetForm(); setShowForm(false);
      setRecords(await getRawMaterialRecords());
    } else { setError(result.message || "Failed to save."); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this record and all its movements?")) return;
    await deleteRawMaterialRecord(id);
    setRecords((prev) => prev.filter((r) => r.id !== id));
  };

  const startEdit = (r: RawMaterialRecord) => {
    setEditingId(r.id);
    setExpandedId(null);
    setEditForm({
      materialName: r.materialName,
      quantityPurchased: String(r.quantityPurchased),
      unit: r.unit,
      purchasePrice: String(r.purchasePrice),
      tax: String(r.tax),
      transportCost: String(r.transportCost),
      otherExpenses: String(r.otherExpenses),
      currentStock: String(r.currentStock),
    });
    setEditCustomExpenses(r.customExpenses ?? []);
  };

  const handleEditSubmit = async (id: string) => {
    setEditSaving(true);
    const fixedCost = n(editForm.purchasePrice) + n(editForm.tax) + n(editForm.transportCost) + n(editForm.otherExpenses);
    const extraCost = editCustomExpenses.reduce((s, e) => s + e.amount, 0);
    const totalCost = fixedCost + extraCost;
    const qty = n(editForm.quantityPurchased);
    const costPerUnit = qty > 0 ? totalCost / qty : 0;
    const result = await updateRawMaterialRecord(id, {
      materialName: editForm.materialName.trim(),
      quantityPurchased: qty,
      unit: editForm.unit,
      purchasePrice: n(editForm.purchasePrice),
      tax: n(editForm.tax),
      transportCost: n(editForm.transportCost),
      otherExpenses: n(editForm.otherExpenses),
      customExpenses: editCustomExpenses,
      totalCost,
      costPerUnit,
      currentStock: n(editForm.currentStock),
    });
    setEditSaving(false);
    if (result.success) {
      setEditingId(null);
      setRecords(await getRawMaterialRecords());
    }
  };

  const f = (field: keyof typeof RAW_DEFAULTS, val: string) =>
    setForm((prev) => ({ ...prev, [field]: val }));

  const ef = (field: keyof typeof RAW_DEFAULTS, val: string) =>
    setEditForm((prev) => ({ ...prev, [field]: val }));

  if (loading) return <div className="py-16 text-center text-gray-500">Loading…</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{records.length} record{records.length !== 1 ? "s" : ""}</p>
        <button
          onClick={() => { setShowForm((v) => !v); resetForm(); }}
          className="flex items-center gap-1.5 bg-slate-700 hover:bg-slate-800 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Record
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-5">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">New Raw Material Record</h3>
          {error && (
            <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div className="lg:col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Material Name *</label>
              <input type="text" required value={form.materialName} onChange={(e) => f("materialName", e.target.value)}
                placeholder="e.g. Sugar, Flour, Plastic"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Unit *</label>
              <select value={form.unit} onChange={(e) => f("unit", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400">
                {UNITS.map((u) => <option key={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Quantity Purchased *</label>
              <input type="number" min="0" step="any" required value={form.quantityPurchased}
                onChange={(e) => f("quantityPurchased", e.target.value)} placeholder="0"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Current Stock</label>
              <input type="number" min="0" step="any" value={form.currentStock}
                onChange={(e) => f("currentStock", e.target.value)} placeholder="Remaining qty"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Purchase Price (Frw)</label>
              <input type="number" min="0" step="any" value={form.purchasePrice}
                onChange={(e) => f("purchasePrice", e.target.value)} placeholder="0"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Tax (Frw)</label>
              <input type="number" min="0" step="any" value={form.tax}
                onChange={(e) => f("tax", e.target.value)} placeholder="0"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Transport Cost (Frw)</label>
              <input type="number" min="0" step="any" value={form.transportCost}
                onChange={(e) => f("transportCost", e.target.value)} placeholder="0"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Other Expenses (Frw)</label>
              <input type="number" min="0" step="any" value={form.otherExpenses}
                onChange={(e) => f("otherExpenses", e.target.value)} placeholder="Loading, storage, etc."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400" />
            </div>
          </div>

          <div className="border-t border-slate-200 pt-4">
            <CustomExpensesEditor expenses={customExpenses} onChange={setCustomExpenses} accentColor="slate" />
          </div>

          {totalCost > 0 && (
            <div className="border-t border-slate-200 pt-4 space-y-3">
              <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Live Cost Per Unit Breakdown</p>
              <CostBreakdown rows={breakdownRows} qty={n(form.quantityPurchased)} totalCost={totalCost} accentClass="border-slate-200" />
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white border border-slate-200 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Total Cost</p>
                  <p className="text-base font-bold text-slate-800">{frw(totalCost)}</p>
                </div>
                <div className="bg-slate-700 rounded-lg p-3">
                  <p className="text-xs text-slate-300">Cost Per Unit</p>
                  <p className="text-base font-bold text-white">{frw(costPerUnit)}</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-2 justify-end border-t border-slate-200 pt-4">
            <button type="button" onClick={() => { setShowForm(false); resetForm(); }}
              className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
            <button type="submit" disabled={saving}
              className="px-4 py-2 text-sm bg-slate-700 hover:bg-slate-800 text-white font-semibold rounded-lg transition-colors disabled:opacity-60">
              {saving ? "Saving…" : "Save Record"}
            </button>
          </div>
        </form>
      )}

      {/* Table */}
      {records.length === 0 ? (
        <div className="bg-gray-50 rounded-xl p-10 text-center border border-dashed border-gray-300">
          <Layers className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500 text-sm">No raw material records yet. Click "Add Record" to start.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
          <table className="w-full text-xs border-collapse min-w-[960px]">
            <thead>
              <tr className="bg-slate-700 text-white">
                {["","#","Material Name","Qty Purchased","Unit","Purchase Price","Tax","Transport","Other","Extra","Total Cost","Cost/Unit ✎","Date",""].map((h, i) => (
                  <th key={i} className="px-3 py-2.5 text-left font-semibold whitespace-nowrap border-r border-slate-600 last:border-r-0">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {records.map((r, i) => (
                <>
                  <tr key={r.id}
                    className={`border-b border-gray-100 hover:bg-slate-50 transition-colors cursor-pointer ${i % 2 === 0 ? "bg-slate-50/50" : "bg-white"}`}
                    onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}
                  >
                    <td className="px-2 py-2 text-slate-400">
                      {expandedId === r.id ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                    </td>
                    <td className="px-3 py-2 text-gray-400 font-mono">{i + 1}</td>
                    <td className="px-3 py-2 font-semibold text-slate-800 whitespace-nowrap">{r.materialName}</td>
                    <td className="px-3 py-2 text-right">{r.quantityPurchased.toLocaleString()}</td>
                    <td className="px-3 py-2"><span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">{r.unit}</span></td>
                    <td className="px-3 py-2 text-right">{frw(r.purchasePrice)}</td>
                    <td className="px-3 py-2 text-right">{frw(r.tax)}</td>
                    <td className="px-3 py-2 text-right">{frw(r.transportCost)}</td>
                    <td className="px-3 py-2 text-right">{frw(r.otherExpenses)}</td>
                    <td className="px-3 py-2 text-right text-purple-700">
                      {(r.customExpenses ?? []).length > 0
                        ? frw((r.customExpenses ?? []).reduce((s, e) => s + e.amount, 0))
                        : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-3 py-2 text-right font-bold text-slate-800">{frw(r.totalCost)}</td>
                    <td className="p-1 bg-emerald-50" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1 border border-emerald-300 rounded bg-white px-2 py-1 focus-within:ring-2 focus-within:ring-emerald-400">
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={cpuDraft[r.id] ?? r.costPerUnit}
                          onChange={(e) => setCpuDraft((prev) => ({ ...prev, [r.id]: e.target.value }))}
                          onBlur={async () => {
                            const val = parseFloat(cpuDraft[r.id] ?? "");
                            if (!isNaN(val) && val !== r.costPerUnit) {
                              await updateRawMaterialCostPerUnit(r.id, val);
                              setRecords((prev) => prev.map((rec) => rec.id === r.id ? { ...rec, costPerUnit: val } : rec));
                            }
                            setCpuDraft((prev) => { const next = { ...prev }; delete next[r.id]; return next; });
                          }}
                          onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
                          className="w-24 text-right font-bold text-emerald-700 bg-transparent focus:outline-none text-xs"
                        />
                        <span className="text-emerald-400 text-[10px] shrink-0">✎</span>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-gray-400 whitespace-nowrap">{new Date(r.createdAt).toLocaleDateString()}</td>
                    <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1">
                        <button onClick={() => editingId === r.id ? setEditingId(null) : startEdit(r)}
                          className="text-blue-400 hover:text-blue-600 transition-colors p-1 rounded" title="Edit">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDelete(r.id)}
                          className="text-red-400 hover:text-red-600 transition-colors p-1 rounded" title="Delete">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* Edit row */}
                  {editingId === r.id && (
                    <tr key={`${r.id}-edit`} className="bg-blue-50 border-b border-blue-200">
                      <td colSpan={14} className="px-6 py-5">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-bold text-blue-800 uppercase tracking-wide">Edit Record</p>
                            <button onClick={() => setEditingId(null)} className="text-gray-400 hover:text-gray-600">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                            <div className="lg:col-span-2">
                              <label className="block text-xs font-medium text-gray-600 mb-1">Material Name</label>
                              <input type="text" value={editForm.materialName} onChange={(e) => ef("materialName", e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">Unit</label>
                              <select value={editForm.unit} onChange={(e) => ef("unit", e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
                                {UNITS.map((u) => <option key={u}>{u}</option>)}
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">Qty Purchased</label>
                              <input type="number" min="0" step="any" value={editForm.quantityPurchased} onChange={(e) => ef("quantityPurchased", e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">Current Stock</label>
                              <input type="number" min="0" step="any" value={editForm.currentStock} onChange={(e) => ef("currentStock", e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">Purchase Price (Frw)</label>
                              <input type="number" min="0" step="any" value={editForm.purchasePrice} onChange={(e) => ef("purchasePrice", e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">Tax (Frw)</label>
                              <input type="number" min="0" step="any" value={editForm.tax} onChange={(e) => ef("tax", e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">Transport Cost (Frw)</label>
                              <input type="number" min="0" step="any" value={editForm.transportCost} onChange={(e) => ef("transportCost", e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">Other Expenses (Frw)</label>
                              <input type="number" min="0" step="any" value={editForm.otherExpenses} onChange={(e) => ef("otherExpenses", e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                            </div>
                          </div>
                          <CustomExpensesEditor expenses={editCustomExpenses} onChange={setEditCustomExpenses} accentColor="slate" />
                          <div className="flex gap-2 justify-end pt-2 border-t border-blue-200">
                            <button type="button" onClick={() => setEditingId(null)}
                              className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
                            <button type="button" onClick={() => handleEditSubmit(r.id)} disabled={editSaving}
                              className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-60">
                              {editSaving ? "Saving…" : "Save Changes"}
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}

                  {/* Expand row */}
                  {expandedId === r.id && (
                    <tr key={`${r.id}-detail`} className="bg-slate-50 border-b border-slate-200">
                      <td colSpan={14} className="px-6 py-5">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          <div>
                            <p className="text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">Cost Per Unit Breakdown</p>
                            <CostBreakdown
                              rows={[
                                { label: "Purchase Price", amount: r.purchasePrice },
                                { label: "Tax", amount: r.tax },
                                { label: "Transport Cost", amount: r.transportCost },
                                { label: "Other Expenses", amount: r.otherExpenses },
                                ...(r.customExpenses ?? []).map((e) => ({ label: e.label || "Custom", amount: e.amount })),
                              ]}
                              qty={r.quantityPurchased}
                              totalCost={r.totalCost}
                              accentClass="border-slate-200"
                            />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">Stock Movements</p>
                            <MovementLog
                              recordId={r.id}
                              recordName={r.materialName}
                              unit={r.unit}
                              type="raw"
                              initialQty={r.quantityPurchased}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
          <p className="text-xs text-gray-400 px-3 py-2">Click a row to see cost breakdown and record stock IN / OUT movements</p>
        </div>
      )}
    </div>
  );
}

// ─── Finished Products Tab ───────────────────────────────────────────────────

const FP_DEFAULTS = {
  productName: "", quantityProduced: "", productionCost: "",
  laborCost: "", packagingCost: "", transportCost: "", otherExpenses: "",
};

function FinishedProductsTab() {
  const [records, setRecords] = useState<FinishedProductStockRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(FP_DEFAULTS);
  const [customExpenses, setCustomExpenses] = useState<CustomExpense[]>([]);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(FP_DEFAULTS);
  const [editCustomExpenses, setEditCustomExpenses] = useState<CustomExpense[]>([]);
  const [editSaving, setEditSaving] = useState(false);

  useEffect(() => {
    getFinishedProductStockRecords().then((r) => { setRecords(r); setLoading(false); });
  }, []);

  const n = (v: string) => parseFloat(v) || 0;

  const totalProductionCost = useMemo(() => {
    const fixed = n(form.productionCost) + n(form.laborCost) + n(form.packagingCost) + n(form.transportCost) + n(form.otherExpenses);
    return fixed + customExpenses.reduce((s, e) => s + e.amount, 0);
  }, [form.productionCost, form.laborCost, form.packagingCost, form.transportCost, form.otherExpenses, customExpenses]);

  const costPerUnit = useMemo(() => {
    const qty = n(form.quantityProduced);
    return qty > 0 ? totalProductionCost / qty : 0;
  }, [totalProductionCost, form.quantityProduced]);

  const breakdownRows: BreakdownRow[] = [
    { label: "Production Cost", amount: n(form.productionCost) },
    { label: "Labor Cost", amount: n(form.laborCost) },
    { label: "Packaging Cost", amount: n(form.packagingCost) },
    { label: "Transport Cost", amount: n(form.transportCost) },
    { label: "Other Expenses", amount: n(form.otherExpenses) },
    ...customExpenses.map((e) => ({ label: e.label || "Custom", amount: e.amount })),
  ];

  const resetForm = () => { setForm(FP_DEFAULTS); setCustomExpenses([]); setError(""); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.productName.trim()) { setError("Product name is required."); return; }
    if (n(form.quantityProduced) <= 0) { setError("Quantity must be greater than 0."); return; }
    setSaving(true);
    const result = await saveFinishedProductStockRecord({
      productName: form.productName.trim(),
      quantityProduced: n(form.quantityProduced),
      productionCost: n(form.productionCost),
      laborCost: n(form.laborCost),
      packagingCost: n(form.packagingCost),
      transportCost: n(form.transportCost),
      otherExpenses: n(form.otherExpenses),
      customExpenses,
      totalProductionCost,
      costPerUnit,
    });
    setSaving(false);
    if (result.success) {
      resetForm(); setShowForm(false);
      setRecords(await getFinishedProductStockRecords());
    } else { setError(result.message || "Failed to save."); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this record and all its movements?")) return;
    await deleteFinishedProductStockRecord(id);
    setRecords((prev) => prev.filter((r) => r.id !== id));
  };

  const startEdit = (r: FinishedProductStockRecord) => {
    setEditingId(r.id);
    setExpandedId(null);
    setEditForm({
      productName: r.productName,
      quantityProduced: String(r.quantityProduced),
      productionCost: String(r.productionCost),
      laborCost: String(r.laborCost),
      packagingCost: String(r.packagingCost),
      transportCost: String(r.transportCost),
      otherExpenses: String(r.otherExpenses),
    });
    setEditCustomExpenses(r.customExpenses ?? []);
  };

  const handleEditSubmit = async (id: string) => {
    setEditSaving(true);
    const fixed = n(editForm.productionCost) + n(editForm.laborCost) + n(editForm.packagingCost) + n(editForm.transportCost) + n(editForm.otherExpenses);
    const extra = editCustomExpenses.reduce((s, e) => s + e.amount, 0);
    const totalProductionCost = fixed + extra;
    const qty = n(editForm.quantityProduced);
    const costPerUnit = qty > 0 ? totalProductionCost / qty : 0;
    const result = await updateFinishedProductStockRecord(id, {
      productName: editForm.productName.trim(),
      quantityProduced: qty,
      productionCost: n(editForm.productionCost),
      laborCost: n(editForm.laborCost),
      packagingCost: n(editForm.packagingCost),
      transportCost: n(editForm.transportCost),
      otherExpenses: n(editForm.otherExpenses),
      customExpenses: editCustomExpenses,
      totalProductionCost,
      costPerUnit,
    });
    setEditSaving(false);
    if (result.success) {
      setEditingId(null);
      setRecords(await getFinishedProductStockRecords());
    }
  };

  const f = (field: keyof typeof FP_DEFAULTS, val: string) =>
    setForm((prev) => ({ ...prev, [field]: val }));

  const ef = (field: keyof typeof FP_DEFAULTS, val: string) =>
    setEditForm((prev) => ({ ...prev, [field]: val }));

  if (loading) return <div className="py-16 text-center text-gray-500">Loading…</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{records.length} record{records.length !== 1 ? "s" : ""}</p>
        <button
          onClick={() => { setShowForm((v) => !v); resetForm(); }}
          className="flex items-center gap-1.5 bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Record
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-teal-50 border border-teal-200 rounded-xl p-5 space-y-5">
          <h3 className="text-sm font-bold text-teal-900 uppercase tracking-wide">New Finished Product Record</h3>
          {error && (
            <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div className="lg:col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Product Name *</label>
              <input type="text" required value={form.productName} onChange={(e) => f("productName", e.target.value)}
                placeholder="e.g. Bread, Juice, Soap"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Quantity Produced *</label>
              <input type="number" min="0" step="any" required value={form.quantityProduced}
                onChange={(e) => f("quantityProduced", e.target.value)} placeholder="Number of units made"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Production Cost (Frw)</label>
              <input type="number" min="0" step="any" value={form.productionCost}
                onChange={(e) => f("productionCost", e.target.value)} placeholder="Cost of materials"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Labor Cost (Frw)</label>
              <input type="number" min="0" step="any" value={form.laborCost}
                onChange={(e) => f("laborCost", e.target.value)} placeholder="Workers"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Packaging Cost (Frw)</label>
              <input type="number" min="0" step="any" value={form.packagingCost}
                onChange={(e) => f("packagingCost", e.target.value)} placeholder="Boxes, bags"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Transport Cost (Frw)</label>
              <input type="number" min="0" step="any" value={form.transportCost}
                onChange={(e) => f("transportCost", e.target.value)} placeholder="Delivery"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Other Expenses (Frw)</label>
              <input type="number" min="0" step="any" value={form.otherExpenses}
                onChange={(e) => f("otherExpenses", e.target.value)} placeholder="Miscellaneous"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
            </div>
          </div>

          <div className="border-t border-teal-200 pt-4">
            <CustomExpensesEditor expenses={customExpenses} onChange={setCustomExpenses} accentColor="teal" />
          </div>

          {totalProductionCost > 0 && (
            <div className="border-t border-teal-200 pt-4">
              <div className="bg-teal-700 rounded-lg p-3 inline-block">
                <p className="text-xs text-teal-200">Total Production Cost</p>
                <p className="text-base font-bold text-white">{frw(totalProductionCost)}</p>
              </div>
            </div>
          )}

          <div className="flex gap-2 justify-end border-t border-teal-200 pt-4">
            <button type="button" onClick={() => { setShowForm(false); resetForm(); }}
              className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
            <button type="submit" disabled={saving}
              className="px-4 py-2 text-sm bg-teal-700 hover:bg-teal-800 text-white font-semibold rounded-lg transition-colors disabled:opacity-60">
              {saving ? "Saving…" : "Save Record"}
            </button>
          </div>
        </form>
      )}

      {/* Table */}
      {records.length === 0 ? (
        <div className="bg-gray-50 rounded-xl p-10 text-center border border-dashed border-gray-300">
          <BoxesIcon className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500 text-sm">No finished product records yet. Click "Add Record" to start.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
          <table className="w-full text-xs border-collapse min-w-[960px]">
            <thead>
              <tr className="bg-teal-700 text-white">
                {["","#","Product Name","Qty Produced","Prod. Cost","Labor","Packaging","Transport","Other","Extra","Total Cost","Date",""].map((h, i) => (
                  <th key={i} className="px-3 py-2.5 text-left font-semibold whitespace-nowrap border-r border-teal-600 last:border-r-0">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {records.map((r, i) => (
                <>
                  <tr key={r.id}
                    className={`border-b border-gray-100 hover:bg-teal-50/40 transition-colors cursor-pointer ${i % 2 === 0 ? "bg-teal-50/20" : "bg-white"}`}
                    onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}
                  >
                    <td className="px-2 py-2 text-teal-400">
                      {expandedId === r.id ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                    </td>
                    <td className="px-3 py-2 text-gray-400 font-mono">{i + 1}</td>
                    <td className="px-3 py-2 font-semibold text-teal-900 whitespace-nowrap">{r.productName}</td>
                    <td className="px-3 py-2 text-right">{r.quantityProduced.toLocaleString()}</td>
                    <td className="px-3 py-2 text-right">{frw(r.productionCost)}</td>
                    <td className="px-3 py-2 text-right">{frw(r.laborCost)}</td>
                    <td className="px-3 py-2 text-right">{frw(r.packagingCost)}</td>
                    <td className="px-3 py-2 text-right">{frw(r.transportCost)}</td>
                    <td className="px-3 py-2 text-right">{frw(r.otherExpenses)}</td>
                    <td className="px-3 py-2 text-right text-purple-700">
                      {(r.customExpenses ?? []).length > 0
                        ? frw((r.customExpenses ?? []).reduce((s, e) => s + e.amount, 0))
                        : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-3 py-2 text-right font-bold text-teal-900">{frw(r.totalProductionCost)}</td>
                    <td className="px-3 py-2 text-gray-400 whitespace-nowrap">{new Date(r.createdAt).toLocaleDateString()}</td>
                    <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1">
                        <button onClick={() => editingId === r.id ? setEditingId(null) : startEdit(r)}
                          className="text-blue-400 hover:text-blue-600 transition-colors p-1 rounded" title="Edit">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDelete(r.id)}
                          className="text-red-400 hover:text-red-600 transition-colors p-1 rounded" title="Delete">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* Edit row */}
                  {editingId === r.id && (
                    <tr key={`${r.id}-edit`} className="bg-blue-50 border-b border-blue-200">
                      <td colSpan={13} className="px-6 py-5">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-bold text-blue-800 uppercase tracking-wide">Edit Record</p>
                            <button onClick={() => setEditingId(null)} className="text-gray-400 hover:text-gray-600">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                            <div className="lg:col-span-2">
                              <label className="block text-xs font-medium text-gray-600 mb-1">Product Name</label>
                              <input type="text" value={editForm.productName} onChange={(e) => ef("productName", e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">Qty Produced</label>
                              <input type="number" min="0" step="any" value={editForm.quantityProduced} onChange={(e) => ef("quantityProduced", e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">Production Cost (Frw)</label>
                              <input type="number" min="0" step="any" value={editForm.productionCost} onChange={(e) => ef("productionCost", e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">Labor Cost (Frw)</label>
                              <input type="number" min="0" step="any" value={editForm.laborCost} onChange={(e) => ef("laborCost", e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">Packaging Cost (Frw)</label>
                              <input type="number" min="0" step="any" value={editForm.packagingCost} onChange={(e) => ef("packagingCost", e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">Transport Cost (Frw)</label>
                              <input type="number" min="0" step="any" value={editForm.transportCost} onChange={(e) => ef("transportCost", e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">Other Expenses (Frw)</label>
                              <input type="number" min="0" step="any" value={editForm.otherExpenses} onChange={(e) => ef("otherExpenses", e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                            </div>
                          </div>
                          <CustomExpensesEditor expenses={editCustomExpenses} onChange={setEditCustomExpenses} accentColor="teal" />
                          <div className="flex gap-2 justify-end pt-2 border-t border-blue-200">
                            <button type="button" onClick={() => setEditingId(null)}
                              className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
                            <button type="button" onClick={() => handleEditSubmit(r.id)} disabled={editSaving}
                              className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-60">
                              {editSaving ? "Saving…" : "Save Changes"}
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}

                  {expandedId === r.id && (
                    <tr key={`${r.id}-detail`} className="bg-teal-50/30 border-b border-teal-200">
                      <td colSpan={13} className="px-6 py-5">
                        <div>
                          <p className="text-xs font-semibold text-teal-700 mb-2 uppercase tracking-wide">Stock Movements</p>
                          <MovementLog
                            recordId={r.id}
                            recordName={r.productName}
                            unit="Piece"
                            type="finished"
                            initialQty={r.quantityProduced}
                          />
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
          <p className="text-xs text-gray-400 px-3 py-2">Click a row to see cost breakdown and record stock IN / OUT movements</p>
        </div>
      )}
    </div>
  );
}

// ─── All Movements Tab ───────────────────────────────────────────────────────

interface MovementEvent {
  id: string;
  type: "raw" | "finished";
  recordName: string;
  unit: string;
  movement: "in" | "out";
  quantity: number;
  notes?: string;
  date: string;
  createdAt: string;
  isInitial?: boolean;
}

function AllMovementsTab() {
  const [events, setEvents] = useState<MovementEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"all" | "raw" | "finished">("all");
  const [dirFilter, setDirFilter] = useState<"all" | "in" | "out">("all");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [rawRecords, fpRecords, movements] = await Promise.all([
        getRawMaterialRecords(),
        getFinishedProductStockRecords(),
        getStockMovements(),
      ]);

      // Treat each record creation as an initial Stock IN event
      const initialEvents: MovementEvent[] = [
        ...rawRecords.map((r) => ({
          id: `init-raw-${r.id}`,
          type: "raw" as const,
          recordName: r.materialName,
          unit: r.unit,
          movement: "in" as const,
          quantity: r.quantityPurchased,
          notes: "Initial purchase",
          date: r.createdAt,
          createdAt: r.createdAt,
          isInitial: true,
        })),
        ...fpRecords.map((r) => ({
          id: `init-fp-${r.id}`,
          type: "finished" as const,
          recordName: r.productName,
          unit: "Piece",
          movement: "in" as const,
          quantity: r.quantityProduced,
          notes: "Initial production",
          date: r.createdAt,
          createdAt: r.createdAt,
          isInitial: true,
        })),
      ];

      // Actual IN/OUT movements
      const movementEvents: MovementEvent[] = movements.map((m) => ({
        id: m.id,
        type: m.type,
        recordName: m.recordName,
        unit: m.unit,
        movement: m.movement,
        quantity: m.quantity,
        notes: m.notes,
        date: m.date,
        createdAt: m.createdAt,
        isInitial: false,
      }));

      // Combine and sort newest first
      const all = [...initialEvents, ...movementEvents].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      setEvents(all);
    } catch (err) {
      console.error("AllMovementsTab load error:", err);
      setError("Failed to load movements. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = events.filter((m) => {
    if (filter !== "all" && m.type !== filter) return false;
    if (dirFilter !== "all" && m.movement !== dirFilter) return false;
    return true;
  });

  const totalIn = filtered.filter((m) => m.movement === "in").reduce((s, m) => s + m.quantity, 0);
  const totalOut = filtered.filter((m) => m.movement === "out").reduce((s, m) => s + m.quantity, 0);

  if (loading) return <div className="py-16 text-center text-gray-500">Loading…</div>;

  if (error) return (
    <div className="py-10 text-center">
      <p className="text-red-500 text-sm mb-3">{error}</p>
      <button onClick={load} className="text-sm px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors">
        Try Again
      </button>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
          <ArrowDownCircle className="w-6 h-6 text-emerald-600 mx-auto mb-1" />
          <p className="text-xs text-emerald-600 font-medium">Total Movements IN</p>
          <p className="text-xl font-bold text-emerald-700">{totalIn.toLocaleString()}</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
          <ArrowUpCircle className="w-6 h-6 text-red-500 mx-auto mb-1" />
          <p className="text-xs text-red-600 font-medium">Total Movements OUT</p>
          <p className="text-xl font-bold text-red-600">{totalOut.toLocaleString()}</p>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center">
          <Clock className="w-6 h-6 text-gray-400 mx-auto mb-1" />
          <p className="text-xs text-gray-500 font-medium">Total Events</p>
          <p className="text-xl font-bold text-gray-700">{filtered.length}</p>
        </div>
      </div>

      {/* Filters + Refresh */}
      <div className="flex flex-wrap gap-2 items-center">
        {(["all","raw","finished"] as const).map((v) => (
          <button key={v} onClick={() => setFilter(v)}
            className={`text-xs px-3 py-1.5 rounded-full font-semibold border transition-colors ${
              filter === v ? "bg-slate-700 text-white border-slate-700" : "border-gray-300 text-gray-600 hover:bg-gray-50"
            }`}>
            {v === "all" ? "All Types" : v === "raw" ? "Raw Materials" : "Finished Products"}
          </button>
        ))}
        <div className="w-px bg-gray-200 mx-1" />
        {(["all","in","out"] as const).map((v) => (
          <button key={v} onClick={() => setDirFilter(v)}
            className={`text-xs px-3 py-1.5 rounded-full font-semibold border transition-colors ${
              dirFilter === v
                ? v === "in" ? "bg-emerald-600 text-white border-emerald-600"
                : v === "out" ? "bg-red-500 text-white border-red-500"
                : "bg-slate-700 text-white border-slate-700"
                : "border-gray-300 text-gray-600 hover:bg-gray-50"
            }`}>
            {v === "all" ? "All Directions" : v === "in" ? "IN only" : "OUT only"}
          </button>
        ))}
        <div className="ml-auto">
          <button onClick={load}
            className="text-xs px-3 py-1.5 rounded-full font-semibold border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors flex items-center gap-1">
            ↻ Refresh
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-gray-50 rounded-xl p-10 text-center border border-dashed border-gray-300">
          <Clock className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500 text-sm">No stock records found. Add raw material or finished product records first.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
          <table className="w-full text-xs border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-gray-700 text-white">
                {["#","Date","Type","Material / Product","Direction","Qty","Unit","Notes","Recorded At"].map((h, i) => (
                  <th key={i} className="px-3 py-2.5 text-left font-semibold whitespace-nowrap border-r border-gray-600 last:border-r-0">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((m, i) => (
                <tr key={m.id} className={`border-b border-gray-100 ${i % 2 === 0 ? "bg-white" : "bg-gray-50"}`}>
                  <td className="px-3 py-2 text-gray-400 font-mono">{i + 1}</td>
                  <td className="px-3 py-2 text-gray-700 whitespace-nowrap">
                    {new Date(m.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                  </td>
                  <td className="px-3 py-2">
                    <span className={`px-1.5 py-0.5 rounded text-xs font-semibold ${m.type === "raw" ? "bg-slate-100 text-slate-700" : "bg-teal-100 text-teal-700"}`}>
                      {m.type === "raw" ? "Raw" : "Finished"}
                    </span>
                  </td>
                  <td className="px-3 py-2 font-semibold text-gray-800 whitespace-nowrap">{m.recordName}</td>
                  <td className="px-3 py-2">
                    {m.movement === "in" ? (
                      <span className="inline-flex items-center gap-1 text-emerald-700 font-bold">
                        <TrendingDown className="w-3 h-3" /> IN
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-red-600 font-bold">
                        <TrendingUp className="w-3 h-3" /> OUT
                      </span>
                    )}
                  </td>
                  <td className={`px-3 py-2 text-right font-bold whitespace-nowrap ${m.movement === "in" ? "text-emerald-700" : "text-red-600"}`}>
                    {m.movement === "in" ? "+" : "−"}{m.quantity.toLocaleString()}
                  </td>
                  <td className="px-3 py-2 text-gray-500">{m.unit}</td>
                  <td className="px-3 py-2 text-gray-500">
                    {m.isInitial
                      ? <span className="inline-block bg-blue-100 text-blue-700 text-[10px] font-semibold px-1.5 py-0.5 rounded">{m.notes}</span>
                      : m.notes || <span className="text-gray-300">—</span>
                    }
                  </td>
                  <td className="px-3 py-2 text-gray-400 whitespace-nowrap">
                    {new Date(m.createdAt).toLocaleString("en-GB", { dateStyle: "short", timeStyle: "short" })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Main ────────────────────────────────────────────────────────────────────

export default function StockRecords() {
  const [activeTab, setActiveTab] = useState<"raw" | "finished" | "movements">("raw");

  const tabs = [
    { id: "raw" as const, label: "Raw Materials", icon: Layers },
    { id: "finished" as const, label: "Finished Products", icon: BoxesIcon },
    { id: "movements" as const, label: "All Movements", icon: Clock },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-xl overflow-hidden shadow-lg border border-gray-200">
        <div className="bg-slate-800 text-white px-6 py-4">
          <h2 className="text-2xl font-black tracking-widest uppercase">Stock Records</h2>
          <p className="text-slate-300 text-sm mt-0.5">
            Track raw materials and finished products — record every IN and OUT movement
          </p>
        </div>

        <div className="bg-white border-b border-gray-200 flex">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-6 py-3.5 text-sm font-semibold border-b-2 transition-colors ${
                activeTab === id
                  ? id === "raw" ? "border-slate-700 text-slate-800"
                  : id === "finished" ? "border-teal-700 text-teal-800"
                  : "border-gray-700 text-gray-800"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}>
              <Icon className="w-4 h-4" /> {label}
            </button>
          ))}
        </div>

        <div className="bg-white p-6">
          {activeTab === "raw" && <RawMaterialsTab />}
          {activeTab === "finished" && <FinishedProductsTab />}
          {activeTab === "movements" && <AllMovementsTab />}
        </div>
      </div>
    </div>
  );
}
