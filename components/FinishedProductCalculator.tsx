"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import {
  ShoppingCart, Percent,
  AlertCircle, CheckCircle2, TrendingUp, TrendingDown, Plus, Trash2, Save, History, Pencil, Download,
  ImagePlus, X, BoxesIcon,
} from "lucide-react";
import Link from "next/link";
import {
  saveFinishedProductCalculation,
  updateFinishedProductCalculation,
  deleteFinishedProductCalculation,
  getFinishedProductCalculations,
  saveFinishedProductDraft,
  getFinishedProductDraft,
  clearFinishedProductDraft,
  saveFinishedProductStockRecord,
} from "@/app/actions/industry";

const UNITS = ["Piece", "Kg", "Liter", "Meter", "Ton", "Box", "Bag", "Bottle", "Other"];

// Read a chosen image file into a base64 data URL. Rejects non-images / >2MB.
function readImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const allowed = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowed.includes(file.type)) { reject(new Error("Use a JPEG, PNG, GIF or WebP image.")); return; }
    if (file.size > 2 * 1024 * 1024) { reject(new Error("Image must be under 2MB.")); return; }
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Could not read the image."));
    reader.readAsDataURL(file);
  });
}

type SavedCalc = Awaited<ReturnType<typeof getFinishedProductCalculations>>[number];

const rwf = (n: number) =>
  "RWF " + n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

const QUICK_PROFITS = [5, 10, 15, 20, 25, 30, 50];

interface CustomExpense {
  id: string;
  label: string;
  amount: number;
}

interface FinishedProductCalculatorProps {
  /** "supermarket" saves calculated products into the Finished Products stock records. */
  variant?: "industry" | "supermarket";
}

