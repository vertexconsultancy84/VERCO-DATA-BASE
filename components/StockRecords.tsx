"use client";

import { useState, useEffect, useMemo, useCallback, Fragment } from "react";
import {
  Layers, BoxesIcon, Plus, Trash2, AlertCircle,
  ChevronDown, ChevronRight, ArrowDownCircle, ArrowUpCircle,
  Clock, TrendingUp, TrendingDown, Pencil, X, Warehouse, Check, Download,
  ImagePlus, ImageIcon, CheckCircle2, EyeOff, History,
} from "lucide-react";
import {
  getRawMaterialRecords,
  saveRawMaterialRecord,
  updateRawMaterialRecord,
  updateRawMaterialCostPerUnit,
  updateRawMaterialDesiredProfit,
  deleteRawMaterialRecord,
  getFinishedProductStockRecords,
  saveFinishedProductStockRecord,
  updateFinishedProductStockRecord,
  patchFinishedProductStockRecord,
  publishFinishedProductToMarketplace,
  deleteFinishedProductStockRecord,
  getStockMovements,
  saveStockMovement,
  deleteStockMovement,
  getRawMaterialStockItems,
  saveRawMaterialStockItem,
  updateRawMaterialStockItem,
  deleteRawMaterialStockItem,
  type RawMaterialRecord,
  type FinishedProductStockRecord,
  type CustomExpense,
  type StockMovement,
  type RawMaterialStockItem,
} from "@/app/actions/industry";
import StockInventoryDashboard from "@/components/StockInventoryDashboard";

const frw = (n: number) =>
  "Frw " + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// A raw material's selling price (cost + desired profit). Finished products are
// costed from this so the raw materials' profit flows into the finished product.
const rawSellingPrice = (r: RawMaterialRecord) =>
  r.sellingPrice ?? r.totalCost + (r.desiredProfit ?? 0);

const UNITS = ["Kg", "Liter", "Piece", "Meter", "Ton", "Box", "Bag", "Bottle", "Other"];

function newExpense(): CustomExpense {
  return { id: crypto.randomUUID(), label: "", amount: 0 };
}

function today() {
  return new Date().toISOString().split("T")[0];
}

// Read a chosen image file into a base64 data URL (stored straight on the record).
// Rejects non-images and anything over 2MB so records stay light.
function readImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const allowed = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowed.includes(file.type)) {
      reject(new Error("Use a JPEG, PNG, GIF or WebP image."));
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      reject(new Error("Image must be under 2MB."));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Could not read the image."));
    reader.readAsDataURL(file);
  });
}

// ─── PDF table download ──────────────────────────────────────────────────────

interface PdfColumn { header: string; width: number; align?: "left" | "right" }

async function downloadTablePDF(opts: {
  title: string;
  filename: string;
  columns: PdfColumn[];
  rows: (string | number)[][];
}) {
  const { default: jsPDF } = await import("jspdf");
  const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

  const PW = 297, PH = 210, M = 10;
  const usableW = PW - 2 * M;
  const ROW_H = 8;
  const navy: [number, number, number] = [30, 58, 95];
  const white: [number, number, number] = [255, 255, 255];
  const light: [number, number, number] = [248, 250, 252];

  // scale the supplied column widths so the table always fills the usable width
  const totalW = opts.columns.reduce((s, c) => s + c.width, 0);
  const scale = usableW / totalW;
  const cols = opts.columns.map((c) => ({ ...c, w: c.width * scale }));

  const trunc = (s: string, max: number) => (s.length > max ? s.slice(0, max - 1) + "…" : s);

  const drawRow = (cells: (string | number)[], y: number, bold: boolean) => {
    let x = M + 1.5;
    cols.forEach((c, ci) => {
      const text = trunc(String(cells[ci] ?? ""), Math.max(3, Math.floor(c.w / 1.5)));
      if (c.align === "right") {
        pdf.text(text, x + c.w - 3, y + ROW_H - 2, { align: "right" });
      } else {
        pdf.text(text, x, y + ROW_H - 2);
      }
      x += c.w;
    });
    void bold;
  };

  const drawHeader = (y: number) => {
    pdf.setFillColor(...navy);
    pdf.rect(M, y, usableW, ROW_H, "F");
    pdf.setTextColor(...white);
    pdf.setFontSize(6.5);
    pdf.setFont("helvetica", "bold");
    drawRow(cols.map((c) => c.header), y, true);
  };

  // Page title bar
  pdf.setFillColor(...navy);
  pdf.rect(0, 0, PW, 18, "F");
  pdf.setTextColor(...white);
  pdf.setFontSize(13);
  pdf.setFont("helvetica", "bold");
  pdf.text(opts.title, M, 12);
  pdf.setFontSize(7.5);
  pdf.setFont("helvetica", "normal");
  pdf.text(
    `${opts.rows.length} record${opts.rows.length !== 1 ? "s" : ""}  |  Generated: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`,
    PW - M, 12, { align: "right" }
  );

  let y = 24;
  drawHeader(y);
  y += ROW_H;
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(6);

  opts.rows.forEach((row, i) => {
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
    drawRow(row, y, false);
    y += ROW_H;
  });

  pdf.setFontSize(7);
  pdf.setTextColor(160, 160, 160);
  pdf.setFont("helvetica", "normal");
  pdf.text("Vertex Management System", M, PH - 4);

  pdf.save(`${opts.filename}-${today()}.pdf`);
}