export default function FinishedProductCalculator({ variant = "industry" }: FinishedProductCalculatorProps) {
  const isSupermarket = variant === "supermarket";
  const [calc, setCalc] = useState({
    purchasePrice: 0,
    transport: 0,
    taxes: 0,
    packaging: 0,
    labor: 0,
    otherExpenses: 0,
    desiredProfitPct: 20,
    actualSellingPrice: 0,
  });

  const [customExpenses, setCustomExpenses] = useState<CustomExpense[]>([]);
  const [productName, setProductName] = useState("");
  // supermarket-only: product image + inventory details saved into stock records
  const [productImage, setProductImage] = useState("");
  const [imageError, setImageError] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("Piece");
  const [savedToStock, setSavedToStock] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [savedCalcs, setSavedCalcs] = useState<SavedCalc[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const topRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLDivElement>(null);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadCalcs = useCallback(async () => {
    const data = await getFinishedProductCalculations();
    setSavedCalcs(data);
  }, []);

  // Restore draft from database on mount
  useEffect(() => {
    loadCalcs();
    getFinishedProductDraft().then((draft) => {
      if (!draft) return;
      setCalc({
        purchasePrice: draft.purchasePrice,
        transport: draft.transport,
        taxes: draft.taxes,
        packaging: draft.packaging,
        labor: draft.labor,
        otherExpenses: draft.otherExpenses,
        desiredProfitPct: draft.desiredProfitPct,
        actualSellingPrice: draft.actualSellingPrice,
      });
      setCustomExpenses(draft.customExpenses);
      setProductName(draft.productName);
    });
  }, [loadCalcs]);

  // Auto-save form state to database whenever it changes (debounced 1.5s)
  useEffect(() => {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(async () => {
      setAutoSaveStatus("saving");
      await saveFinishedProductDraft({
        productName,
        purchasePrice: calc.purchasePrice,
        transport: calc.transport,
        taxes: calc.taxes,
        packaging: calc.packaging,
        labor: calc.labor,
        otherExpenses: calc.otherExpenses,
        customExpenses,
        desiredProfitPct: calc.desiredProfitPct,
        actualSellingPrice: calc.actualSellingPrice,
      });
      setAutoSaveStatus("saved");
    }, 1500);
    return () => { if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current); };
  }, [calc, customExpenses, productName]);

  const handleImage = async (file?: File) => {
    setImageError("");
    if (!file) return;
    try { setProductImage(await readImageFile(file)); }
    catch (err) { setImageError(err instanceof Error ? err.message : "Could not read image."); }
  };

  const handleEdit = (row: SavedCalc) => {
    setCalc({
      purchasePrice: row.purchasePrice,
      transport: row.transport,
      taxes: row.taxes,
      packaging: row.packaging,
      labor: row.labor,
      otherExpenses: row.otherExpenses,
      desiredProfitPct: row.desiredProfitPct,
      actualSellingPrice: row.actualSellingPrice ?? 0,
    });
    setCustomExpenses(row.customExpenses.map((e) => ({ ...e })));
    setProductName(row.productName ?? "");
    setEditingId(row.id);
    setSaveStatus("idle");
    topRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    const res = await deleteFinishedProductCalculation(id);
    if (res.success) await loadCalcs();
    setDeletingId(null);
  };

  const downloadReport = async () => {
    if (!savedCalcs.length || !tableRef.current) return;
    setDownloading(true);
    try {
      const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
        import("jspdf"),
        import("html2canvas"),
      ]);
      const canvas = await html2canvas(tableRef.current, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();

      pdf.setFontSize(16);
      pdf.setFont("helvetica", "bold");
      pdf.text("Finished Product Calculations Report", pageW / 2, 14, { align: "center" });
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(100);
      pdf.text(
        `Generated: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}   |   Total records: ${savedCalcs.length}`,
        pageW / 2, 21, { align: "center" }
      );

      const imgW = pageW - 20;
      const imgH = (canvas.height * imgW) / canvas.width;
      const yStart = 27;
      const availH = pageH - yStart - 8;

      if (imgH <= availH) {
        pdf.addImage(imgData, "PNG", 10, yStart, imgW, imgH);
      } else {
        const scale = availH / imgH;
        pdf.addImage(imgData, "PNG", 10, yStart, imgW * scale, availH);
      }

      pdf.save(`product-calculations-${new Date().toISOString().split("T")[0]}.pdf`);
    } finally {
      setDownloading(false);
    }
  };

  const setC = (field: keyof typeof calc, val: string) =>
    setCalc((prev) => ({ ...prev, [field]: Number(val) || 0 }));

  const addExpense = () =>
    setCustomExpenses((prev) => [
      ...prev,
      { id: crypto.randomUUID(), label: "", amount: 0 },
    ]);

  const removeExpense = (id: string) =>
    setCustomExpenses((prev) => prev.filter((e) => e.id !== id));

  const updateExpense = (id: string, field: "label" | "amount", val: string) =>
    setCustomExpenses((prev) =>
      prev.map((e) =>
        e.id === id
          ? { ...e, [field]: field === "amount" ? Number(val) || 0 : val }
          : e
      )
    );

  const customTotal = customExpenses.reduce((s, e) => s + e.amount, 0);

  const results = useMemo(() => {
    const totalCost =
      calc.purchasePrice +
      calc.transport +
      calc.taxes +
      calc.packaging +
      calc.labor +
      calc.otherExpenses +
      customTotal;
    const desiredProfit = totalCost * (calc.desiredProfitPct / 100);
    const recommendedPrice = totalCost + desiredProfit;
    const netProfitActual =
      calc.actualSellingPrice > 0
        ? calc.actualSellingPrice - totalCost
        : desiredProfit;
    const sellingPriceUsed =
      calc.actualSellingPrice > 0 ? calc.actualSellingPrice : recommendedPrice;
    const profitMarginActual =
      sellingPriceUsed > 0 ? (netProfitActual / sellingPriceUsed) * 100 : 0;
    return { totalCost, desiredProfit, recommendedPrice, netProfitActual, profitMarginActual };
  }, [calc, customTotal]);

  const numField = (
    field: keyof typeof calc,
    label: string,
    placeholder = "0"
  ) => (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-gray-600">{label}</label>
      <input
        type="number"
        min={0}
        placeholder={placeholder}
        value={calc[field] || ""}
        onChange={(e) => setC(field, e.target.value)}
        className="px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#1e3a5f] focus:ring-1 focus:ring-[#1e3a5f]/20 bg-white text-right"
      />
    </div>
  );

  const savedTotals = useMemo(() => ({
    purchasePrice:         savedCalcs.reduce((s, r) => s + r.purchasePrice, 0),
    transport:             savedCalcs.reduce((s, r) => s + r.transport, 0),
    taxes:                 savedCalcs.reduce((s, r) => s + r.taxes, 0),
    packaging:             savedCalcs.reduce((s, r) => s + r.packaging, 0),
    labor:                 savedCalcs.reduce((s, r) => s + r.labor, 0),
    otherExpenses:         savedCalcs.reduce((s, r) => s + r.otherExpenses, 0),
    customExpenses:        savedCalcs.reduce((s, r) => s + r.customExpenses.reduce((cs, e) => cs + e.amount, 0), 0),
    totalCost:             savedCalcs.reduce((s, r) => s + r.totalCost, 0),
    recommendedSellingPrice: savedCalcs.reduce((s, r) => s + r.recommendedSellingPrice, 0),
  }), [savedCalcs]);

  const costLines: [string, number][] = [
    ["Purchase Price", calc.purchasePrice],
    ["Transport", calc.transport],
    ["Taxes", calc.taxes],
    ["Packaging", calc.packaging],
    ["Labor", calc.labor],
    ["Other Expenses", calc.otherExpenses],
    ...customExpenses.map((e): [string, number] => [e.label || "Custom Expense", e.amount]),
  ];

  return (
    <div className="space-y-8" ref={topRef}>
      {/* Product Name */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold text-[#1e3a5f]">Product Name</label>
          {autoSaveStatus === "saving" && (
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-gray-300 animate-pulse inline-block" />
              Auto-saving…
            </span>
          )}
          {autoSaveStatus === "saved" && (
            <span className="text-xs text-green-600 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Draft saved to database
            </span>
          )}
        </div>
        <input
          type="text"
          placeholder="Enter product name (e.g. Tomato Sauce 500ml)"
          value={productName}
          onChange={(e) => { setProductName(e.target.value); setSaveStatus("idle"); }}
          className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/20 bg-white shadow-sm"
        />
      </div>

      {/* Supermarket: product image + inventory — saved into Finished Product Records */}
      {isSupermarket && (
        <section className="rounded-xl border border-[#0097A7]/20 bg-cyan-50/40 p-5">
          <div className="flex items-center gap-2 mb-3">
            <BoxesIcon className="w-4 h-4 text-[#023E4A]" />
            <h3 className="font-bold text-[#023E4A] text-sm uppercase tracking-wide">Product Image & Stock</h3>
          </div>
          <p className="text-xs text-gray-500 mb-4">
            Add a photo and how many units are coming in. On Save, this product is recorded in your{" "}
            <strong>Finished Products Records</strong> (Stock Records), ready to publish to the marketplace.
          </p>
          {imageError && (
            <div className="flex items-center gap-2 text-red-600 text-xs bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-3">
              <AlertCircle className="w-4 h-4 shrink-0" /> {imageError}
            </div>
          )}
          <div className="flex flex-col sm:flex-row gap-4">
            {/* image picker */}
            <div className="shrink-0">
              <label className="block text-xs font-medium text-gray-600 mb-1">Product Image</label>
              {productImage ? (
                <div className="relative w-28 h-28 rounded-lg overflow-hidden border border-[#0097A7]/30 group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={productImage} alt="Product preview" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => setProductImage("")}
                    className="absolute top-1 right-1 bg-black/60 hover:bg-black/80 text-white rounded-full p-1 transition-colors"
                    title="Remove image">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <label className="w-28 h-28 flex flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-[#0097A7]/40 text-[#0097A7] hover:bg-cyan-50 cursor-pointer transition-colors">
                  <ImagePlus className="w-6 h-6" />
                  <span className="text-[10px] font-medium">Upload</span>
                  <input type="file" accept="image/*" className="hidden"
                    onChange={(e) => handleImage(e.target.files?.[0])} />
                </label>
              )}
            </div>
            {/* quantity + unit */}
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Quantity Coming In</label>
                <input type="number" min={0} step="any" value={quantity}
                  onChange={(e) => { setQuantity(e.target.value); setSaveStatus("idle"); }}
                  placeholder="Units (defaults to 1)"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1e3a5f] focus:ring-1 focus:ring-[#1e3a5f]/20" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Unit of Measure</label>
                <select value={unit} onChange={(e) => setUnit(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white outline-none focus:border-[#1e3a5f] focus:ring-1 focus:ring-[#1e3a5f]/20">
                  {UNITS.map((u) => <option key={u}>{u}</option>)}
                </select>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Step 1 */}
      <section className="rounded-xl border border-gray-200 shadow-sm bg-white overflow-hidden">
        <div className="bg-[#1e3a5f]/5 border-b border-gray-200 px-6 py-3 flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-[#1e3a5f] text-white text-xs font-black flex items-center justify-center">1</span>
          <h3 className="font-bold text-[#1e3a5f] text-sm uppercase tracking-wide">
            Calculate Total Cost
          </h3>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {numField("purchasePrice", "Purchase Price (RWF)")}
            {numField("transport", "Transport (RWF)")}
            {numField("taxes", "Taxes (RWF)")}
            {numField("packaging", "Packaging (RWF)")}
            {numField("labor", "Labor (RWF)")}
            {numField("otherExpenses", "Other Expenses (RWF)")}
          </div>

          {/* Custom expenses */}
          {customExpenses.length > 0 && (
            <div className="space-y-2">
              {customExpenses.map((expense) => (
                <div key={expense.id} className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Expense name"
                    value={expense.label}
                    onChange={(e) => updateExpense(expense.id, "label", e.target.value)}
                    className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#1e3a5f] focus:ring-1 focus:ring-[#1e3a5f]/20 bg-white"
                  />
                  <input
                    type="number"
                    min={0}
                    placeholder="0"
                    value={expense.amount || ""}
                    onChange={(e) => updateExpense(expense.id, "amount", e.target.value)}
                    className="w-36 px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#1e3a5f] focus:ring-1 focus:ring-[#1e3a5f]/20 bg-white text-right"
                  />
                  <button
                    onClick={() => removeExpense(expense.id)}
                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={addExpense}
            className="flex items-center gap-1.5 text-xs font-semibold text-[#1e3a5f] hover:text-white border border-[#1e3a5f]/30 hover:bg-[#1e3a5f] px-3 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Add Expense
          </button>

          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-[#f0f4f8]">
                  <th className="px-4 py-2 text-left text-gray-600 font-semibold">Item</th>
                  <th className="px-4 py-2 text-right text-gray-600 font-semibold">Amount (RWF)</th>
                </tr>
              </thead>
              <tbody>
                {costLines.map(([label, val]) => (
                  <tr key={label} className="border-t border-gray-100 hover:bg-blue-50/30">
                    <td className="px-4 py-1.5 text-gray-600">{label}</td>
                    <td className="px-4 py-1.5 text-right font-mono text-gray-800">
                      {val > 0 ? rwf(val) : <span className="text-gray-300">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-[#1e3a5f] text-white font-bold">
                  <td className="px-4 py-2">Total Cost</td>
                  <td className="px-4 py-2 text-right font-mono text-base">
                    {rwf(results.totalCost)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </section>

      {/* Step 2 */}
      <section className="rounded-xl border border-gray-200 shadow-sm bg-white overflow-hidden">
        <div className="bg-[#1e3a5f]/5 border-b border-gray-200 px-6 py-3 flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-[#1e3a5f] text-white text-xs font-black flex items-center justify-center">2</span>
          <h3 className="font-bold text-[#1e3a5f] text-sm uppercase tracking-wide">
            Set Desired Profit
          </h3>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex flex-col gap-1 w-52">
              <label className="text-xs font-medium text-gray-600">Desired Profit (%)</label>
              <div className="relative">
                <input
                  type="number"
                  min={0}
                  max={1000}
                  placeholder="20"
                  value={calc.desiredProfitPct || ""}
                  onChange={(e) => setC("desiredProfitPct", e.target.value)}
                  className="w-full pl-3 pr-9 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#1e3a5f] focus:ring-1 focus:ring-[#1e3a5f]/20 text-right"
                />
                <Percent className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {QUICK_PROFITS.map((p) => (
                <button
                  key={p}
                  onClick={() => setCalc((prev) => ({ ...prev, desiredProfitPct: p }))}
                  className={`text-xs px-3 py-2 rounded-lg border font-semibold transition-colors ${
                    calc.desiredProfitPct === p
                      ? "bg-[#1e3a5f] text-white border-[#1e3a5f]"
                      : "bg-white text-gray-600 border-gray-200 hover:border-[#1e3a5f] hover:text-[#1e3a5f]"
                  }`}
                >
                  {p}%
                </button>
              ))}
            </div>
          </div>

          {results.totalCost > 0 && (
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 flex flex-wrap gap-6 items-center">
              <div>
                <p className="text-xs text-blue-600 font-medium">Total Cost</p>
                <p className="text-base font-bold text-[#1e3a5f]">{rwf(results.totalCost)}</p>
              </div>
              <span className="text-gray-400 text-xl font-light">×</span>
              <div>
                <p className="text-xs text-blue-600 font-medium">Profit Margin</p>
                <p className="text-base font-bold text-[#1e3a5f]">{calc.desiredProfitPct}%</p>
              </div>
              <span className="text-gray-400 text-xl font-light">=</span>
              <div>
                <p className="text-xs text-blue-600 font-medium">Desired Profit Amount</p>
                <p className="text-base font-bold text-green-700">{rwf(results.desiredProfit)}</p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Step 3 */}
      <section className="rounded-xl border border-gray-200 shadow-sm bg-white overflow-hidden">
        <div className="bg-[#1e3a5f]/5 border-b border-gray-200 px-6 py-3 flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-[#1e3a5f] text-white text-xs font-black flex items-center justify-center">3</span>
          <h3 className="font-bold text-[#1e3a5f] text-sm uppercase tracking-wide">
            Selling Price &amp; Net Profit
          </h3>
        </div>
        <div className="p-6 space-y-5">
          {/* KPI cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-xl p-4 bg-[#1e3a5f] text-white shadow">
              <div className="flex items-center gap-2 mb-1">
                <ShoppingCart className="w-4 h-4 opacity-80" />
                <span className="text-xs font-medium opacity-80">Recommended Selling Price</span>
              </div>
              <p className="text-xl font-black">{rwf(results.recommendedPrice)}</p>
              <p className="text-xs text-blue-200 mt-1">Total Cost + {calc.desiredProfitPct}% profit</p>
            </div>
            <div className={`rounded-xl p-4 shadow text-white ${results.netProfitActual >= 0 ? "bg-green-600" : "bg-red-600"}`}>
              <div className="flex items-center gap-2 mb-1">
                {results.netProfitActual >= 0
                  ? <TrendingUp className="w-4 h-4 opacity-80" />
                  : <TrendingDown className="w-4 h-4 opacity-80" />}
                <span className="text-xs font-medium opacity-80">Net Profit</span>
              </div>
              <p className="text-xl font-black">{rwf(results.netProfitActual)}</p>
              <p className="text-xs opacity-75 mt-1">
                {calc.actualSellingPrice > 0 ? "Based on actual price" : "Based on desired %"}
              </p>
            </div>
            <div className="rounded-xl p-4 bg-slate-600 text-white shadow">
              <div className="flex items-center gap-2 mb-1">
                <Percent className="w-4 h-4 opacity-80" />
                <span className="text-xs font-medium opacity-80">Profit Margin</span>
              </div>
              <p className="text-xl font-black">{results.profitMarginActual.toFixed(1)}%</p>
              <p className="text-xs opacity-75 mt-1">Of selling price</p>
            </div>
          </div>

          {/* Already sold section */}
          <div className="border border-dashed border-gray-300 rounded-xl p-4 bg-gray-50">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5" />
              Already sold the product? Enter actual price to recalculate
            </p>
            <div className="flex flex-wrap items-end gap-4">
              <div className="flex flex-col gap-1 w-56">
                <label className="text-xs font-medium text-gray-600">Actual Selling Price (RWF)</label>
                <input
                  type="number"
                  min={0}
                  placeholder="e.g. 16000"
                  value={calc.actualSellingPrice || ""}
                  onChange={(e) => setC("actualSellingPrice", e.target.value)}
                  className="px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#1e3a5f] focus:ring-1 focus:ring-[#1e3a5f]/20 bg-white text-right"
                />
              </div>
              {calc.actualSellingPrice > 0 && (
                <>
                  {results.netProfitActual >= 0 ? (
                    <span className="flex items-center gap-1.5 text-green-700 bg-green-50 border border-green-200 px-3 py-2 rounded-lg text-sm font-semibold">
                      <CheckCircle2 className="w-4 h-4" />
                      Net Profit: {rwf(results.netProfitActual)}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-red-700 bg-red-50 border border-red-200 px-3 py-2 rounded-lg text-sm font-semibold">
                      <AlertCircle className="w-4 h-4" />
                      Net Loss: {rwf(Math.abs(results.netProfitActual))}
                    </span>
                  )}
                  <button
                    onClick={() => setCalc((prev) => ({ ...prev, actualSellingPrice: 0 }))}
                    className="text-xs text-gray-400 hover:text-gray-600 underline"
                  >
                    Clear
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Summary spreadsheet */}
          {results.totalCost > 0 && (
            <div>
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                Business Summary Spreadsheet
              </h3>
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#f0f4f8]">
                      <th className="px-4 py-2 text-left text-gray-600 font-semibold">Description</th>
                      <th className="px-4 py-2 text-right text-gray-600 font-semibold">Amount (RWF)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {costLines.map(([label, val]) => (
                      <tr key={label} className="border-t border-gray-100">
                        <td className="px-4 py-1.5 text-gray-600 pl-8">{label}</td>
                        <td className="px-4 py-1.5 text-right font-mono">
                          {val > 0 ? rwf(val) : <span className="text-gray-300">—</span>}
                        </td>
                      </tr>
                    ))}
                    <tr className="border-t-2 border-[#1e3a5f] bg-[#1e3a5f]/5">
                      <td className="px-4 py-2 font-bold text-[#1e3a5f]">Total Cost</td>
                      <td className="px-4 py-2 text-right font-bold font-mono text-[#1e3a5f]">
                        {rwf(results.totalCost)}
                      </td>
                    </tr>
                    <tr className="border-t border-gray-100">
                      <td className="px-4 py-1.5 text-gray-600 pl-8">Desired Profit ({calc.desiredProfitPct}%)</td>
                      <td className="px-4 py-1.5 text-right font-mono text-green-700">
                        {rwf(results.desiredProfit)}
                      </td>
                    </tr>
                    <tr className="border-t border-gray-100 bg-blue-50">
                      <td className="px-4 py-2 font-bold text-[#1e3a5f]">Recommended Selling Price</td>
                      <td className="px-4 py-2 text-right font-bold font-mono text-[#1e3a5f]">
                        {rwf(results.recommendedPrice)}
                      </td>
                    </tr>
                    {calc.actualSellingPrice > 0 && (
                      <>
                        <tr className="border-t border-gray-100">
                          <td className="px-4 py-1.5 text-gray-600 pl-8">Actual Selling Price</td>
                          <td className="px-4 py-1.5 text-right font-mono">{rwf(calc.actualSellingPrice)}</td>
                        </tr>
                        <tr className={`border-t-2 ${results.netProfitActual >= 0 ? "border-green-500 bg-green-50" : "border-red-500 bg-red-50"}`}>
                          <td className={`px-4 py-2 font-bold ${results.netProfitActual >= 0 ? "text-green-700" : "text-red-700"}`}>
                            {results.netProfitActual >= 0 ? "Net Profit" : "Net Loss"}
                          </td>
                          <td className={`px-4 py-2 text-right font-bold font-mono text-base ${results.netProfitActual >= 0 ? "text-green-700" : "text-red-700"}`}>
                            {rwf(Math.abs(results.netProfitActual))}
                          </td>
                        </tr>
                      </>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="mt-3 p-3 bg-[#1e3a5f]/5 border border-[#1e3a5f]/20 rounded-lg text-xs text-gray-600 flex flex-wrap gap-x-4 gap-y-1">
                <span><strong className="text-[#1e3a5f]">Formula:</strong> Selling Price = Total Cost × (1 + Profit%)</span>
                <span>|</span>
                <span>Net Profit = Selling Price − Total Cost</span>
              </div>
            </div>
          )}

          {/* Save & Reset */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-gray-100">
            {editingId && (
              <span className="w-full text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5 flex items-center gap-1.5">
                <Pencil className="w-3.5 h-3.5" />
                Editing saved record — click Update to save changes
              </span>
            )}
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <button
                disabled={results.totalCost === 0 || saveStatus === "saving"}
                onClick={async () => {
                  setSaveStatus("saving");
                  const payload = {
                    productName: productName || undefined,
                    purchasePrice: calc.purchasePrice,
                    transport: calc.transport,
                    taxes: calc.taxes,
                    packaging: calc.packaging,
                    labor: calc.labor,
                    otherExpenses: calc.otherExpenses,
                    customExpenses,
                    desiredProfitPct: calc.desiredProfitPct,
                    totalCost: results.totalCost,
                    recommendedSellingPrice: results.recommendedPrice,
                    actualSellingPrice: calc.actualSellingPrice > 0 ? calc.actualSellingPrice : undefined,
                  };
                  const res = editingId
                    ? await updateFinishedProductCalculation(editingId, payload)
                    : await saveFinishedProductCalculation(payload);

                  // Supermarket: also record the incoming finished product into the
                  // Finished Products stock records (visible on Stock Records), so it
                  // can be published to the marketplace from there. Only on new saves.
                  let stockOk = true;
                  if (res.success && isSupermarket && !editingId) {
                    const qty = parseFloat(quantity) > 0 ? parseFloat(quantity) : 1;
                    // the price customers pay: actual selling price if set, else recommended
                    const unitPrice = calc.actualSellingPrice > 0 ? calc.actualSellingPrice : results.recommendedPrice;
                    const stockRes = await saveFinishedProductStockRecord({
                      productName: productName || "Untitled product",
                      quantityProduced: qty,
                      productionCost: qty * unitPrice,
                      laborCost: 0,
                      packagingCost: 0,
                      transportCost: 0,
                      otherExpenses: 0,
                      customExpenses: [],
                      totalProductionCost: qty * unitPrice,
                      costPerUnit: unitPrice,
                      currentStock: qty,
                      recordDate: new Date().toISOString().split("T")[0],
                      imageUrl: productImage || undefined,
                      unitOfMeasure: unit,
                      lowStockThreshold: 0,
                      reservedStock: 0,
                      published: false,
                    });
                    stockOk = stockRes.success;
                  }

                  if (res.success) {
                    await loadCalcs();
                    setEditingId(null);
                    await clearFinishedProductDraft();
                    setAutoSaveStatus("idle");
                    setSavedToStock(isSupermarket && !editingId && stockOk);
                  }
                  setSaveStatus(res.success && stockOk ? "saved" : "error");
                }}
                className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed bg-[#1e3a5f] text-white hover:bg-[#16304f]"
              >
                <Save className="w-4 h-4" />
                {saveStatus === "saving" ? "Saving…" : saveStatus === "saved" ? "Saved!" : editingId ? "Update" : "Save"}
              </button>
              {editingId && saveStatus !== "saving" && (
                <button
                  onClick={() => { setEditingId(null); setSaveStatus("idle"); }}
                  className="text-xs text-gray-500 hover:text-red-600 border border-gray-200 hover:border-red-300 px-3 py-2 rounded-lg transition-colors"
                >
                  Cancel Edit
                </button>
              )}
              {saveStatus === "saved" && (
                savedToStock ? (
                  <span className="flex items-center gap-1.5 text-green-700 text-xs font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Saved to
                    <Link href="/supermarket/stock-records" className="underline hover:text-green-800">
                      Finished Product Records
                    </Link>
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-green-700 text-xs font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" /> {editingId ? "Updated!" : "Saved!"}
                  </span>
                )
              )}
              {saveStatus === "error" && (
                <span className="flex items-center gap-1 text-red-600 text-xs font-medium">
                  <AlertCircle className="w-3.5 h-3.5" /> Failed to save
                </span>
              )}
            </div>
            <button
              onClick={async () => {
                setCalc({
                  purchasePrice: 0, transport: 0, taxes: 0,
                  packaging: 0, labor: 0, otherExpenses: 0,
                  desiredProfitPct: 20, actualSellingPrice: 0,
                });
                setCustomExpenses([]);
                setProductName("");
                setProductImage("");
                setImageError("");
                setQuantity("");
                setUnit("Piece");
                setSavedToStock(false);
                setSaveStatus("idle");
                setEditingId(null);
                setAutoSaveStatus("idle");
                await clearFinishedProductDraft();
              }}
              className="text-xs text-gray-400 hover:text-[#1e3a5f] border border-gray-200 hover:border-[#1e3a5f] px-4 py-2 rounded-lg transition-colors"
            >
              Reset Calculator
            </button>
          </div>
        </div>
      </section>

      {/* Saved calculations history */}
      <section className="rounded-xl border border-gray-200 shadow-sm bg-white overflow-hidden">
        <div className="bg-[#1e3a5f]/5 border-b border-gray-200 px-6 py-3 flex items-center gap-2">
          <History className="w-4 h-4 text-[#1e3a5f]" />
          <h3 className="font-bold text-[#1e3a5f] text-sm uppercase tracking-wide">
            Saved Calculations
          </h3>
          <span className="text-xs bg-[#1e3a5f]/10 text-[#1e3a5f] px-2 py-0.5 rounded-full font-semibold">
            {savedCalcs.length}
          </span>
          <button
            onClick={downloadReport}
            disabled={downloading || savedCalcs.length === 0}
            className="ml-auto flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#1e3a5f] text-white hover:bg-[#16304f] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Download className="w-3.5 h-3.5" />
            {downloading ? "Generating…" : "Download Report"}
          </button>
        </div>

        {savedCalcs.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">
            No saved calculations yet. Fill in the form above and click Save.
          </div>
        ) : (
          <div className="overflow-x-auto" ref={tableRef}>
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-[#f0f4f8]">
                  <th className="px-4 py-2.5 text-left text-gray-600 font-semibold">Actions</th>
                  <th className="px-4 py-2.5 text-left text-gray-600 font-semibold">#</th>
                  <th className="px-4 py-2.5 text-left text-gray-600 font-semibold whitespace-nowrap">Product Name</th>
                  <th className="px-4 py-2.5 text-right text-gray-600 font-semibold whitespace-nowrap">Purchase Price</th>
                  <th className="px-4 py-2.5 text-right text-gray-600 font-semibold whitespace-nowrap">Transport</th>
                  <th className="px-4 py-2.5 text-right text-gray-600 font-semibold whitespace-nowrap">Taxes</th>
                  <th className="px-4 py-2.5 text-right text-gray-600 font-semibold whitespace-nowrap">Packaging</th>
                  <th className="px-4 py-2.5 text-right text-gray-600 font-semibold whitespace-nowrap">Labor</th>
                  <th className="px-4 py-2.5 text-right text-gray-600 font-semibold whitespace-nowrap">Other</th>
                  <th className="px-4 py-2.5 text-left text-gray-600 font-semibold whitespace-nowrap">Custom Expenses</th>
                  <th className="px-4 py-2.5 text-right text-gray-600 font-semibold whitespace-nowrap">Total Cost</th>
                  <th className="px-4 py-2.5 text-right text-gray-600 font-semibold whitespace-nowrap">Profit %</th>
                  <th className="px-4 py-2.5 text-right text-gray-600 font-semibold whitespace-nowrap">Recommended Price</th>
                  <th className="px-4 py-2.5 text-left text-gray-600 font-semibold whitespace-nowrap">Saved At</th>
                </tr>
              </thead>
              <tbody>
                {savedCalcs.map((row, i) => (
                  <tr
                    key={row.id}
                    className={`border-t border-gray-100 hover:bg-blue-50/30 transition-colors ${editingId === row.id ? "bg-amber-50" : i % 2 === 0 ? "bg-white" : "bg-[#f8fafc]"}`}
                  >
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleEdit(row)}
                          title="Edit"
                          className="p-1.5 rounded-md text-[#1e3a5f] hover:bg-[#1e3a5f] hover:text-white transition-colors"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => { if (confirm("Delete this saved calculation?")) handleDelete(row.id); }}
                          disabled={deletingId === row.id}
                          title="Delete"
                          className="p-1.5 rounded-md text-red-400 hover:bg-red-500 hover:text-white transition-colors disabled:opacity-40"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-2 text-gray-400 font-mono">{i + 1}</td>
                    <td className="px-4 py-2 font-medium text-gray-800 whitespace-nowrap">
                      {row.productName || <span className="text-gray-400 italic">—</span>}
                    </td>
                    <td className="px-4 py-2 text-right font-mono text-gray-700">
                      {row.purchasePrice > 0 ? rwf(row.purchasePrice) : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-2 text-right font-mono text-gray-700">
                      {row.transport > 0 ? rwf(row.transport) : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-2 text-right font-mono text-gray-700">
                      {row.taxes > 0 ? rwf(row.taxes) : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-2 text-right font-mono text-gray-700">
                      {row.packaging > 0 ? rwf(row.packaging) : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-2 text-right font-mono text-gray-700">
                      {row.labor > 0 ? rwf(row.labor) : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-2 text-right font-mono text-gray-700">
                      {row.otherExpenses > 0 ? rwf(row.otherExpenses) : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-2 text-gray-700 min-w-[140px]">
                      {row.customExpenses.length > 0 ? (
                        <ul className="space-y-0.5">
                          {row.customExpenses.map((e) => (
                            <li key={e.id} className="flex justify-between gap-3 whitespace-nowrap">
                              <span className="text-gray-500">{e.label || "Custom"}</span>
                              <span className="font-mono">{rwf(e.amount)}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-right font-mono font-bold text-gray-800">{rwf(row.totalCost)}</td>
                    <td className="px-4 py-2 text-right text-gray-700">{row.desiredProfitPct}%</td>
                    <td className="px-4 py-2 text-right font-mono font-bold text-[#1e3a5f]">
                      {rwf(row.recommendedSellingPrice)}
                    </td>
                    <td className="px-4 py-2 text-gray-500 whitespace-nowrap">
                      {new Date(row.createdAt).toLocaleString("en-US", {
                        month: "short", day: "numeric", year: "numeric",
                        hour: "2-digit", minute: "2-digit",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-[#1e3a5f] text-white font-bold text-xs">
                  <td className="px-4 py-2.5" colSpan={3}>TOTAL</td>
                  <td className="px-4 py-2.5 text-right font-mono">{rwf(savedTotals.purchasePrice)}</td>
                  <td className="px-4 py-2.5 text-right font-mono">{rwf(savedTotals.transport)}</td>
                  <td className="px-4 py-2.5 text-right font-mono">{rwf(savedTotals.taxes)}</td>
                  <td className="px-4 py-2.5 text-right font-mono">{rwf(savedTotals.packaging)}</td>
                  <td className="px-4 py-2.5 text-right font-mono">{rwf(savedTotals.labor)}</td>
                  <td className="px-4 py-2.5 text-right font-mono">{rwf(savedTotals.otherExpenses)}</td>
                  <td className="px-4 py-2.5 text-right font-mono">{rwf(savedTotals.customExpenses)}</td>
                  <td className="px-4 py-2.5 text-right font-mono">{rwf(savedTotals.totalCost)}</td>
                  <td className="px-4 py-2.5 text-right">—</td>
                  <td className="px-4 py-2.5 text-right font-mono text-blue-200">{rwf(savedTotals.recommendedSellingPrice)}</td>
                  <td className="px-4 py-2.5" />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