function DownloadButton({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled}
      className="flex items-center gap-1.5 border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-semibold px-4 py-2 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
      <Download className="w-4 h-4" /> Download PDF
    </button>
  );
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
  onChange,
}: {
  recordId: string;
  recordName: string;
  unit: string;
  type: "raw" | "finished";
  initialQty: number;
  onChange?: () => void;
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
    onChange?.();
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this movement?")) return;
    await deleteStockMovement(id);
    await load();
    onChange?.();
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
  desiredProfit: "",
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
  // inline desired-profit editing: map of recordId → draft string value
  const [dpDraft, setDpDraft] = useState<Record<string, string>>({});
  const [dpSaving, setDpSaving] = useState<Record<string, boolean>>({});
  const [dpSaved, setDpSaved] = useState<Record<string, boolean>>({});
  const [movements, setMovements] = useState<StockMovement[]>([]);
  // materials available in the Stock of Materials list, to pick from
  const [stockItems, setStockItems] = useState<RawMaterialStockItem[]>([]);
  const [selectedStockId, setSelectedStockId] = useState("");

  const loadMovements = useCallback(async () => {
    setMovements(await getStockMovements());
  }, []);

  useEffect(() => {
    getRawMaterialRecords().then((r) => { setRecords(r); setLoading(false); });
    getRawMaterialStockItems().then(setStockItems);
    loadMovements();
  }, [loadMovements]);

  // when a material is chosen from stock, pre-fill name and clear the quantity
  // so the manager enters how much to use (the purchase price derives from it)
  const handleSelectStock = (id: string) => {
    setSelectedStockId(id);
    const item = stockItems.find((s) => s.id === id);
    if (!item) return;
    setForm((prev) => ({
      ...prev,
      materialName: item.materialName,
      quantityPurchased: "",
      purchasePrice: "",
    }));
  };

  // current stock per record = initial purchased + total IN − total OUT
  const currentStockMap = useMemo(() => {
    const map: Record<string, number> = {};
    for (const r of records) {
      const recMoves = movements.filter((m) => m.recordId === r.id);
      const totalIn = recMoves.filter((m) => m.movement === "in").reduce((s, m) => s + m.quantity, 0);
      const totalOut = recMoves.filter((m) => m.movement === "out").reduce((s, m) => s + m.quantity, 0);
      map[r.id] = r.quantityPurchased + totalIn - totalOut;
    }
    return map;
  }, [records, movements]);

  const n = (v: string) => parseFloat(v) || 0;

  // the stock material currently chosen in the calculator, with its remaining qty
  const selectedStock = stockItems.find((s) => s.id === selectedStockId);
  const availableStock = selectedStock?.quantityRemaining ?? 0;
  const quantityToUse = n(form.quantityPurchased);
  const remainingStock = availableStock - quantityToUse;

  // entering a quantity to use derives the purchase price from the per-unit amount
  const handleQuantityChange = (val: string) => {
    setForm((prev) => {
      const next = { ...prev, quantityPurchased: val };
      if (selectedStock) next.purchasePrice = String((parseFloat(val) || 0) * selectedStock.amount);
      return next;
    });
  };

  const totalCost = useMemo(() => {
    const fixed = n(form.purchasePrice) + n(form.tax) + n(form.transportCost) + n(form.otherExpenses);
    return fixed + customExpenses.reduce((s, e) => s + e.amount, 0);
  }, [form.purchasePrice, form.tax, form.transportCost, form.otherExpenses, customExpenses]);

  const costPerUnit = useMemo(() => {
    const qty = n(form.quantityPurchased);
    return qty > 0 ? totalCost / qty : 0;
  }, [totalCost, form.quantityPurchased]);

  // desired profit added on top of the cost → selling price
  const sellingPrice = useMemo(
    () => totalCost + n(form.desiredProfit),
    [totalCost, form.desiredProfit]
  );
  const sellingPricePerUnit = useMemo(() => {
    const qty = n(form.quantityPurchased);
    return qty > 0 ? sellingPrice / qty : 0;
  }, [sellingPrice, form.quantityPurchased]);

  const breakdownRows: BreakdownRow[] = [
    { label: "Purchase Price", amount: n(form.purchasePrice) },
    { label: "Tax", amount: n(form.tax) },
    { label: "Transport Cost", amount: n(form.transportCost) },
    { label: "Other Expenses", amount: n(form.otherExpenses) },
    ...customExpenses.map((e) => ({ label: e.label || "Custom", amount: e.amount })),
  ];

  const resetForm = () => { setForm(RAW_DEFAULTS); setCustomExpenses([]); setError(""); setSelectedStockId(""); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!selectedStock) { setError("Please select a raw material from stock."); return; }
    if (quantityToUse <= 0) { setError("Quantity to use must be greater than 0."); return; }
    if (quantityToUse > availableStock) {
      setError(`Only ${availableStock.toLocaleString()} ${form.unit} available in stock.`);
      return;
    }
    setSaving(true);
    const result = await saveRawMaterialRecord({
      materialName: form.materialName.trim(),
      quantityPurchased: quantityToUse,
      unit: form.unit,
      purchasePrice: n(form.purchasePrice),
      tax: n(form.tax),
      transportCost: n(form.transportCost),
      otherExpenses: n(form.otherExpenses),
      customExpenses,
      totalCost,
      costPerUnit,
      desiredProfit: n(form.desiredProfit),
      sellingPrice,
      currentStock: quantityToUse,
    });
    if (result.success) {
      // reduce the chosen material's remaining quantity in the Stock of Materials list
      // (the original purchased quantity stays intact for reference)
      await updateRawMaterialStockItem(selectedStock.id, {
        materialName: selectedStock.materialName,
        quantityPurchased: selectedStock.quantityPurchased,
        quantityRemaining: Math.max(0, availableStock - quantityToUse),
        amount: selectedStock.amount,
      });
      setStockItems(await getRawMaterialStockItems());
      setSaving(false);
      resetForm(); setShowForm(false);
      setRecords(await getRawMaterialRecords());
    } else { setSaving(false); setError(result.message || "Failed to save."); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this record and all its movements?")) return;
    await deleteRawMaterialRecord(id);
    setRecords((prev) => prev.filter((r) => r.id !== id));
  };

  // Commit the edited desired profit for a record and roll it into the selling price.
  const saveDesiredProfit = async (r: RawMaterialRecord) => {
    const val = parseFloat(dpDraft[r.id] ?? String(r.desiredProfit ?? 0));
    if (isNaN(val)) return;
    setDpSaving((p) => ({ ...p, [r.id]: true }));
    const res = await updateRawMaterialDesiredProfit(r.id, val);
    setDpSaving((p) => { const x = { ...p }; delete x[r.id]; return x; });
    if (res.success) {
      const sellingPrice = res.sellingPrice ?? r.totalCost + val;
      setRecords((prev) => prev.map((rec) => rec.id === r.id ? { ...rec, desiredProfit: val, sellingPrice } : rec));
      setDpDraft((p) => { const x = { ...p }; delete x[r.id]; return x; });
      setDpSaved((p) => ({ ...p, [r.id]: true }));
      setTimeout(() => setDpSaved((p) => { const x = { ...p }; delete x[r.id]; return x; }), 2000);
    }
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
      desiredProfit: r.desiredProfit != null ? String(r.desiredProfit) : "",
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
      desiredProfit: n(editForm.desiredProfit),
      sellingPrice: totalCost + n(editForm.desiredProfit),
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

  const handleDownload = () =>
    downloadTablePDF({
      title: "Raw Material Calculator Records",
      filename: "raw-material-records",
      columns: [
        { header: "#", width: 6 },
        { header: "Material Name", width: 26 },
        { header: "Qty Used", width: 14, align: "right" },
        { header: "Current Stock", width: 16, align: "right" },
        { header: "Unit", width: 12 },
        { header: "Purchase Price", width: 18, align: "right" },
        { header: "Tax", width: 14, align: "right" },
        { header: "Transport", width: 16, align: "right" },
        { header: "Other", width: 14, align: "right" },
        { header: "Extra", width: 14, align: "right" },
        { header: "Total Cost", width: 18, align: "right" },
        { header: "Cost/Unit", width: 16, align: "right" },
        { header: "Profit", width: 16, align: "right" },
        { header: "Selling Price", width: 18, align: "right" },
        { header: "Date", width: 18 },
      ],
      rows: records.map((r, i) => [
        i + 1,
        r.materialName,
        r.quantityPurchased.toLocaleString(),
        (currentStockMap[r.id] ?? r.quantityPurchased).toLocaleString(),
        r.unit,
        frw(r.purchasePrice),
        frw(r.tax),
        frw(r.transportCost),
        frw(r.otherExpenses),
        frw((r.customExpenses ?? []).reduce((s, e) => s + e.amount, 0)),
        frw(r.totalCost),
        frw(r.costPerUnit),
        frw(r.desiredProfit ?? 0),
        frw(r.sellingPrice ?? r.totalCost + (r.desiredProfit ?? 0)),
        new Date(r.createdAt).toLocaleDateString(),
      ]),
    });

  if (loading) return <div className="py-16 text-center text-gray-500">Loading…</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{records.length} record{records.length !== 1 ? "s" : ""}</p>
        <div className="flex items-center gap-2">
          <DownloadButton onClick={handleDownload} disabled={records.length === 0} />
          <button
            onClick={() => { setShowForm((v) => !v); resetForm(); }}
            className="flex items-center gap-1.5 bg-slate-700 hover:bg-slate-800 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" /> Select from Stock
          </button>
        </div>
      </div>

      {/* Add form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-5">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Calculate Cost from Stock Material</h3>
          {error && (
            <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}
          {stockItems.length === 0 && (
            <div className="flex items-center gap-2 text-amber-700 text-sm bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              No materials in stock yet. Add them in the <strong>Stock of Materials</strong> tab first.
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div className="lg:col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Select Raw Material from Stock *</label>
              <select required value={selectedStockId} onChange={(e) => handleSelectStock(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-400 disabled:bg-gray-100"
                disabled={stockItems.length === 0}>
                <option value="">— Choose a material —</option>
                {stockItems.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.materialName} — {s.quantityRemaining.toLocaleString()} of {s.quantityPurchased.toLocaleString()} left @ {frw(s.amount)}/unit
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Unit *</label>
              <select value={form.unit} onChange={(e) => f("unit", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400">
                {UNITS.map((u) => <option key={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Quantity to Use *
                {selectedStock && (
                  <span className="ml-1 font-normal text-gray-400">
                    (available {availableStock.toLocaleString()} {form.unit})
                  </span>
                )}
              </label>
              <input type="number" min="0" max={availableStock} step="any" required value={form.quantityPurchased}
                onChange={(e) => handleQuantityChange(e.target.value)} placeholder="0"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Remaining in Stock</label>
              <div className={`w-full border rounded-lg px-3 py-2 text-sm font-semibold ${
                !selectedStock
                  ? "border-gray-200 bg-gray-50 text-gray-400"
                  : remainingStock < 0
                  ? "border-red-300 bg-red-50 text-red-600"
                  : "border-emerald-200 bg-emerald-50 text-emerald-700"
              }`}>
                {selectedStock ? `${remainingStock.toLocaleString()} ${form.unit}` : "—"}
              </div>
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
            <div>
              <label className="block text-xs font-medium text-emerald-700 mb-1">Desired Profit (Frw)</label>
              <input type="number" min="0" step="any" value={form.desiredProfit}
                onChange={(e) => f("desiredProfit", e.target.value)} placeholder="Profit to add on cost"
                className="w-full border border-emerald-300 bg-emerald-50/40 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
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
                <div className="bg-white border border-emerald-200 rounded-lg p-3">
                  <p className="text-xs text-emerald-600">Desired Profit</p>
                  <p className="text-base font-bold text-emerald-700">{frw(n(form.desiredProfit))}</p>
                </div>
                <div className="bg-emerald-600 rounded-lg p-3">
                  <p className="text-xs text-emerald-100">Selling Price {sellingPricePerUnit > 0 && <span className="font-normal">({frw(sellingPricePerUnit)}/unit)</span>}</p>
                  <p className="text-base font-bold text-white">{frw(sellingPrice)}</p>
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
                {["","#","Material Name","Qty Used from Stock","Current Stock","Unit","Purchase Price","Tax","Transport","Other","Extra","Total Cost","Cost/Unit ✎","Desired Profit ✎","Selling Price","Date",""].map((h, i) => (
                  <th key={i} className="px-3 py-2.5 text-left font-semibold whitespace-nowrap border-r border-slate-600 last:border-r-0">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {records.map((r, i) => (
                <Fragment key={r.id}>
                  <tr
                    className={`border-b border-gray-100 hover:bg-slate-50 transition-colors cursor-pointer ${i % 2 === 0 ? "bg-slate-50/50" : "bg-white"}`}
                    onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}
                  >
                    <td className="px-2 py-2 text-slate-400">
                      {expandedId === r.id ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                    </td>
                    <td className="px-3 py-2 text-gray-400 font-mono">{i + 1}</td>
                    <td className="px-3 py-2 font-semibold text-slate-800 whitespace-nowrap">{r.materialName}</td>
                    <td className="px-3 py-2 text-right">{r.quantityPurchased.toLocaleString()}</td>
                    {(() => {
                      const current = currentStockMap[r.id] ?? r.quantityPurchased;
                      const color = current <= 0 ? "text-red-600" : current < r.quantityPurchased * 0.2 ? "text-amber-600" : "text-emerald-600";
                      return <td className={`px-3 py-2 text-right font-bold ${color}`}>{current.toLocaleString()}</td>;
                    })()}
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
                    {/* Desired profit (editable) + explicit Save Changes */}
                    <td className="p-1 bg-emerald-50/60" onClick={(e) => e.stopPropagation()}>
                      {(() => {
                        const draftVal = dpDraft[r.id];
                        const dirty = draftVal !== undefined && parseFloat(draftVal || "0") !== (r.desiredProfit ?? 0);
                        return (
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min="0"
                              step="any"
                              value={draftVal ?? (r.desiredProfit ?? 0)}
                              onChange={(e) => setDpDraft((prev) => ({ ...prev, [r.id]: e.target.value }))}
                              onKeyDown={(e) => { if (e.key === "Enter") saveDesiredProfit(r); }}
                              className="w-20 text-right font-bold text-emerald-700 bg-white border border-emerald-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-emerald-400 text-xs"
                            />
                            <button
                              type="button"
                              onClick={() => saveDesiredProfit(r)}
                              disabled={dpSaving[r.id] || !dirty}
                              title="Save changes (add profit to selling price)"
                              className={`shrink-0 inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-1 rounded transition-colors ${
                                dpSaved[r.id]
                                  ? "bg-emerald-100 text-emerald-700"
                                  : dirty
                                  ? "bg-emerald-600 text-white hover:bg-emerald-700"
                                  : "bg-gray-100 text-gray-400 cursor-default"
                              }`}
                            >
                              {dpSaving[r.id]
                                ? "…"
                                : dpSaved[r.id]
                                ? <><CheckCircle2 className="w-3 h-3" /> Saved</>
                                : <><Check className="w-3 h-3" /> Save</>}
                            </button>
                          </div>
                        );
                      })()}
                    </td>
                    {/* Selling price = total cost + desired profit (persisted) */}
                    <td className="px-3 py-2 text-right font-bold text-emerald-700 whitespace-nowrap">
                      {frw(r.sellingPrice ?? r.totalCost + (r.desiredProfit ?? 0))}
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
                      <td colSpan={17} className="px-6 py-5">
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
                            <div>
                              <label className="block text-xs font-medium text-emerald-700 mb-1">Desired Profit (Frw)</label>
                              <input type="number" min="0" step="any" value={editForm.desiredProfit} onChange={(e) => ef("desiredProfit", e.target.value)}
                                className="w-full border border-emerald-300 bg-emerald-50/40 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
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
                      <td colSpan={17} className="px-6 py-5">
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
                            {/* Profit → selling price */}
                            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                              <div className="bg-white border border-slate-200 rounded-lg p-2">
                                <p className="text-[10px] text-gray-500 uppercase tracking-wide">Total Cost</p>
                                <p className="text-sm font-bold text-slate-800">{frw(r.totalCost)}</p>
                              </div>
                              <div className="bg-white border border-emerald-200 rounded-lg p-2">
                                <p className="text-[10px] text-emerald-600 uppercase tracking-wide">Desired Profit</p>
                                <p className="text-sm font-bold text-emerald-700">{frw(r.desiredProfit ?? 0)}</p>
                              </div>
                              <div className="bg-emerald-600 rounded-lg p-2">
                                <p className="text-[10px] text-emerald-100 uppercase tracking-wide">Selling Price</p>
                                <p className="text-sm font-bold text-white">{frw(r.sellingPrice ?? r.totalCost + (r.desiredProfit ?? 0))}</p>
                              </div>
                            </div>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">Stock Movements</p>
                            <MovementLog
                              recordId={r.id}
                              recordName={r.materialName}
                              unit={r.unit}
                              type="raw"
                              initialQty={r.quantityPurchased}
                              onChange={loadMovements}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
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
  // supermarket-only fields
  currentStock: "", amountPerUnit: "", recordDate: today(),
  // inventory-management fields
  unitOfMeasure: "Piece", lowStockThreshold: "", reservedStock: "", imageUrl: "",
};

function FinishedProductsTab({ variant = "industry" }: { variant?: "industry" | "supermarket" }) {
  const isSupermarket = variant === "supermarket";
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
  const [movements, setMovements] = useState<StockMovement[]>([]);
  // saved Raw Material Calculator records the manager can pull costs from (industry only)
  const [rawRecords, setRawRecords] = useState<RawMaterialRecord[]>([]);
  const [selectedRawIds, setSelectedRawIds] = useState<string[]>([]);
  // inline editing of low-stock threshold / reserved stock (recordId → draft value)
  const [thrDraft, setThrDraft] = useState<Record<string, string>>({});
  const [resDraft, setResDraft] = useState<Record<string, string>>({});
  const [leadDraft, setLeadDraft] = useState<Record<string, string>>({});
  // image upload feedback for the add form
  const [imgError, setImgError] = useState("");
  const [editImgError, setEditImgError] = useState("");

  const loadMovements = useCallback(async () => {
    setMovements(await getStockMovements());
  }, []);

  useEffect(() => {
    getFinishedProductStockRecords().then((r) => { setRecords(r); setLoading(false); });
    loadMovements();
    if (!isSupermarket) getRawMaterialRecords().then(setRawRecords);
  }, [loadMovements, isSupermarket]);

  // the raw material records selected as inputs to this finished product —
  // the product's name, quantity and cost are all derived from them
  const selectedRaw = useMemo(
    () => rawRecords.filter((r) => selectedRawIds.includes(r.id)),
    [rawRecords, selectedRawIds]
  );
  const selectedRawCost = useMemo(() => selectedRaw.reduce((s, r) => s + rawSellingPrice(r), 0), [selectedRaw]);
  const selectedRawQty = useMemo(() => selectedRaw.reduce((s, r) => s + r.quantityPurchased, 0), [selectedRaw]);
  const selectedRawNames = useMemo(() => selectedRaw.map((r) => r.materialName).join(" + "), [selectedRaw]);

  // picking raw material records auto-fills the production (materials) cost
  const toggleRaw = (id: string) => {
    setSelectedRawIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      const cost = rawRecords.filter((r) => next.includes(r.id)).reduce((s, r) => s + rawSellingPrice(r), 0);
      setForm((f) => ({ ...f, productionCost: cost ? String(cost) : "" }));
      return next;
    });
  };

  // current stock per record = initial produced + total IN − total OUT
  const currentStockMap = useMemo(() => {
    const map: Record<string, number> = {};
    for (const r of records) {
      const recMoves = movements.filter((m) => m.recordId === r.id);
      const totalIn = recMoves.filter((m) => m.movement === "in").reduce((s, m) => s + m.quantity, 0);
      const totalOut = recMoves.filter((m) => m.movement === "out").reduce((s, m) => s + m.quantity, 0);
      // supermarket records carry an explicit on-hand stock as the starting point
      const base = isSupermarket && r.currentStock != null ? r.currentStock : r.quantityProduced;
      map[r.id] = base + totalIn - totalOut;
    }
    return map;
  }, [records, movements, isSupermarket]);

  // most recent IN/OUT movement per record, for the "Recent Trans." column
  const lastMovementMap = useMemo(() => {
    const map: Record<string, StockMovement> = {};
    for (const m of movements) {
      if (m.type !== "finished") continue;
      const prev = map[m.recordId];
      if (!prev || new Date(m.date).getTime() > new Date(prev.date).getTime()) map[m.recordId] = m;
    }
    return map;
  }, [movements]);

  const movementCountMap = useMemo(() => {
    const map: Record<string, number> = {};
    for (const m of movements) {
      if (m.type !== "finished") continue;
      map[m.recordId] = (map[m.recordId] ?? 0) + 1;
    }
    return map;
  }, [movements]);

  const n = (v: string) => parseFloat(v) || 0;

  const resetForm = () => {
    setForm(FP_DEFAULTS); setCustomExpenses([]); setError(""); setSelectedRawIds([]); setImgError("");
  };

  // ── image pickers ──────────────────────────────────────────────────────────
  const handleAddImage = async (file?: File) => {
    setImgError("");
    if (!file) return;
    try { f("imageUrl", await readImageFile(file)); }
    catch (err) { setImgError(err instanceof Error ? err.message : "Could not read image."); }
  };

  const handleEditImage = async (file?: File) => {
    setEditImgError("");
    if (!file) return;
    try { ef("imageUrl", await readImageFile(file)); }
    catch (err) { setEditImgError(err instanceof Error ? err.message : "Could not read image."); }
  };

  // ── inline patch helpers (table) ─────────────────────────────────────────────
  const patchRecord = async (
    id: string,
    data: Partial<Pick<FinishedProductStockRecord, "imageUrl" | "lowStockThreshold" | "reservedStock" | "leadTimeDays" | "published">>
  ) => {
    await patchFinishedProductStockRecord(id, data);
    setRecords((prev) => prev.map((r) => (r.id === id ? { ...r, ...data } : r)));
  };

  const togglePublish = async (r: FinishedProductStockRecord) => {
    const next = !r.published;
    // optimistic
    setRecords((prev) => prev.map((x) => (x.id === r.id ? { ...x, published: next } : x)));
    const res = await publishFinishedProductToMarketplace(r.id, next);
    if (!res.success) {
      // roll back on failure
      setRecords((prev) => prev.map((x) => (x.id === r.id ? { ...x, published: r.published } : x)));
    }
  };

  const handleRowImage = async (id: string, file?: File) => {
    if (!file) return;
    try { await patchRecord(id, { imageUrl: await readImageFile(file) }); }
    catch (err) { alert(err instanceof Error ? err.message : "Could not read image."); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (isSupermarket && !form.productName.trim()) { setError("Product name is required."); return; }
    if (isSupermarket && n(form.quantityProduced) <= 0) { setError("Quantity must be greater than 0."); return; }
    if (!isSupermarket && selectedRawIds.length === 0) {
      setError("Select at least one raw material record from the Raw Material Calculator."); return;
    }
    const qty = n(form.quantityProduced);
    setSaving(true);
    const result = await saveFinishedProductStockRecord(
      isSupermarket
        ? {
            productName: form.productName.trim(),
            quantityProduced: qty,
            productionCost: qty * n(form.amountPerUnit),
            laborCost: 0,
            packagingCost: 0,
            transportCost: 0,
            otherExpenses: n(form.otherExpenses),
            customExpenses: [],
            totalProductionCost: qty * n(form.amountPerUnit) + n(form.otherExpenses),
            costPerUnit: n(form.amountPerUnit),
            currentStock: form.currentStock === "" ? qty : n(form.currentStock),
            recordDate: form.recordDate,
            imageUrl: form.imageUrl || undefined,
            unitOfMeasure: form.unitOfMeasure,
            lowStockThreshold: n(form.lowStockThreshold),
            reservedStock: n(form.reservedStock),
            published: false,
          }
        : {
            // industry finished products are built entirely from saved raw material
            // records — name, quantity and cost are all derived from the selection
            productName: selectedRawNames,
            quantityProduced: selectedRawQty,
            productionCost: selectedRawCost,
            laborCost: 0,
            packagingCost: 0,
            transportCost: 0,
            otherExpenses: 0,
            customExpenses: [],
            totalProductionCost: selectedRawCost,
            costPerUnit: selectedRawQty > 0 ? selectedRawCost / selectedRawQty : 0,
            imageUrl: form.imageUrl || undefined,
            unitOfMeasure: form.unitOfMeasure,
            lowStockThreshold: n(form.lowStockThreshold),
            reservedStock: n(form.reservedStock),
            published: false,
          }
    );
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
      currentStock: r.currentStock != null ? String(r.currentStock) : String(r.quantityProduced),
      amountPerUnit: String(r.costPerUnit),
      recordDate: r.recordDate ?? r.createdAt.split("T")[0],
      unitOfMeasure: r.unitOfMeasure ?? "Piece",
      lowStockThreshold: r.lowStockThreshold != null ? String(r.lowStockThreshold) : "",
      reservedStock: r.reservedStock != null ? String(r.reservedStock) : "",
      imageUrl: r.imageUrl ?? "",
    });
    setEditCustomExpenses(r.customExpenses ?? []);
    setEditImgError("");
  };

  const handleEditSubmit = async (id: string) => {
    setEditSaving(true);
    const qty = n(editForm.quantityProduced);
    let payload;
    if (isSupermarket) {
      const goods = qty * n(editForm.amountPerUnit);
      payload = {
        productName: editForm.productName.trim(),
        quantityProduced: qty,
        productionCost: goods,
        laborCost: 0,
        packagingCost: 0,
        transportCost: 0,
        otherExpenses: n(editForm.otherExpenses),
        customExpenses: [],
        totalProductionCost: goods + n(editForm.otherExpenses),
        costPerUnit: n(editForm.amountPerUnit),
        currentStock: n(editForm.currentStock),
        recordDate: editForm.recordDate,
      };
    } else {
      const fixed = n(editForm.productionCost) + n(editForm.laborCost) + n(editForm.packagingCost) + n(editForm.transportCost) + n(editForm.otherExpenses);
      const extra = editCustomExpenses.reduce((s, e) => s + e.amount, 0);
      const totalProductionCost = fixed + extra;
      const costPerUnit = qty > 0 ? totalProductionCost / qty : 0;
      payload = {
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
      };
    }
    // inventory fields shared by both variants
    payload = {
      ...payload,
      imageUrl: editForm.imageUrl || undefined,
      unitOfMeasure: editForm.unitOfMeasure,
      lowStockThreshold: n(editForm.lowStockThreshold),
      reservedStock: n(editForm.reservedStock),
    };
    const result = await updateFinishedProductStockRecord(id, payload);
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

  const handleDownload = () =>
    downloadTablePDF({
      title: "Finished Products Records",
      filename: "finished-products-records",
      columns: isSupermarket
        ? [
            { header: "#", width: 6 },
            { header: "Product Name", width: 34 },
            { header: "Qty Purchased", width: 18, align: "right" },
            { header: "Current Stock", width: 18, align: "right" },
            { header: "Amount/Unit", width: 20, align: "right" },
            { header: "Other", width: 18, align: "right" },
            { header: "Total", width: 20, align: "right" },
            { header: "Date", width: 18 },
          ]
        : [
            { header: "#", width: 6 },
            { header: "Product Name", width: 40 },
            { header: "Qty Produced", width: 16, align: "right" },
            { header: "Current Stock", width: 16, align: "right" },
            { header: "Prod. Cost", width: 18, align: "right" },
            { header: "Labor", width: 14, align: "right" },
            { header: "Packaging", width: 16, align: "right" },
            { header: "Transport", width: 16, align: "right" },
            { header: "Other", width: 14, align: "right" },
            { header: "Total Cost", width: 18, align: "right" },
            { header: "Date", width: 18 },
          ],
      rows: records.map((r, i) => {
        const current = (currentStockMap[r.id] ?? r.currentStock ?? r.quantityProduced).toLocaleString();
        return isSupermarket
          ? [
              i + 1,
              r.productName,
              r.quantityProduced.toLocaleString(),
              current,
              frw(r.costPerUnit),
              frw(r.otherExpenses),
              frw(r.totalProductionCost),
              new Date(r.recordDate ?? r.createdAt).toLocaleDateString(),
            ]
          : [
              i + 1,
              r.productName,
              r.quantityProduced.toLocaleString(),
              current,
              frw(r.productionCost),
              frw(r.laborCost),
              frw(r.packagingCost),
              frw(r.transportCost),
              frw(r.otherExpenses),
              frw(r.totalProductionCost),
              new Date(r.createdAt).toLocaleDateString(),
            ];
      }),
    });

  if (loading) return <div className="py-16 text-center text-gray-500">Loading…</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{records.length} record{records.length !== 1 ? "s" : ""}</p>
        <div className="flex items-center gap-2">
          <DownloadButton onClick={handleDownload} disabled={records.length === 0} />
          <button
            onClick={() => { setShowForm((v) => !v); resetForm(); }}
            className="flex items-center gap-1.5 bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Record
          </button>
        </div>
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

          {isSupermarket ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div className="lg:col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Product Name *</label>
                  <input type="text" required value={form.productName} onChange={(e) => f("productName", e.target.value)}
                    placeholder="e.g. Bread, Juice, Soap"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Date *</label>
                  <input type="date" required value={form.recordDate}
                    onChange={(e) => f("recordDate", e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Quantity Purchased *</label>
                  <input type="number" min="0" step="any" required value={form.quantityProduced}
                    onChange={(e) => f("quantityProduced", e.target.value)} placeholder="Units bought"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Current Stock</label>
                  <input type="number" min="0" step="any" value={form.currentStock}
                    onChange={(e) => f("currentStock", e.target.value)} placeholder="Defaults to quantity purchased"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Amount / Unit (Frw) *</label>
                  <input type="number" min="0" step="any" required value={form.amountPerUnit}
                    onChange={(e) => f("amountPerUnit", e.target.value)} placeholder="Purchase price per unit"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Other Expenses (Frw)</label>
                  <input type="number" min="0" step="any" value={form.otherExpenses}
                    onChange={(e) => f("otherExpenses", e.target.value)} placeholder="Transport, handling, etc."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
                </div>
              </div>

              {(n(form.quantityProduced) > 0 && n(form.amountPerUnit) > 0) && (
                <div className="border-t border-teal-200 pt-4 grid grid-cols-2 gap-3">
                  <div className="bg-white border border-teal-200 rounded-lg p-3">
                    <p className="text-xs text-gray-500">Amount / Unit</p>
                    <p className="text-base font-bold text-teal-900">{frw(n(form.amountPerUnit))}</p>
                  </div>
                  <div className="bg-teal-700 rounded-lg p-3">
                    <p className="text-xs text-teal-200">Total Amount</p>
                    <p className="text-base font-bold text-white">
                      {frw(n(form.quantityProduced) * n(form.amountPerUnit) + n(form.otherExpenses))}
                    </p>
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
          {/* Finished product built from saved Raw Material Calculator records — the cost comes only from these */}
          <div className="border-t border-teal-200 pt-4 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Finished Product from Raw Materials</p>
              {selectedRawIds.length > 0 && (
                <span className="text-xs font-semibold text-teal-700">
                  {selectedRawIds.length} selected · {frw(selectedRawCost)}
                </span>
              )}
            </div>
            {rawRecords.length === 0 ? (
              <p className="text-xs text-gray-400 italic">
                No saved records yet. Use the <strong>Raw Material Calculator</strong> tab to save records first.
              </p>
            ) : (
              <div className="max-h-44 overflow-y-auto rounded-lg border border-gray-200 divide-y divide-gray-100">
                {rawRecords.map((r) => {
                  const checked = selectedRawIds.includes(r.id);
                  return (
                    <label key={r.id}
                      className={`flex items-center gap-3 px-3 py-2 text-xs cursor-pointer transition-colors ${checked ? "bg-teal-50" : "hover:bg-gray-50"}`}>
                      <input type="checkbox" checked={checked} onChange={() => toggleRaw(r.id)}
                        className="accent-teal-600 w-4 h-4 shrink-0" />
                      <span className="font-medium text-gray-800 flex-1 truncate" title={r.materialName}>{r.materialName}</span>
                      <span className="text-gray-500 whitespace-nowrap">{r.quantityPurchased.toLocaleString()} {r.unit}</span>
                      <span className="font-semibold text-teal-700 whitespace-nowrap w-28 text-right" title="Selling price (cost + profit)">{frw(rawSellingPrice(r))}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {selectedRawCost > 0 && (
            <div className="border-t border-teal-200 pt-4 space-y-3">
              <div className="bg-white border border-teal-200 rounded-lg p-3">
                <p className="text-xs text-gray-500">Product Name (from raw materials)</p>
                <p className="text-sm font-semibold text-teal-900">{selectedRawNames}</p>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white border border-teal-200 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Quantity</p>
                  <p className="text-base font-bold text-teal-900">{selectedRawQty.toLocaleString()}</p>
                </div>
                <div className="bg-white border border-teal-200 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Total Production Cost</p>
                  <p className="text-base font-bold text-teal-900">{frw(selectedRawCost)}</p>
                </div>
                <div className="bg-teal-700 rounded-lg p-3">
                  <p className="text-xs text-teal-200">Cost Per Unit</p>
                  <p className="text-base font-bold text-white">
                    {selectedRawQty > 0 ? frw(selectedRawCost / selectedRawQty) : "—"}
                  </p>
                </div>
              </div>
            </div>
          )}
            </>
          )}

          {/* Product image + inventory settings (both variants) */}
          <div className="border-t border-teal-200 pt-4 space-y-3">
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Product Image & Inventory</p>
            {imgError && (
              <div className="flex items-center gap-2 text-red-600 text-xs bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                <AlertCircle className="w-4 h-4 shrink-0" /> {imgError}
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-4">
              {/* image picker */}
              <div className="shrink-0">
                <label className="block text-xs font-medium text-gray-600 mb-1">Product Image</label>
                {form.imageUrl ? (
                  <div className="relative w-28 h-28 rounded-lg overflow-hidden border border-teal-200 group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={form.imageUrl} alt="Product preview" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => f("imageUrl", "")}
                      className="absolute top-1 right-1 bg-black/60 hover:bg-black/80 text-white rounded-full p-1 transition-colors"
                      title="Remove image">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <label className="w-28 h-28 flex flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-teal-300 text-teal-600 hover:bg-teal-50 cursor-pointer transition-colors">
                    <ImagePlus className="w-6 h-6" />
                    <span className="text-[10px] font-medium">Upload</span>
                    <input type="file" accept="image/*" className="hidden"
                      onChange={(e) => handleAddImage(e.target.files?.[0])} />
                  </label>
                )}
              </div>
              {/* inventory fields */}
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Unit of Measure</label>
                  <select value={form.unitOfMeasure} onChange={(e) => f("unitOfMeasure", e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400">
                    {UNITS.map((u) => <option key={u}>{u}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Low Stock Threshold</label>
                  <input type="number" min="0" step="any" value={form.lowStockThreshold}
                    onChange={(e) => f("lowStockThreshold", e.target.value)} placeholder="Alert level"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Reserved Stock</label>
                  <input type="number" min="0" step="any" value={form.reservedStock}
                    onChange={(e) => f("reservedStock", e.target.value)} placeholder="For existing orders"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
                </div>
              </div>
            </div>
          </div>

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
                {["","#","Product",isSupermarket ? "Initial (Purchased)" : "Initial Stock","Current Stock","Unit","Low Stock ✎","Reserved ✎","Lead Time ✎","Recent Trans.","Status",""].map((h, i) => (
                  <th key={i} className="px-3 py-2.5 text-left font-semibold whitespace-nowrap border-r border-teal-600 last:border-r-0">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {records.map((r, i) => (
                <Fragment key={r.id}>
                  {(() => {
                    const initial = r.quantityProduced;
                    const base = isSupermarket && r.currentStock != null ? r.currentStock : r.quantityProduced;
                    const current = currentStockMap[r.id] ?? base;
                    const unit = r.unitOfMeasure ?? "Piece";
                    const threshold = r.lowStockThreshold ?? 0;
                    const reserved = r.reservedStock ?? 0;
                    const leadTime = r.leadTimeDays ?? 0;
                    const low = threshold > 0 && current <= threshold;
                    const stockColor = current <= 0 || low ? "text-red-600" : "text-emerald-600";
                    const last = lastMovementMap[r.id];
                    const count = movementCountMap[r.id] ?? 0;
                    return (
                  <tr
                    className={`border-b border-gray-100 hover:bg-teal-50/40 transition-colors cursor-pointer ${i % 2 === 0 ? "bg-teal-50/20" : "bg-white"}`}
                    onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}
                  >
                    <td className="px-2 py-2 text-teal-400">
                      {expandedId === r.id ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                    </td>
                    <td className="px-3 py-2 text-gray-400 font-mono">{i + 1}</td>
                    {/* Product: image thumbnail + name */}
                    <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-2.5">
                        <label className="relative w-11 h-11 shrink-0 rounded-lg overflow-hidden border border-teal-200 bg-teal-50 flex items-center justify-center cursor-pointer group"
                          title={r.imageUrl ? "Change image" : "Upload image"}>
                          {r.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={r.imageUrl} alt={r.productName} className="w-full h-full object-cover" />
                          ) : (
                            <ImageIcon className="w-5 h-5 text-teal-300" />
                          )}
                          <span className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <ImagePlus className="w-4 h-4 text-white" />
                          </span>
                          <input type="file" accept="image/*" className="hidden"
                            onChange={(e) => handleRowImage(r.id, e.target.files?.[0])} />
                        </label>
                        <span className="font-semibold text-teal-900">{r.productName}</span>
                      </div>
                    </td>
                    {/* Initial stock */}
                    <td className="px-3 py-2 text-right text-gray-600">{initial.toLocaleString()}</td>
                    {/* Current stock */}
                    <td className={`px-3 py-2 text-right font-bold ${stockColor}`}>
                      {current.toLocaleString()}
                      {low && <span className="ml-1 inline-block w-1.5 h-1.5 rounded-full bg-red-500 align-middle" title="Low stock" />}
                    </td>
                    {/* Unit of measure */}
                    <td className="px-3 py-2">
                      <span className="bg-teal-100 text-teal-700 px-1.5 py-0.5 rounded">{unit}</span>
                    </td>
                    {/* Low stock threshold (inline editable) */}
                    <td className="p-1 bg-amber-50/60" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="number" min="0" step="any"
                        value={thrDraft[r.id] ?? String(threshold)}
                        onChange={(e) => setThrDraft((p) => ({ ...p, [r.id]: e.target.value }))}
                        onBlur={async () => {
                          const val = parseFloat(thrDraft[r.id] ?? "");
                          if (!isNaN(val) && val !== threshold) await patchRecord(r.id, { lowStockThreshold: val });
                          setThrDraft((p) => { const x = { ...p }; delete x[r.id]; return x; });
                        }}
                        onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
                        className="w-16 text-right font-semibold text-amber-700 bg-white border border-amber-300 rounded px-1.5 py-1 focus:outline-none focus:ring-1 focus:ring-amber-400 text-xs"
                      />
                    </td>
                    {/* Reserved stock (inline editable) */}
                    <td className="p-1" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="number" min="0" step="any"
                        value={resDraft[r.id] ?? String(reserved)}
                        onChange={(e) => setResDraft((p) => ({ ...p, [r.id]: e.target.value }))}
                        onBlur={async () => {
                          const val = parseFloat(resDraft[r.id] ?? "");
                          if (!isNaN(val) && val !== reserved) await patchRecord(r.id, { reservedStock: val });
                          setResDraft((p) => { const x = { ...p }; delete x[r.id]; return x; });
                        }}
                        onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
                        className="w-16 text-right font-semibold text-gray-700 bg-white border border-gray-300 rounded px-1.5 py-1 focus:outline-none focus:ring-1 focus:ring-teal-400 text-xs"
                      />
                    </td>
                    {/* Lead time in days (inline editable) — drives the smart reorder point */}
                    <td className="p-1 bg-sky-50/60" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1">
                        <input
                          type="number" min="0" step="1"
                          value={leadDraft[r.id] ?? String(leadTime)}
                          onChange={(e) => setLeadDraft((p) => ({ ...p, [r.id]: e.target.value }))}
                          onBlur={async () => {
                            const val = parseInt(leadDraft[r.id] ?? "", 10);
                            if (!isNaN(val) && val !== leadTime) await patchRecord(r.id, { leadTimeDays: val });
                            setLeadDraft((p) => { const x = { ...p }; delete x[r.id]; return x; });
                          }}
                          onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
                          className="w-12 text-right font-semibold text-sky-700 bg-white border border-sky-300 rounded px-1.5 py-1 focus:outline-none focus:ring-1 focus:ring-sky-400 text-xs"
                        />
                        <span className="text-[10px] text-gray-400">d</span>
                      </div>
                    </td>
                    {/* Recent transactions */}
                    <td className="px-3 py-2 whitespace-nowrap">
                      {last ? (
                        <span className={`inline-flex items-center gap-1 ${last.movement === "in" ? "text-emerald-700" : "text-red-600"}`}>
                          {last.movement === "in" ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
                          {last.movement === "in" ? "+" : "−"}{last.quantity.toLocaleString()}
                          <span className="text-gray-400">· {count} total</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-gray-400"><History className="w-3 h-3" /> No history</span>
                      )}
                    </td>
                    {/* Status + publish toggle */}
                    <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => togglePublish(r)}
                        title={r.published ? "Click to unpublish" : "Click to publish"}
                        className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border transition-colors ${
                          r.published
                            ? "bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100"
                            : "bg-gray-50 border-gray-300 text-gray-500 hover:bg-gray-100"
                        }`}
                      >
                        {r.published ? <CheckCircle2 className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                        {r.published ? "Available" : "Publish"}
                      </button>
                    </td>
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
                    );
                  })()}

                  {/* Edit row */}
                  {editingId === r.id && (
                    <tr key={`${r.id}-edit`} className="bg-blue-50 border-b border-blue-200">
                      <td colSpan={12} className="px-6 py-5">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-bold text-blue-800 uppercase tracking-wide">Edit Record</p>
                            <button onClick={() => setEditingId(null)} className="text-gray-400 hover:text-gray-600">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          {isSupermarket ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                              <div className="lg:col-span-2">
                                <label className="block text-xs font-medium text-gray-600 mb-1">Product Name</label>
                                <input type="text" value={editForm.productName} onChange={(e) => ef("productName", e.target.value)}
                                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Date</label>
                                <input type="date" value={editForm.recordDate} onChange={(e) => ef("recordDate", e.target.value)}
                                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Qty Purchased</label>
                                <input type="number" min="0" step="any" value={editForm.quantityProduced} onChange={(e) => ef("quantityProduced", e.target.value)}
                                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Current Stock</label>
                                <input type="number" min="0" step="any" value={editForm.currentStock} onChange={(e) => ef("currentStock", e.target.value)}
                                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Amount / Unit (Frw)</label>
                                <input type="number" min="0" step="any" value={editForm.amountPerUnit} onChange={(e) => ef("amountPerUnit", e.target.value)}
                                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Other Expenses (Frw)</label>
                                <input type="number" min="0" step="any" value={editForm.otherExpenses} onChange={(e) => ef("otherExpenses", e.target.value)}
                                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                              </div>
                            </div>
                          ) : (
                          <>
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
                          </>
                          )}
                          {/* Image + inventory (both variants) */}
                          <div className="border-t border-blue-200 pt-3 space-y-3">
                            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Product Image & Inventory</p>
                            {editImgError && (
                              <div className="flex items-center gap-2 text-red-600 text-xs bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                                <AlertCircle className="w-4 h-4 shrink-0" /> {editImgError}
                              </div>
                            )}
                            <div className="flex flex-col sm:flex-row gap-4">
                              <div className="shrink-0">
                                <label className="block text-xs font-medium text-gray-600 mb-1">Product Image</label>
                                {editForm.imageUrl ? (
                                  <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-blue-200 group">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={editForm.imageUrl} alt="Product preview" className="w-full h-full object-cover" />
                                    <button type="button" onClick={() => ef("imageUrl", "")}
                                      className="absolute top-1 right-1 bg-black/60 hover:bg-black/80 text-white rounded-full p-1 transition-colors" title="Remove image">
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                ) : (
                                  <label className="w-24 h-24 flex flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-blue-300 text-blue-600 hover:bg-blue-50 cursor-pointer transition-colors">
                                    <ImagePlus className="w-5 h-5" />
                                    <span className="text-[10px] font-medium">Upload</span>
                                    <input type="file" accept="image/*" className="hidden"
                                      onChange={(e) => handleEditImage(e.target.files?.[0])} />
                                  </label>
                                )}
                              </div>
                              <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 mb-1">Unit of Measure</label>
                                  <select value={editForm.unitOfMeasure} onChange={(e) => ef("unitOfMeasure", e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
                                    {UNITS.map((u) => <option key={u}>{u}</option>)}
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 mb-1">Low Stock Threshold</label>
                                  <input type="number" min="0" step="any" value={editForm.lowStockThreshold} onChange={(e) => ef("lowStockThreshold", e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 mb-1">Reserved Stock</label>
                                  <input type="number" min="0" step="any" value={editForm.reservedStock} onChange={(e) => ef("reservedStock", e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                                </div>
                              </div>
                            </div>
                          </div>
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
                      <td colSpan={12} className="px-6 py-5">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          <div>
                            <p className="text-xs font-semibold text-teal-700 mb-2 uppercase tracking-wide">Cost Breakdown</p>
                            <CostBreakdown
                              rows={
                                isSupermarket
                                  ? [
                                      { label: "Goods", amount: r.productionCost },
                                      { label: "Other Expenses", amount: r.otherExpenses },
                                    ]
                                  : [
                                      { label: "Production Cost", amount: r.productionCost },
                                      { label: "Labor Cost", amount: r.laborCost },
                                      { label: "Packaging Cost", amount: r.packagingCost },
                                      { label: "Transport Cost", amount: r.transportCost },
                                      { label: "Other Expenses", amount: r.otherExpenses },
                                      ...(r.customExpenses ?? []).map((e) => ({ label: e.label || "Custom", amount: e.amount })),
                                    ]
                              }
                              qty={r.quantityProduced}
                              totalCost={r.totalProductionCost}
                              accentClass="border-teal-200"
                            />
                            <div className="mt-2 text-xs text-gray-500">
                              Recorded {new Date(r.recordDate ?? r.createdAt).toLocaleDateString()}
                              {(r.reservedStock ?? 0) > 0 && (
                                <span> · {(r.reservedStock ?? 0).toLocaleString()} reserved for orders</span>
                              )}
                            </div>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-teal-700 mb-2 uppercase tracking-wide">Stock Movements</p>
                            <MovementLog
                              recordId={r.id}
                              recordName={r.productName}
                              unit={r.unitOfMeasure ?? "Piece"}
                              type="finished"
                              initialQty={isSupermarket && r.currentStock != null ? r.currentStock : r.quantityProduced}
                              onChange={loadMovements}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
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

function AllMovementsTab({ variant = "industry" }: { variant?: "industry" | "supermarket" }) {
  const isSupermarket = variant === "supermarket";
  const [events, setEvents] = useState<MovementEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  // supermarket has no raw materials, so it only ever shows finished products
  const [filter, setFilter] = useState<"all" | "raw" | "finished">(isSupermarket ? "finished" : "all");
  const [dirFilter, setDirFilter] = useState<"all" | "in" | "out">("all");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [rawRecords, fpRecords, movements] = await Promise.all([
        isSupermarket ? Promise.resolve([]) : getRawMaterialRecords(),
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

      // Actual IN/OUT movements (supermarket has no raw materials)
      const movementEvents: MovementEvent[] = movements
        .filter((m) => !isSupermarket || m.type === "finished")
        .map((m) => ({
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

  const handleDownload = () =>
    downloadTablePDF({
      title: "All Stock Movements",
      filename: "stock-movements",
      columns: [
        { header: "#", width: 6 },
        { header: "Date", width: 20 },
        ...(isSupermarket ? [] : [{ header: "Type", width: 16 } as PdfColumn]),
        { header: "Material / Product", width: 36 },
        { header: "Direction", width: 16 },
        { header: "Qty", width: 16, align: "right" as const },
        { header: "Unit", width: 14 },
        { header: "Notes", width: 32 },
        { header: "Recorded At", width: 24 },
      ],
      rows: filtered.map((m, i) => [
        i + 1,
        new Date(m.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
        ...(isSupermarket ? [] : [m.type === "raw" ? "Raw" : "Finished"]),
        m.recordName,
        m.movement === "in" ? "IN" : "OUT",
        `${m.movement === "in" ? "+" : "-"}${m.quantity.toLocaleString()}`,
        m.unit,
        m.notes || "—",
        new Date(m.createdAt).toLocaleString("en-GB", { dateStyle: "short", timeStyle: "short" }),
      ]),
    });

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
        {!isSupermarket && (["all","raw","finished"] as const).map((v) => (
          <button key={v} onClick={() => setFilter(v)}
            className={`text-xs px-3 py-1.5 rounded-full font-semibold border transition-colors ${
              filter === v ? "bg-slate-700 text-white border-slate-700" : "border-gray-300 text-gray-600 hover:bg-gray-50"
            }`}>
            {v === "all" ? "All Types" : v === "raw" ? "Raw Materials" : "Finished Products"}
          </button>
        ))}
        {!isSupermarket && <div className="w-px bg-gray-200 mx-1" />}
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
        <div className="ml-auto flex items-center gap-2">
          <button onClick={load}
            className="text-xs px-3 py-1.5 rounded-full font-semibold border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors flex items-center gap-1">
            ↻ Refresh
          </button>
          <button onClick={handleDownload} disabled={filtered.length === 0}
            className="text-xs px-3 py-1.5 rounded-full font-semibold border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed">
            <Download className="w-3.5 h-3.5" /> Download PDF
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-gray-50 rounded-xl p-10 text-center border border-dashed border-gray-300">
          <Clock className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500 text-sm">
            {isSupermarket ? "No movements found. Add finished product records first." : "No stock records found. Add raw material or finished product records first."}
          </p>
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

// ─── Stock of Raw Materials Tab (simple list) ────────────────────────────────

const STOCK_DEFAULTS = { materialName: "", quantityPurchased: "", amount: "" };

function MaterialStockTab() {
  const [items, setItems] = useState<RawMaterialStockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(STOCK_DEFAULTS);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(STOCK_DEFAULTS);
  const [editSaving, setEditSaving] = useState(false);

  useEffect(() => {
    getRawMaterialStockItems().then((r) => { setItems(r); setLoading(false); });
  }, []);

  const n = (v: string) => parseFloat(v) || 0;
  const f = (field: keyof typeof STOCK_DEFAULTS, val: string) => setForm((p) => ({ ...p, [field]: val }));
  const ef = (field: keyof typeof STOCK_DEFAULTS, val: string) => setEditForm((p) => ({ ...p, [field]: val }));

  const resetForm = () => { setForm(STOCK_DEFAULTS); setError(""); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.materialName.trim()) { setError("Material name is required."); return; }
    if (n(form.quantityPurchased) <= 0) { setError("Quantity purchased must be greater than 0."); return; }
    setSaving(true);
    const result = await saveRawMaterialStockItem({
      materialName: form.materialName.trim(),
      quantityPurchased: n(form.quantityPurchased),
      // a brand-new stock item is fully available until used in the calculator
      quantityRemaining: n(form.quantityPurchased),
      amount: n(form.amount),
    });
    setSaving(false);
    if (result.success) {
      resetForm(); setShowForm(false);
      setItems(await getRawMaterialStockItems());
    } else { setError(result.message || "Failed to save."); }
  };

  const startEdit = (it: RawMaterialStockItem) => {
    setEditingId(it.id);
    setEditForm({
      materialName: it.materialName,
      quantityPurchased: String(it.quantityPurchased),
      amount: String(it.amount),
    });
  };

  const handleEditSubmit = async (id: string) => {
    setEditSaving(true);
    // keep the already-consumed amount fixed when the purchased quantity is edited
    const original = items.find((i) => i.id === id);
    const consumed = original ? original.quantityPurchased - original.quantityRemaining : 0;
    const newPurchased = n(editForm.quantityPurchased);
    const result = await updateRawMaterialStockItem(id, {
      materialName: editForm.materialName.trim(),
      quantityPurchased: newPurchased,
      quantityRemaining: Math.max(0, newPurchased - consumed),
      amount: n(editForm.amount),
    });
    setEditSaving(false);
    if (result.success) {
      setEditingId(null);
      setItems(await getRawMaterialStockItems());
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this material from stock?")) return;
    await deleteRawMaterialStockItem(id);
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  // amount is per unit → row total = quantity × amount; grand total sums all rows
  const grandTotal = items.reduce((s, i) => s + i.quantityPurchased * i.amount, 0);
  const formRowTotal = n(form.quantityPurchased) * n(form.amount);

  const handleDownload = () =>
    downloadTablePDF({
      title: "Stock of Raw Materials",
      filename: "stock-of-materials",
      columns: [
        { header: "#", width: 6 },
        { header: "Raw Material Name", width: 40 },
        { header: "Quantity Purchased", width: 22, align: "right" },
        { header: "Quantity Remaining", width: 22, align: "right" },
        { header: "Amount / Unit (Frw)", width: 24, align: "right" },
        { header: "Total Amount (Frw)", width: 24, align: "right" },
        { header: "Date", width: 20 },
      ],
      rows: [
        ...items.map((it, i) => [
          i + 1,
          it.materialName,
          it.quantityPurchased.toLocaleString(),
          it.quantityRemaining.toLocaleString(),
          frw(it.amount),
          frw(it.quantityPurchased * it.amount),
          new Date(it.createdAt).toLocaleDateString(),
        ]),
        ["", "Total Amount of All Raw Materials", "", "", "", frw(grandTotal), ""],
      ],
    });

  if (loading) return <div className="py-16 text-center text-gray-500">Loading…</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{items.length} material{items.length !== 1 ? "s" : ""} in stock</p>
        <div className="flex items-center gap-2">
          <DownloadButton onClick={handleDownload} disabled={items.length === 0} />
          <button
            onClick={() => { setShowForm((v) => !v); resetForm(); }}
            className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Material
          </button>
        </div>
      </div>

      {/* Add form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-amber-50 border border-amber-200 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-amber-800 uppercase tracking-wide">New Stock Material</h3>
          {error && (
            <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Raw Material Name *</label>
              <input type="text" required value={form.materialName} onChange={(e) => f("materialName", e.target.value)}
                placeholder="e.g. Sugar, Flour, Plastic"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Quantity Purchased *</label>
              <input type="number" min="0" step="any" required value={form.quantityPurchased}
                onChange={(e) => f("quantityPurchased", e.target.value)} placeholder="0"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Amount / Unit (Frw)</label>
              <input type="number" min="0" step="any" value={form.amount}
                onChange={(e) => f("amount", e.target.value)} placeholder="0"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
            </div>
          </div>

          {/* Auto-calculated total for this material */}
          {formRowTotal > 0 && (
            <div className="bg-white border border-amber-200 rounded-lg px-4 py-2.5 inline-flex items-center gap-3">
              <span className="text-xs text-gray-500">
                {n(form.quantityPurchased).toLocaleString()} × {frw(n(form.amount))} =
              </span>
              <span className="text-base font-bold text-amber-700">{frw(formRowTotal)}</span>
            </div>
          )}

          <div className="flex gap-2 justify-end border-t border-amber-200 pt-4">
            <button type="button" onClick={() => { setShowForm(false); resetForm(); }}
              className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
            <button type="submit" disabled={saving}
              className="px-4 py-2 text-sm bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-60">
              {saving ? "Saving…" : "Save to Stock"}
            </button>
          </div>
        </form>
      )}

      {/* Table */}
      {items.length === 0 ? (
        <div className="bg-gray-50 rounded-xl p-10 text-center border border-dashed border-gray-300">
          <Warehouse className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500 text-sm">No materials in stock yet. Click "Add Material" to start.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
          <table className="w-full text-sm border-collapse min-w-[560px]">
            <thead>
              <tr className="bg-amber-600 text-white">
                {["#","Raw Material Name","Quantity Purchased","Quantity Remaining","Amount / Unit (Frw)","Total Amount (Frw)","Date",""].map((h, i) => (
                  <th key={i} className="px-4 py-2.5 text-left font-semibold whitespace-nowrap border-r border-amber-500 last:border-r-0">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((it, i) => (
                editingId === it.id ? (
                  <tr key={it.id} className="bg-blue-50 border-b border-blue-200">
                    <td className="px-4 py-2 text-gray-400 font-mono">{i + 1}</td>
                    <td className="px-4 py-2">
                      <input type="text" value={editForm.materialName} onChange={(e) => ef("materialName", e.target.value)}
                        className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400" />
                    </td>
                    <td className="px-4 py-2">
                      <input type="number" min="0" step="any" value={editForm.quantityPurchased} onChange={(e) => ef("quantityPurchased", e.target.value)}
                        className="w-full border border-gray-300 rounded px-2 py-1 text-sm text-right focus:outline-none focus:ring-1 focus:ring-blue-400" />
                    </td>
                    <td className="px-4 py-2 text-right font-medium text-emerald-700">
                      {Math.max(0, n(editForm.quantityPurchased) - (it.quantityPurchased - it.quantityRemaining)).toLocaleString()}
                    </td>
                    <td className="px-4 py-2">
                      <input type="number" min="0" step="any" value={editForm.amount} onChange={(e) => ef("amount", e.target.value)}
                        className="w-full border border-gray-300 rounded px-2 py-1 text-sm text-right focus:outline-none focus:ring-1 focus:ring-blue-400" />
                    </td>
                    <td className="px-4 py-2 text-right font-medium text-amber-700">
                      {frw(n(editForm.quantityPurchased) * n(editForm.amount))}
                    </td>
                    <td className="px-4 py-2 text-gray-400 whitespace-nowrap">{new Date(it.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleEditSubmit(it.id)} disabled={editSaving}
                          className="p-1 rounded bg-green-100 hover:bg-green-200 text-green-700 disabled:opacity-50" title="Save">
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setEditingId(null)}
                          className="p-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-600" title="Cancel">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <tr key={it.id} className={`border-b border-gray-100 hover:bg-amber-50/50 transition-colors ${i % 2 === 0 ? "bg-amber-50/20" : "bg-white"}`}>
                    <td className="px-4 py-2 text-gray-400 font-mono">{i + 1}</td>
                    <td className="px-4 py-2 font-semibold text-gray-800 whitespace-nowrap">{it.materialName}</td>
                    <td className="px-4 py-2 text-right">{it.quantityPurchased.toLocaleString()}</td>
                    <td className={`px-4 py-2 text-right font-semibold ${it.quantityRemaining <= 0 ? "text-red-600" : "text-emerald-700"}`}>
                      {it.quantityRemaining.toLocaleString()}
                    </td>
                    <td className="px-4 py-2 text-right text-gray-700">{frw(it.amount)}</td>
                    <td className="px-4 py-2 text-right font-bold text-amber-700">{frw(it.quantityPurchased * it.amount)}</td>
                    <td className="px-4 py-2 text-gray-400 whitespace-nowrap">{new Date(it.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-1">
                        <button onClick={() => startEdit(it)}
                          className="text-blue-400 hover:text-blue-600 transition-colors p-1 rounded" title="Edit">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDelete(it.id)}
                          className="text-red-400 hover:text-red-600 transition-colors p-1 rounded" title="Delete">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-amber-100 font-bold text-amber-900">
                <td className="px-4 py-2.5" colSpan={5}>Total Amount of All Raw Materials</td>
                <td className="px-4 py-2.5 text-right">{frw(grandTotal)}</td>
                <td className="px-4 py-2.5" colSpan={2} />
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Main ────────────────────────────────────────────────────────────────────

export default function StockRecords({ variant = "industry" }: { variant?: "industry" | "supermarket" }) {
  const isSupermarket = variant === "supermarket";
  const [activeTab, setActiveTab] = useState<"materials" | "raw" | "inventory" | "movements">(
    isSupermarket ? "inventory" : "materials"
  );

  const allTabs = [
    { id: "materials" as const, label: "Stock of Materials", icon: Warehouse },
    { id: "raw" as const, label: "Raw Material Calculator", icon: Layers },
    { id: "inventory" as const, label: "Finished Products Records", icon: BoxesIcon },
    { id: "movements" as const, label: "All Movements", icon: Clock },
  ];

  // the supermarket variant has no raw materials, so hide the raw stock & calculator tabs
  const tabs = isSupermarket
    ? allTabs.filter((t) => t.id !== "materials" && t.id !== "raw")
    : allTabs;

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
                  ? id === "materials" ? "border-amber-600 text-amber-700"
                  : id === "raw" ? "border-slate-700 text-slate-800"
                  : id === "inventory" ? "border-[#0097A7] text-[#023E4A]"
                  : "border-gray-700 text-gray-800"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}>
              <Icon className="w-4 h-4" /> {label}
            </button>
          ))}
        </div>

        <div className="bg-white p-6">
          {activeTab === "materials" && <MaterialStockTab />}
          {activeTab === "raw" && <RawMaterialsTab />}
          {activeTab === "inventory" && (
            <StockInventoryDashboard productsSlot={<FinishedProductsTab variant={variant} />} />
          )}
          {activeTab === "movements" && <AllMovementsTab variant={variant} />}
        </div>
      </div>
    </div>
  );
}
