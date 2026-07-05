"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { X, Plus, Trash2, Calculator, BarChart3, Save, CheckCircle, Loader2, Eye, EyeOff, Pencil, Check, FileDown, Search, PackagePlus, ImagePlus } from "lucide-react";
import {
  saveIndustryCalculation,
  saveIndustryStock,
  getMyIndustryStock,
  getRawMaterialRecords,
  saveFinishedProductStockRecord,
} from "@/app/actions/industry";
import type { StockItemData, RawMaterialRecord } from "@/app/actions/industry";

interface FeedItem {
  id: string;
  name: string;
  price: number;
}

interface StockItem {
  id: string;
  name: string;
  currentValue: number;
  newValue: number;
}

interface IndustryPriceCalculatorProps {
  onPriceConfirmed: (price: number) => void;
  onClose?: () => void;
  inline?: boolean;
}

type SaveState = "idle" | "saving" | "saved" | "error";

const FP_UNITS = ["Piece", "Box", "Kg", "Liter", "Bottle", "Bag", "Meter", "Ton", "Other"];

// Read an image file into a base64 data URL (JPEG/PNG/GIF/WebP, max 2MB).
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

export default function IndustryPriceCalculator({
  onPriceConfirmed,
  onClose,
  inline = false,
}: IndustryPriceCalculatorProps) {
  // ── Processed Details ──────────────────────────────────────────
  const [rawMaterialName, setRawMaterialName] = useState("");
  // the finished product's own name (typed by the manager); falls back to the
  // combined raw-material name when left blank
  const [productName, setProductName] = useState("");

  // ── Raw material totals (from the Raw Material Calculator records) ──
  // Multiple records can be combined to form one finished product.
  const [rawRecords, setRawRecords] = useState<RawMaterialRecord[]>([]);
  const [selectedRecordIds, setSelectedRecordIds] = useState<string[]>([]);
  const [recordSearch, setRecordSearch] = useState("");

  // ── Extra manual feeds ─────────────────────────────────────────
  const [extraFeeds, setExtraFeeds] = useState<FeedItem[]>([]);

  const [totalQty, setTotalQty] = useState(0);

  // ── Product summary ────────────────────────────────────────────
  const [qtyProducedBoxes, setQtyProducedBoxes] = useState(0);
  const [qtyProduced, setQtyProduced] = useState(0);
  const [desiredProfit, setDesiredProfit] = useState(0);

  // ── Auto stock entry (auto-pushed from calculator) ─────────────
  const [autoStockEntry, setAutoStockEntry] = useState<{
    name: string;
    currentValue: number;
    newValue: number;
  } | null>(null);
  // true after the first Confirm — locks currentValue and routes future calcs to newValue
  const autoEntryLockedRef = useRef(false);

  // ── Manual stock items ─────────────────────────────────────────
  const [stockItems, setStockItems] = useState<StockItem[]>([]);

  // ── Stock row interaction ──────────────────────────────────────
  const [editingStockId, setEditingStockId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<{ name: string; currentValue: number; newValue: number }>({ name: "", currentValue: 0, newValue: 0 });
  const [viewingStockId, setViewingStockId] = useState<string | null>(null);
  const [editingAuto, setEditingAuto] = useState(false);
  const [autoDraft, setAutoDraft] = useState<{ name: string; currentValue: number; newValue: number } | null>(null);
  const [viewingAuto, setViewingAuto] = useState(false);

  // ── Save state ─────────────────────────────────────────────────
  const [calcSaveState, setCalcSaveState] = useState<SaveState>("idle");
  const [stockSaveState, setStockSaveState] = useState<SaveState>("idle");
  // per-row state for "Save to finished products" (keyed by "auto" or item id)
  const [finishedSaveState, setFinishedSaveState] = useState<Record<string, SaveState>>({});
  // "Save to finished products" modal — collects details + image before saving
  const [finishedModal, setFinishedModal] = useState<{
    rowKey: string;
    name: string;
    quantity: string;
    unit: string;
    costPerUnit: string;
    imageUrl: string;
  } | null>(null);
  const [finishedModalError, setFinishedModalError] = useState("");
  const [finishedModalSaving, setFinishedModalSaving] = useState(false);

  // ── Load existing stock from DB on mount ───────────────────────
  useEffect(() => {
    getMyIndustryStock().then((rows: StockItemData[]) => {
      if (!rows.length) return;
      const autoRow = rows.find((r) => r.isAuto);
      const manualRows = rows.filter((r) => !r.isAuto);

      if (autoRow) {
        setAutoStockEntry({
          name: autoRow.name,
          currentValue: autoRow.currentValue,
          newValue: autoRow.newValue,
        });
      }
      setStockItems(
        manualRows.map((r, i) => ({
          id: String(i + 1),
          name: r.name,
          currentValue: r.currentValue,
          newValue: r.newValue,
        }))
      );
    });
  }, []);

  // ── Load saved Raw Material Calculator records to pick totals from ──
  useEffect(() => {
    getRawMaterialRecords().then(setRawRecords);
  }, []);

  // ── Picking records combines their totals into the raw material feed ──
  const selectedRecords = rawRecords.filter((r) => selectedRecordIds.includes(r.id));
  // filter the pick list by the search term so a long list stays manageable
  const visibleRecords = rawRecords.filter((r) =>
    r.materialName.toLowerCase().includes(recordSearch.trim().toLowerCase())
  );
  const toggleRecord = (id: string) => {
    setSelectedRecordIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      const names = rawRecords
        .filter((r) => next.includes(r.id))
        .map((r) => r.materialName)
        .join(" + ");
      setRawMaterialName(names);
      return next;
    });
  };

  // ── Derived values ─────────────────────────────────────────────
  // The raw material line is the combined total cost of the selected records
  // (each already includes purchase price, tax, transport and other expenses).
  const materialTotal = selectedRecords.reduce((s, r) => s + r.totalCost, 0);
  const autoFeedPrice = materialTotal;
  const autoFeedName = rawMaterialName || "Raw material";
  // Expenses (taxes, commission, labour, transport…) are accounted for in the
  // Raw Material Calculator. Here the cost base is purely the feeds.
  const processedValue = autoFeedPrice;
  const extraFeedsTotal = extraFeeds.reduce((s, f) => s + (f.price || 0), 0);
  const feedsTotal = autoFeedPrice + extraFeedsTotal;
  const totalFeedsPrice = feedsTotal;
  const salesMinPriceBox = qtyProducedBoxes > 0 ? totalFeedsPrice / qtyProducedBoxes : 0;
  const salesMinPricePcs = qtyProduced > 0 ? totalFeedsPrice / qtyProduced : 0;
  // Desired profit spread across all units/boxes
  const newPriceBox = qtyProducedBoxes > 0 ? (totalFeedsPrice + desiredProfit) / qtyProducedBoxes : 0;
  const newPriceUnit = qtyProduced > 0 ? (totalFeedsPrice + desiredProfit) / qtyProduced : 0;
  const profitPerUnit = newPriceUnit - salesMinPricePcs;
  const profitPerBox = newPriceBox - salesMinPriceBox;

  const stockCurrentTotal =
    (autoStockEntry?.currentValue ?? 0) +
    stockItems.reduce((s, i) => s + (i.currentValue || 0), 0);
  const stockNewTotal =
    (autoStockEntry?.newValue ?? 0) +
    stockItems.reduce((s, i) => s + (i.newValue || 0), 0);

  const maxBar = Math.max(salesMinPricePcs, newPriceUnit, 1);

  // the name shown in the product stock list: the typed product name if any,
  // otherwise the combined raw-material name
  const resolvedProductName = productName.trim() || rawMaterialName.trim();

  // ── Auto-populate stock list whenever newPriceBox changes ─────
  // Before first Confirm: currentValue tracks live price per box.
  // After first Confirm (locked): currentValue is frozen, newValue tracks recalculations.
  useEffect(() => {
    const name = resolvedProductName;
    if (!name || newPriceBox <= 0) return;

    if (!autoEntryLockedRef.current) {
      setAutoStockEntry({ name, currentValue: newPriceBox, newValue: 0 });
    } else {
      setAutoStockEntry((prev) =>
        prev ? { ...prev, newValue: newPriceBox } : prev
      );
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedProductName, newPriceBox]);

  const fmt = (n: number) =>
    n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // ── Feed helpers ───────────────────────────────────────────────
  const addExtraFeed = () =>
    setExtraFeeds((prev) => [...prev, { id: Date.now().toString(), name: "", price: 0 }]);

  const removeExtraFeed = (id: string) =>
    setExtraFeeds((prev) => prev.filter((f) => f.id !== id));

  const updateExtraFeed = (id: string, field: "name" | "price", value: string | number) =>
    setExtraFeeds((prev) => prev.map((f) => (f.id === id ? { ...f, [field]: value } : f)));

  // ── Stock helpers ──────────────────────────────────────────────
  const addStockItem = () =>
    setStockItems((prev) => [
      ...prev,
      { id: Date.now().toString(), name: "", currentValue: 0, newValue: 0 },
    ]);

  const removeStockItem = (id: string) =>
    setStockItems((prev) => prev.filter((s) => s.id !== id));

  const updateStockItem = (id: string, field: keyof StockItem, value: string | number) =>
    setStockItems((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );

  const commitStockEdit = (id: string) => {
    setStockItems((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...editDraft } : s))
    );
    setEditingStockId(null);
  };

  const commitAutoEdit = () => {
    if (autoDraft) setAutoStockEntry(autoDraft);
    setEditingAuto(false);
    setAutoDraft(null);
  };

  // ── Save all stock to DB ───────────────────────────────────────
  const handleSaveStock = async () => {
    setStockSaveState("saving");
    const items: StockItemData[] = [
      ...(autoStockEntry
        ? [{ name: autoStockEntry.name, currentValue: autoStockEntry.currentValue, newValue: autoStockEntry.newValue, isAuto: true }]
        : []),
      ...stockItems.map((s) => ({
        name: s.name,
        currentValue: s.currentValue,
        newValue: s.newValue,
        isAuto: false,
      })),
    ];
    const res = await saveIndustryStock(items);
    setStockSaveState(res.success ? "saved" : "error");
    setTimeout(() => setStockSaveState("idle"), 3000);
  };

  // ── Open the "Save to Finished Products" modal for a product row ─
  const openFinishedModal = (rowKey: string, name: string, unitValue: number) => {
    const suggested = qtyProduced || qtyProducedBoxes || 0;
    setFinishedModalError("");
    setFinishedModal({
      rowKey,
      name: name.trim(),
      quantity: suggested > 0 ? String(suggested) : "",
      unit: "Piece",
      costPerUnit: unitValue > 0 ? String(unitValue) : "",
      imageUrl: "",
    });
  };

  // pick an image for the modal (base64 data URL)
  const handleFinishedImage = async (file?: File) => {
    if (!file) return;
    try {
      const imageUrl = await readImageFile(file);
      setFinishedModal((m) => (m ? { ...m, imageUrl } : m));
      setFinishedModalError("");
    } catch (err) {
      setFinishedModalError(err instanceof Error ? err.message : "Could not read image.");
    }
  };

  // ── Save the modal's product into the Finished Product Records ──
  // The chosen quantity becomes the finished product's incoming (produced) stock.
  const confirmFinishedSave = async () => {
    if (!finishedModal) return;
    const name = finishedModal.name.trim();
    const qty = Number(finishedModal.quantity);
    const costPerUnit = Number(finishedModal.costPerUnit) || 0;
    if (!name) { setFinishedModalError("Product name is required."); return; }
    if (!qty || qty <= 0) { setFinishedModalError("Enter a valid number of products."); return; }

    const rowKey = finishedModal.rowKey;
    setFinishedModalSaving(true);
    const totalCost = costPerUnit * qty;
    const res = await saveFinishedProductStockRecord({
      productName: name,
      quantityProduced: qty,      // incoming / produced stock
      productionCost: totalCost,
      laborCost: 0,
      packagingCost: 0,
      transportCost: 0,
      otherExpenses: 0,
      customExpenses: [],
      totalProductionCost: totalCost,
      costPerUnit,
      unitOfMeasure: finishedModal.unit,
      imageUrl: finishedModal.imageUrl || undefined,
      published: false,
    });
    setFinishedModalSaving(false);

    if (res.success) {
      setFinishedModal(null);
      setFinishedSaveState((p) => ({ ...p, [rowKey]: "saved" }));
      setTimeout(
        () => setFinishedSaveState((p) => { const x = { ...p }; delete x[rowKey]; return x; }),
        3000
      );
    } else {
      setFinishedModalError(res.message || "Failed to save.");
    }
  };

  // labelled button that opens the image + details modal for a product row
  const FinishedBtn = ({ rowKey, name, value }: { rowKey: string; name: string; value: number }) => {
    const state = finishedSaveState[rowKey];
    return (
      <button
        onClick={() => openFinishedModal(rowKey, name, value)}
        className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-md transition-colors ${
          state === "saved"
            ? "bg-green-100 text-green-700"
            : state === "error"
            ? "bg-red-100 text-red-600"
            : "bg-teal-600 text-white hover:bg-teal-700"
        }`}
        title="Add image & save to Finished Product Records"
      >
        {state === "saved" ? <><CheckCircle className="w-3.5 h-3.5" /> Saved</>
          : <><ImagePlus className="w-3.5 h-3.5" /> Add image</>}
      </button>
    );
  };

  // ── Confirm price: lock stock entry + save to DB ──────────────
  const handleConfirmPrice = async () => {
    setCalcSaveState("saving");

    // 1 — Lock the auto entry:
    //     first confirm  → currentValue = newPriceBox (already shown live), newValue = 0
    //     next confirms  → currentValue stays frozen, newValue = latest newPriceBox
    const name = resolvedProductName || "Product";
    let updatedAutoEntry: typeof autoStockEntry;
    if (!autoEntryLockedRef.current) {
      // First confirm — freeze currentValue
      updatedAutoEntry = { name, currentValue: newPriceBox, newValue: 0 };
      autoEntryLockedRef.current = true;
    } else {
      // Recalculation — push into newValue
      updatedAutoEntry = { ...(autoStockEntry ?? { name, currentValue: newPriceBox }), newValue: newPriceBox };
    }
    setAutoStockEntry(updatedAutoEntry);

    // 2 — Save calculation to DB
    const calcRes = await saveIndustryCalculation({
      rawMaterialName: rawMaterialName,
      feedQuantity: selectedRecords.reduce((s, r) => s + r.quantityPurchased, 0),
      pricePerUnit: 0,
      autoFeedPrice,
      extraFeeds,
      totalTaxes: 0,
      commission: 0,
      labourCost: 0,
      totalTransport: 0,
      otherExpenses: 0,
      totalQty,
      qtyProducedBoxes,
      qtyProduced,
      possibleDiscount: desiredProfit,
      calculatedPricePerUnit: newPriceUnit,
      calculatedPricePerBox: newPriceBox,
      totalFeedsPrice,
    });

    setCalcSaveState(calcRes.success ? "saved" : "error");
    setTimeout(() => setCalcSaveState("idle"), 3000);

    // 3 — Also auto-save the stock (so currentValue / newValue persist)
    const stockRows: StockItemData[] = [
      { name: updatedAutoEntry.name, currentValue: updatedAutoEntry.currentValue, newValue: updatedAutoEntry.newValue, isAuto: true },
      ...stockItems.map((s) => ({
        name: s.name,
        currentValue: s.currentValue,
        newValue: s.newValue,
        isAuto: false,
      })),
    ];
    await saveIndustryStock(stockRows);

    // 4 — Notify parent
    onPriceConfirmed(newPriceUnit);
  };

  // ── Download stock list + calculation summary as PDF ──────────
  const downloadProducts = async () => {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const PW = 210, M = 14, CW = PW - 2 * M;
    const navy: [number, number, number] = [30, 58, 95];
    const light: [number, number, number] = [240, 244, 248];
    const white: [number, number, number] = [255, 255, 255];
    const frw = (n: number) => "Frw " + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    // Header
    doc.setFillColor(...navy); doc.rect(0, 0, PW, 22, "F");
    doc.setTextColor(...white); doc.setFontSize(14); doc.setFont("helvetica", "bold");
    doc.text("INDUSTRY PRODUCTS PRICE LIST", M, 14);
    doc.setFontSize(7); doc.setFont("helvetica", "normal");
    doc.text(`Generated: ${new Date().toLocaleString()}`, PW - M, 14, { align: "right" });

    let y = 30;

    // Calculation summary
    doc.setTextColor(...navy); doc.setFontSize(10); doc.setFont("helvetica", "bold");
    doc.text("Calculation Summary", M, y); y += 5;

    const summaryRows: [string, string][] = [
      ["Product", resolvedProductName || "—"],
      ["Raw Materials", rawMaterialName || "—"],
      ["Raw Material Total", frw(materialTotal)],
      ["Total Feeds Price", frw(feedsTotal)],
      ["Total Cost", frw(totalFeedsPrice)],
      ["QTY Produced (boxes)", qtyProducedBoxes > 0 ? qtyProducedBoxes.toLocaleString() : "—"],
      ["QTY Produced (units)", qtyProduced > 0 ? qtyProduced.toLocaleString() : "—"],
      ["Desired Profit", desiredProfit > 0 ? frw(desiredProfit) : "—"],
      ["Sales Min Price / Box", frw(salesMinPriceBox)],
      ["Sales Min Price / Pcs", frw(salesMinPricePcs)],
      ["New Price / Box", frw(newPriceBox)],
      ["New Price / Unit", frw(newPriceUnit)],
    ];

    const col1W = 60, col2W = CW - col1W;
    summaryRows.forEach(([label, value], i) => {
      if (i % 2 === 0) { doc.setFillColor(...light); doc.rect(M, y, CW, 6.5, "F"); }
      doc.setTextColor(80, 80, 80); doc.setFontSize(7); doc.setFont("helvetica", "normal");
      doc.text(label, M + 2, y + 4.5);
      doc.setTextColor(30, 30, 30); doc.setFont("helvetica", "bold");
      doc.text(value, M + col1W + 2, y + 4.5);
      y += 6.5;
    });
    y += 8;

    // Products in stock table
    doc.setTextColor(...navy); doc.setFontSize(10); doc.setFont("helvetica", "bold");
    doc.text("List of Products in Stock", M, y); y += 5;

    const heads = ["#", "Product Name", "Current Value", "New Value", "Type"];
    const colW = [8, CW - 8 - 40 - 40 - 20, 40, 40, 20];
    const RH = 7;

    // Header row
    doc.setFillColor(...navy); doc.rect(M, y, CW, RH, "F");
    doc.setTextColor(...white); doc.setFontSize(7); doc.setFont("helvetica", "bold");
    let cx = M + 2;
    heads.forEach((h, i) => { doc.text(h, cx, y + RH - 1.5); cx += colW[i]; });
    y += RH;

    // All stock rows
    const allItems = [
      ...(autoStockEntry ? [{ name: autoStockEntry.name, currentValue: autoStockEntry.currentValue, newValue: autoStockEntry.newValue, isAuto: true }] : []),
      ...stockItems.map(s => ({ name: s.name, currentValue: s.currentValue, newValue: s.newValue, isAuto: false })),
    ];

    allItems.forEach((item, i) => {
      if (i % 2 === 0) { doc.setFillColor(...light); doc.rect(M, y, CW, RH, "F"); }
      doc.setTextColor(30, 30, 30); doc.setFontSize(7); doc.setFont("helvetica", "normal");
      cx = M + 2;
      [
        String(i + 1),
        item.name || "—",
        item.currentValue > 0 ? frw(item.currentValue) : "—",
        item.newValue > 0 ? frw(item.newValue) : "—",
        item.isAuto ? "Auto" : "Manual",
      ].forEach((cell, ci) => { doc.text(cell, cx, y + RH - 1.5); cx += colW[ci]; });
      y += RH;
    });

    // Totals row
    doc.setFillColor(...navy); doc.rect(M, y, CW, RH, "F");
    doc.setTextColor(...white); doc.setFontSize(7); doc.setFont("helvetica", "bold");
    cx = M + 2;
    ["", "Total", frw(stockCurrentTotal), frw(stockNewTotal), ""].forEach((cell, ci) => {
      doc.text(cell, cx, y + RH - 1.5); cx += colW[ci];
    });
    y += RH + 8;

    // Footer
    doc.setFontSize(7); doc.setTextColor(150, 150, 150);
    doc.text("Vertex Industry Management System", M, 290);

    doc.save("products-price-list.pdf");
  };

  const SaveIcon = ({ state }: { state: SaveState }) => {
    if (state === "saving") return <Loader2 className="w-3.5 h-3.5 animate-spin" />;
    if (state === "saved")  return <CheckCircle className="w-3.5 h-3.5 text-green-400" />;
    return <Save className="w-3.5 h-3.5" />;
  };

  // ── Render ─────────────────────────────────────────────────────
  const inner = (
    <div className={inline ? "bg-white rounded-2xl shadow-lg w-full" : "bg-white w-full max-w-6xl rounded-2xl shadow-2xl"}>
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-purple-700 text-white px-8 py-5 rounded-t-2xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Calculator className="w-8 h-8" />
          <h1 className="text-2xl md:text-3xl font-black tracking-wide uppercase">
            INDUSTRY PRICE Calculator
          </h1>
        </div>
        {!inline && onClose && (
          <button onClick={onClose} className="hover:text-gray-200 transition-colors">
            <X className="w-6 h-6" />
          </button>
        )}
      </div>

      <div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* ── LEFT PANEL ── */}
        <div className="space-y-4">

          {/* 1. Processed Details */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="grid grid-cols-2 bg-purple-100">
              <div className="px-4 py-2 font-bold text-purple-900 text-sm">Processed Details</div>
              <div className="px-4 py-2 text-gray-500 text-sm">Insert your data</div>
            </div>
            {/* Finished product name — typed by the manager */}
            <div className="grid grid-cols-2 border-t border-gray-100 items-center">
              <span className="px-4 py-2 text-sm text-gray-600">Product name</span>
              <input
                type="text"
                className="px-3 py-2 text-sm border-l border-gray-100 outline-none w-full focus:bg-blue-50"
                placeholder={rawMaterialName || "e.g. Mango Juice"}
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
              />
            </div>
            {/* Raw materials — combine one or more saved Raw Material Calculator records */}
            <div className="border-t border-gray-100 px-4 py-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Raw materials (combine to form the product)</span>
                {selectedRecordIds.length > 0 && (
                  <span className="text-xs font-semibold text-emerald-700">
                    {selectedRecordIds.length} selected · Frw {materialTotal.toLocaleString()}
                  </span>
                )}
              </div>
              {rawRecords.length === 0 ? (
                <p className="text-xs text-gray-400 italic">
                  No raw material records yet. Save records in the Raw Material Calculator first.
                </p>
              ) : (
                <>
                  {/* Selected materials stay pinned as removable chips */}
                  {selectedRecords.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {selectedRecords.map((r) => (
                        <span
                          key={r.id}
                          className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-[11px] font-medium px-2 py-1 rounded-full"
                        >
                          <span className="truncate max-w-[9rem]" title={r.materialName}>{r.materialName}</span>
                          <button
                            type="button"
                            onClick={() => toggleRecord(r.id)}
                            className="text-emerald-600 hover:text-emerald-900 shrink-0"
                            title="Remove"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Search to filter a long list */}
                  <div className="relative mb-2">
                    <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={recordSearch}
                      onChange={(e) => setRecordSearch(e.target.value)}
                      placeholder="Search raw materials…"
                      className="w-full border border-gray-300 rounded-lg pl-8 pr-8 py-1.5 text-xs outline-none focus:ring-2 focus:ring-emerald-400"
                    />
                    {recordSearch && (
                      <button
                        type="button"
                        onClick={() => setRecordSearch("")}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        title="Clear"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="max-h-44 overflow-y-auto rounded-lg border border-gray-200 divide-y divide-gray-100">
                    {visibleRecords.length === 0 ? (
                      <p className="px-3 py-3 text-xs text-gray-400 italic">No materials match &quot;{recordSearch}&quot;.</p>
                    ) : (
                      visibleRecords.map((r) => {
                        const checked = selectedRecordIds.includes(r.id);
                        return (
                          <label
                            key={r.id}
                            className={`flex items-center gap-3 px-3 py-2 text-xs cursor-pointer transition-colors ${checked ? "bg-emerald-50" : "hover:bg-gray-50"}`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleRecord(r.id)}
                              className="accent-emerald-600 w-4 h-4 shrink-0"
                            />
                            <span className="font-medium text-gray-800 flex-1 truncate" title={r.materialName}>
                              {r.materialName}
                            </span>
                            <span className="text-gray-500 whitespace-nowrap">
                              {r.quantityPurchased.toLocaleString()} {r.unit}
                            </span>
                            <span className="font-semibold text-emerald-700 whitespace-nowrap w-24 text-right">
                              Frw {r.totalCost.toLocaleString()}
                            </span>
                          </label>
                        );
                      })
                    )}
                  </div>
                </>
              )}
            </div>
            <div className="grid grid-cols-2 border-t border-gray-200 bg-purple-50 items-center">
              <span className="px-4 py-2 text-sm text-purple-700 font-medium">
                {autoFeedName} (auto feed price)
              </span>
              <span className="px-3 py-2 text-purple-800 font-bold text-sm text-right">
                Frw {autoFeedPrice.toLocaleString()}
              </span>
            </div>
            <div className="grid grid-cols-2 border-t border-gray-200 bg-gray-50 items-center">
              <span className="px-4 py-2 text-sm text-gray-500">Processed value</span>
              <span className="px-3 py-2 text-blue-500 font-semibold text-right text-sm">
                Frw {processedValue.toLocaleString()}
              </span>
            </div>
          </div>

          {/* 2. Production total — expenses live in the Raw Material Calculator */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="grid grid-cols-2 bg-purple-100">
              <div className="px-4 py-2 font-bold text-purple-900 text-sm">Production total</div>
              <div className="px-4 py-2 text-gray-500 text-sm">Insert your data</div>
            </div>

            {/* Processed value — read-only, flows from Processed Details */}
            <div className="grid grid-cols-2 border-t border-gray-200 bg-purple-50 items-center">
              <span className="px-4 py-2 text-sm text-purple-700 font-medium">Processed value</span>
              <span className="px-3 py-2 text-purple-800 font-bold text-sm text-right">
                Frw {fmt(processedValue)}
              </span>
            </div>

            <div className="grid grid-cols-2 border-t border-gray-100 items-center">
              <span className="px-4 py-2 text-sm text-gray-600">Total QTY</span>
              <input
                type="number"
                className="px-3 py-2 text-sm border-l border-gray-100 outline-none w-full focus:bg-blue-50"
                placeholder="0"
                value={totalQty || ""}
                onChange={(e) => setTotalQty(Number(e.target.value))}
              />
            </div>
          </div>

          {/* 3. List of feeds — below expenses */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="grid grid-cols-2 bg-purple-100">
              <div className="px-4 py-2 font-bold text-purple-900 text-sm">List of feeds</div>
              <div className="px-4 py-2 font-bold text-blue-800 text-sm bg-blue-100">Price (Frw)</div>
            </div>

            {/* Auto-calculated rows — one per selected raw material (locked) */}
            {selectedRecords.length === 0 ? (
              <div className="grid grid-cols-2 border-t border-gray-100 bg-purple-50 items-center">
                <div className="flex items-center gap-2 px-4 py-2 border-r border-gray-100">
                  <span className="text-sm text-gray-400 italic truncate">No raw material selected</span>
                  <span className="text-[10px] bg-purple-200 text-purple-700 px-1.5 rounded ml-auto shrink-0">auto</span>
                </div>
                <span className="px-3 py-2 text-sm font-semibold text-purple-800 text-right">0</span>
              </div>
            ) : (
              selectedRecords.map((r) => (
                <div key={r.id} className="grid grid-cols-2 border-t border-gray-100 bg-purple-50 items-center">
                  <div className="flex items-center gap-2 px-4 py-2 border-r border-gray-100">
                    <span className="text-sm text-purple-800 font-medium truncate" title={r.materialName}>{r.materialName}</span>
                    <span className="text-[10px] bg-purple-200 text-purple-700 px-1.5 rounded ml-auto shrink-0">auto</span>
                  </div>
                  <span className="px-3 py-2 text-sm font-semibold text-purple-800 text-right">
                    {r.totalCost.toLocaleString()}
                  </span>
                </div>
              ))
            )}

            {/* Extra manual feeds */}
            {extraFeeds.map((feed) => (
              <div key={feed.id} className="grid grid-cols-2 border-t border-gray-100 group items-center">
                <div className="flex items-center gap-1 px-2 py-1 border-r border-gray-100">
                  <input
                    className="flex-1 px-2 py-1 text-sm outline-none"
                    placeholder="feed name"
                    value={feed.name}
                    onChange={(e) => updateExtraFeed(feed.id, "name", e.target.value)}
                  />
                  <button
                    onClick={() => removeExtraFeed(feed.id)}
                    className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
                <input
                  type="number"
                  className="px-3 py-1 text-sm outline-none w-full focus:bg-blue-50"
                  placeholder="0"
                  value={feed.price || ""}
                  onChange={(e) => updateExtraFeed(feed.id, "price", Number(e.target.value))}
                />
              </div>
            ))}

            <div className="border-t border-gray-100 px-4 py-2">
              <button
                onClick={addExtraFeed}
                className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Add feed
              </button>
            </div>
            {/* Sub-total of just the feeds listed above */}
            <div className="grid grid-cols-2 border-t border-gray-200 bg-gray-50 items-center">
              <span className="px-4 py-2 text-sm text-gray-600">Feeds sub-total</span>
              <span className="px-3 py-2 text-sm font-semibold text-gray-700 text-right">
                Frw {feedsTotal.toLocaleString()}
              </span>
            </div>
            {/* Total feeds = product cost = every calculation above (processed value + all expenses + feeds).
                This is the cost base added to the desired profit to compute the selling price. */}
            <div className="grid grid-cols-2 bg-black text-white">
              <span className="px-4 py-2 font-bold text-sm">Total feeds (Product cost)</span>
              <span className="px-3 py-2 font-bold text-sm text-right">
                Frw {totalFeedsPrice.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div className="space-y-4">
          {/* Product Summary */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-blue-200 px-4 py-2 font-bold text-blue-900 text-sm">
              Product Summary
            </div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-3 gap-2 text-[11px] text-gray-500 font-medium uppercase tracking-wide">
                <span>Total feeds price</span>
                <span>Sales min price/box</span>
                <span>Sales min price/pcs</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-xl font-bold text-gray-800">Frw {totalFeedsPrice.toLocaleString()}</span>
                <span className="text-xl font-bold text-gray-800">Frw {fmt(salesMinPriceBox)}</span>
                <span className="text-xl font-bold text-gray-800">Frw {fmt(salesMinPricePcs)}</span>
              </div>
              <div className="h-px bg-gray-100" />

              <div className="grid grid-cols-3 gap-2 text-[11px] text-gray-500 font-medium uppercase tracking-wide">
                <span>QTY Produced in boxes</span>
                <span>QTY Produced</span>
                <span>Desired Profit (Frw)</span>
              </div>
              <div className="grid grid-cols-3 gap-2 items-center">
                <input type="number" className="border border-gray-300 rounded px-2 py-1 text-sm w-full outline-none focus:border-blue-400" placeholder="boxes" value={qtyProducedBoxes || ""} onChange={(e) => setQtyProducedBoxes(Number(e.target.value))} />
                <input type="number" className="border border-gray-300 rounded px-2 py-1 text-sm w-full outline-none focus:border-blue-400" placeholder="units" value={qtyProduced || ""} onChange={(e) => setQtyProduced(Number(e.target.value))} />
                <input type="number" className="border border-green-300 rounded px-2 py-1 text-sm w-full outline-none focus:border-green-500 bg-green-50 font-semibold text-green-800" placeholder="0" value={desiredProfit || ""} onChange={(e) => setDesiredProfit(Number(e.target.value))} />
              </div>

              {/* Profit breakdown */}
              {desiredProfit > 0 && (
                <div className="grid grid-cols-3 gap-2 bg-green-50 rounded-lg px-3 py-2 text-xs">
                  <div>
                    <p className="text-gray-500 font-medium">Total Desired Profit</p>
                    <p className="font-bold text-green-700">Frw {fmt(desiredProfit)}</p>
                  </div>
                  {qtyProducedBoxes > 0 && (
                    <div>
                      <p className="text-gray-500 font-medium">Profit / Box</p>
                      <p className="font-bold text-green-700">Frw {fmt(profitPerBox)}</p>
                    </div>
                  )}
                  {qtyProduced > 0 && (
                    <div>
                      <p className="text-gray-500 font-medium">Profit / Unit</p>
                      <p className="font-bold text-green-700">Frw {fmt(profitPerUnit)}</p>
                    </div>
                  )}
                </div>
              )}
              <div className="h-px bg-gray-100" />

              <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-500 font-medium uppercase tracking-wide">
                <span>New price/box</span>
                <span>New price/unit</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <span className="text-2xl font-bold text-gray-900">
                  Frw {newPriceBox.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
                <span className="text-2xl font-bold text-green-700">
                  Frw {newPriceUnit.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
              </div>
            </div>
          </div>

          {/* Price comparison */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-blue-200 px-4 py-2 font-bold text-blue-900 text-sm flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Price comparison
            </div>
            <div className="p-4 space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-500 w-28 text-right shrink-0">Current solution</span>
                <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                  <div className="h-full bg-blue-400 rounded-full transition-all duration-500" style={{ width: `${totalFeedsPrice > 0 ? (salesMinPricePcs / maxBar) * 100 : 0}%` }} />
                </div>
                <span className="text-xs font-mono w-28 shrink-0">Frw {fmt(salesMinPricePcs)}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-500 w-28 text-right shrink-0">New solution</span>
                <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                  <div className="h-full bg-purple-500 rounded-full transition-all duration-500" style={{ width: `${totalFeedsPrice > 0 ? (newPriceUnit / maxBar) * 100 : 0}%` }} />
                </div>
                <span className="text-xs font-mono w-28 shrink-0">Frw {fmt(newPriceUnit)}</span>
              </div>
              <div className="flex justify-between text-[10px] text-gray-400 mt-1 ml-[7.5rem]">
                <span>Frw 0</span>
                <span>Frw {fmt(maxBar / 2)}</span>
                <span>Frw {fmt(maxBar)}</span>
              </div>
            </div>
          </div>

          {/* List of product in stock */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            {/* Header */}
            <div className="flex text-white text-xs font-bold">
              <div className="flex-[2] bg-orange-400 px-3 py-2 border-r border-orange-300">LIST OF PRODUCT in stock</div>
              <div className="flex-1 bg-pink-500 px-2 py-2 border-r border-pink-400 text-center">Current Value</div>
              <div className="flex-1 bg-pink-400 px-2 py-2 border-r border-pink-300 text-center">New Value</div>
              <div className="w-32 bg-orange-500 px-2 py-2 text-center">Actions</div>
            </div>

            {/* ── Auto entry ── */}
            {autoStockEntry && (
              <>
                {editingAuto && autoDraft ? (
                  /* Auto — edit mode */
                  <div className="flex border-t border-gray-100 bg-purple-50 items-center">
                    <div className="flex-[2] border-r border-gray-100 px-2 py-1">
                      <input className="w-full px-1 py-0.5 text-xs border border-blue-300 rounded outline-none bg-white" value={autoDraft.name} onChange={(e) => setAutoDraft((d) => d && ({ ...d, name: e.target.value }))} />
                    </div>
                    <div className="flex-1 border-r border-gray-100 px-2 py-1">
                      <input type="number" className="w-full px-1 py-0.5 text-xs border border-blue-300 rounded outline-none text-center bg-white" value={autoDraft.currentValue || ""} onChange={(e) => setAutoDraft((d) => d && ({ ...d, currentValue: Number(e.target.value) }))} />
                    </div>
                    <div className="flex-1 border-r border-gray-100 px-2 py-1">
                      <input type="number" className="w-full px-1 py-0.5 text-xs border border-blue-300 rounded outline-none text-center bg-white" value={autoDraft.newValue || ""} onChange={(e) => setAutoDraft((d) => d && ({ ...d, newValue: Number(e.target.value) }))} />
                    </div>
                    <div className="w-32 px-1 py-1 flex items-center justify-center gap-1">
                      <button onClick={commitAutoEdit} className="p-1 rounded bg-green-100 hover:bg-green-200 text-green-700" title="Save"><Check className="w-3.5 h-3.5" /></button>
                      <button onClick={() => { setEditingAuto(false); setAutoDraft(null); }} className="p-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-600" title="Cancel"><X className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                ) : (
                  /* Auto — view mode */
                  <div className="flex border-t border-gray-100 bg-purple-50 items-center">
                    <div className="flex-[2] px-3 py-1.5 border-r border-gray-100 flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-purple-900 truncate flex-1">{autoStockEntry.name}</span>
                      <span className="text-[9px] bg-purple-200 text-purple-700 px-1.5 py-0.5 rounded shrink-0">auto</span>
                    </div>
                    <div className="flex-1 px-2 py-1.5 text-xs text-center border-r border-gray-100 font-bold text-gray-800">
                      Frw {autoStockEntry.currentValue.toLocaleString()}
                    </div>
                    <div className={`flex-1 px-2 py-1.5 text-xs text-center border-r border-gray-100 font-bold ${autoStockEntry.newValue > 0 ? "text-green-700" : "text-gray-400"}`}>
                      {autoStockEntry.newValue > 0 ? `Frw ${autoStockEntry.newValue.toLocaleString()}` : "—"}
                    </div>
                    <div className="w-32 px-1 py-1 flex items-center justify-center gap-1">
                      <FinishedBtn rowKey="auto" name={autoStockEntry.name} value={autoStockEntry.newValue > 0 ? autoStockEntry.newValue : autoStockEntry.currentValue} />
                      <button onClick={() => setViewingAuto((v) => !v)} className="p-1 rounded hover:bg-blue-100 text-blue-600" title="View">
                        {viewingAuto ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                      <button onClick={() => { setEditingAuto(true); setAutoDraft({ ...autoStockEntry }); setViewingAuto(false); }} className="p-1 rounded hover:bg-amber-100 text-amber-600" title="Edit">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Auto — view detail panel */}
                {viewingAuto && !editingAuto && (
                  <div className="bg-blue-50 border-t border-blue-100 px-4 py-3 text-xs grid grid-cols-2 gap-x-6 gap-y-1.5">
                    <div><span className="text-gray-500">Product:</span> <span className="font-semibold ml-1">{autoStockEntry.name}</span></div>
                    <div><span className="text-gray-500">Type:</span> <span className="font-semibold text-purple-700 ml-1">Auto-calculated</span></div>
                    <div><span className="text-gray-500">Current Value:</span> <span className="font-bold text-gray-800 ml-1">Frw {autoStockEntry.currentValue.toLocaleString()}</span></div>
                    <div>
                      <span className="text-gray-500">New Value:</span>
                      <span className={`font-bold ml-1 ${autoStockEntry.newValue > 0 ? "text-green-700" : "text-gray-400"}`}>
                        {autoStockEntry.newValue > 0 ? `Frw ${autoStockEntry.newValue.toLocaleString()}` : "Not yet recalculated"}
                      </span>
                    </div>
                    {autoStockEntry.newValue > 0 && autoStockEntry.currentValue > 0 && (
                      <div>
                        <span className="text-gray-500">Price change:</span>
                        <span className={`font-bold ml-1 ${autoStockEntry.newValue >= autoStockEntry.currentValue ? "text-green-600" : "text-red-600"}`}>
                          {((autoStockEntry.newValue - autoStockEntry.currentValue) / autoStockEntry.currentValue * 100).toFixed(1)}%
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {/* ── Manual stock items ── */}
            {stockItems.map((item) => (
              <div key={item.id}>
                {editingStockId === item.id ? (
                  /* Edit mode */
                  <div className="flex border-t border-gray-100 bg-amber-50 items-center">
                    <div className="flex-[2] border-r border-gray-100 px-2 py-1">
                      <input className="w-full px-1 py-0.5 text-xs border border-blue-300 rounded outline-none bg-white" placeholder="product name" value={editDraft.name} onChange={(e) => setEditDraft((d) => ({ ...d, name: e.target.value }))} />
                    </div>
                    <div className="flex-1 border-r border-gray-100 px-2 py-1">
                      <input type="number" className="w-full px-1 py-0.5 text-xs border border-blue-300 rounded outline-none text-center bg-white" placeholder="0" value={editDraft.currentValue || ""} onChange={(e) => setEditDraft((d) => ({ ...d, currentValue: Number(e.target.value) }))} />
                    </div>
                    <div className="flex-1 border-r border-gray-100 px-2 py-1">
                      <input type="number" className="w-full px-1 py-0.5 text-xs border border-blue-300 rounded outline-none text-center bg-white" placeholder="0" value={editDraft.newValue || ""} onChange={(e) => setEditDraft((d) => ({ ...d, newValue: Number(e.target.value) }))} />
                    </div>
                    <div className="w-32 px-1 py-1 flex items-center justify-center gap-1">
                      <button onClick={() => commitStockEdit(item.id)} className="p-1 rounded bg-green-100 hover:bg-green-200 text-green-700" title="Save"><Check className="w-3.5 h-3.5" /></button>
                      <button onClick={() => setEditingStockId(null)} className="p-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-600" title="Cancel"><X className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                ) : (
                  /* View mode */
                  <div className="flex border-t border-gray-100 items-center hover:bg-gray-50 transition-colors">
                    <div className="flex-[2] px-3 py-1.5 border-r border-gray-100 text-xs font-medium text-gray-800 truncate">
                      {item.name || <span className="text-gray-400 italic">unnamed</span>}
                    </div>
                    <div className="flex-1 px-2 py-1.5 text-xs text-center border-r border-gray-100 text-gray-700 font-semibold">
                      {item.currentValue > 0 ? `Frw ${item.currentValue.toLocaleString()}` : "—"}
                    </div>
                    <div className={`flex-1 px-2 py-1.5 text-xs text-center border-r border-gray-100 font-semibold ${item.newValue > 0 ? "text-green-700" : "text-gray-400"}`}>
                      {item.newValue > 0 ? `Frw ${item.newValue.toLocaleString()}` : "—"}
                    </div>
                    <div className="w-32 px-1 py-1 flex items-center justify-center gap-1">
                      <FinishedBtn rowKey={item.id} name={item.name} value={item.newValue > 0 ? item.newValue : item.currentValue} />
                      <button onClick={() => { setViewingStockId(viewingStockId === item.id ? null : item.id); setEditingStockId(null); }} className="p-1 rounded hover:bg-blue-100 text-blue-600" title="View">
                        {viewingStockId === item.id ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                      <button onClick={() => { setEditingStockId(item.id); setEditDraft({ name: item.name, currentValue: item.currentValue, newValue: item.newValue }); setViewingStockId(null); }} className="p-1 rounded hover:bg-amber-100 text-amber-600" title="Edit">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => { if (window.confirm(`Delete "${item.name || "this item"}"?`)) removeStockItem(item.id); }} className="p-1 rounded hover:bg-red-100 text-red-500" title="Delete">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Detail panel */}
                {viewingStockId === item.id && editingStockId !== item.id && (
                  <div className="bg-blue-50 border-t border-blue-100 px-4 py-3 text-xs grid grid-cols-2 gap-x-6 gap-y-1.5">
                    <div><span className="text-gray-500">Product:</span> <span className="font-semibold ml-1">{item.name || "—"}</span></div>
                    <div><span className="text-gray-500">Type:</span> <span className="font-semibold text-gray-700 ml-1">Manual entry</span></div>
                    <div><span className="text-gray-500">Current Value:</span> <span className="font-bold text-gray-800 ml-1">{item.currentValue > 0 ? `Frw ${item.currentValue.toLocaleString()}` : "—"}</span></div>
                    <div><span className="text-gray-500">New Value:</span> <span className={`font-bold ml-1 ${item.newValue > 0 ? "text-green-700" : "text-gray-400"}`}>{item.newValue > 0 ? `Frw ${item.newValue.toLocaleString()}` : "—"}</span></div>
                    {item.newValue > 0 && item.currentValue > 0 && (
                      <div>
                        <span className="text-gray-500">Price change:</span>
                        <span className={`font-bold ml-1 ${item.newValue >= item.currentValue ? "text-green-600" : "text-red-600"}`}>
                          {((item.newValue - item.currentValue) / item.currentValue * 100).toFixed(1)}%
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}

            <div className="border-t border-gray-100 px-3 py-2 flex items-center justify-between gap-2">
              <button onClick={addStockItem} className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1">
                <Plus className="w-3 h-3" /> Add product
              </button>
              <div className="flex items-center gap-2">
              {/* Download Products button */}
              <button
                onClick={downloadProducts}
                className="flex items-center gap-1.5 text-xs px-3 py-1 rounded-md font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
              >
                <FileDown className="w-3.5 h-3.5" /> Download
              </button>
              {/* Save Stock button */}
              <button
                onClick={handleSaveStock}
                disabled={stockSaveState === "saving"}
                className={`flex items-center gap-1.5 text-xs px-3 py-1 rounded-md font-medium transition-colors ${
                  stockSaveState === "saved"
                    ? "bg-green-100 text-green-700"
                    : stockSaveState === "error"
                    ? "bg-red-100 text-red-700"
                    : "bg-slate-700 text-white hover:bg-slate-800"
                }`}
              >
                <SaveIcon state={stockSaveState} />
                {stockSaveState === "saving" ? "Saving…" : stockSaveState === "saved" ? "Saved!" : stockSaveState === "error" ? "Failed" : "Save Stock"}
              </button>
              </div>
            </div>

            <div className="flex bg-gray-50 border-t border-gray-200 text-xs font-semibold text-gray-700">
              <div className="flex-[2] px-3 py-2 border-r border-gray-200">Value total</div>
              <div className="flex-1 px-2 py-2 text-center border-r border-gray-200">Frw {stockCurrentTotal.toLocaleString()}</div>
              <div className="flex-1 px-2 py-2 text-center border-r border-gray-200">Frw {stockNewTotal.toLocaleString()}</div>
              <div className="w-32" />
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 bg-gray-50 rounded-b-2xl border-t border-gray-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="text-sm text-gray-600">
          <span className="font-semibold">Calculated price per unit: </span>
          <span className="text-green-600 font-bold text-lg ml-1">
            {newPriceUnit > 0 ? `Frw ${fmt(newPriceUnit)}` : "—"}
          </span>
          {newPriceBox > 0 && (
            <span className="ml-4 text-gray-500 text-xs">
              Price/box: <strong>Frw {fmt(newPriceBox)}</strong>
            </span>
          )}
          {calcSaveState === "saved" && (
            <span className="ml-3 text-green-600 text-xs inline-flex items-center gap-1">
              <CheckCircle className="w-3 h-3" /> Calculation saved
            </span>
          )}
          {calcSaveState === "error" && (
            <span className="ml-3 text-red-500 text-xs">Save failed</span>
          )}
        </div>
        <div className="flex gap-3">
          {!inline && onClose && (
            <Button variant="outline" onClick={onClose}>Cancel</Button>
          )}
          <Button
            className="bg-green-600 hover:bg-green-700 text-white"
            disabled={newPriceUnit <= 0 || calcSaveState === "saving"}
            onClick={handleConfirmPrice}
          >
            {calcSaveState === "saving" ? (
              <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Saving…</>
            ) : (
              inline ? "Confirm Price & Upload Product →" : "Confirm Price & Continue"
            )}
          </Button>
        </div>
      </div>
    </div>
  );

  // ── "Save to Finished Products" modal ──────────────────────────
  const finishedModalEl = finishedModal && (
    <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4" onClick={() => !finishedModalSaving && setFinishedModal(null)}>
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-teal-600 to-emerald-600 text-white px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PackagePlus className="w-5 h-5" />
            <h2 className="text-base font-bold">Save to Finished Products</h2>
          </div>
          <button onClick={() => !finishedModalSaving && setFinishedModal(null)} className="hover:text-gray-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {finishedModalError && (
            <div className="text-red-600 text-xs bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {finishedModalError}
            </div>
          )}

          {/* Image picker with preview */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Product image</label>
            <div className="flex items-center gap-3">
              <div className="w-20 h-20 rounded-lg border border-gray-200 bg-gray-50 overflow-hidden flex items-center justify-center shrink-0">
                {finishedModal.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={finishedModal.imageUrl} alt="preview" className="w-full h-full object-cover" />
                ) : (
                  <ImagePlus className="w-6 h-6 text-gray-300" />
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md font-medium bg-teal-600 text-white hover:bg-teal-700 cursor-pointer transition-colors">
                  <ImagePlus className="w-3.5 h-3.5" /> {finishedModal.imageUrl ? "Change image" : "Add image"}
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFinishedImage(e.target.files?.[0])} />
                </label>
                {finishedModal.imageUrl && (
                  <button onClick={() => setFinishedModal((m) => (m ? { ...m, imageUrl: "" } : m))} className="text-xs text-red-500 hover:text-red-700 text-left">
                    Remove image
                  </button>
                )}
                <span className="text-[10px] text-gray-400">JPEG/PNG/GIF/WebP, max 2MB</span>
              </div>
            </div>
          </div>

          {/* Product name */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Product name</label>
            <input
              type="text"
              value={finishedModal.name}
              onChange={(e) => setFinishedModal((m) => (m ? { ...m, name: e.target.value } : m))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-400"
              placeholder="Product name"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Quantity produced (incoming stock) */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Qty produced (incoming stock)</label>
              <input
                type="number" min="0" step="any"
                value={finishedModal.quantity}
                onChange={(e) => setFinishedModal((m) => (m ? { ...m, quantity: e.target.value } : m))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-400"
                placeholder="0"
              />
            </div>
            {/* Unit of measure */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Unit</label>
              <select
                value={finishedModal.unit}
                onChange={(e) => setFinishedModal((m) => (m ? { ...m, unit: e.target.value } : m))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-400 bg-white"
              >
                {FP_UNITS.map((u) => <option key={u}>{u}</option>)}
              </select>
            </div>
          </div>

          {/* Cost per unit */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Cost / value per unit (Frw)</label>
            <input
              type="number" min="0" step="any"
              value={finishedModal.costPerUnit}
              onChange={(e) => setFinishedModal((m) => (m ? { ...m, costPerUnit: e.target.value } : m))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-400"
              placeholder="0"
            />
            {Number(finishedModal.quantity) > 0 && Number(finishedModal.costPerUnit) > 0 && (
              <p className="text-[11px] text-gray-500 mt-1">
                Total production cost: <strong>Frw {fmt(Number(finishedModal.quantity) * Number(finishedModal.costPerUnit))}</strong>
              </p>
            )}
          </div>
        </div>

        <div className="px-5 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setFinishedModal(null)} disabled={finishedModalSaving}>Cancel</Button>
          <Button className="bg-teal-600 hover:bg-teal-700 text-white" onClick={confirmFinishedSave} disabled={finishedModalSaving}>
            {finishedModalSaving ? (<><Loader2 className="w-4 h-4 animate-spin mr-2" /> Saving…</>) : "Save to Finished Products"}
          </Button>
        </div>
      </div>
    </div>
  );

  if (inline) return (<>{inner}{finishedModalEl}</>);

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/60 flex items-start justify-center overflow-y-auto py-6 px-2">
        {inner}
      </div>
      {finishedModalEl}
    </>
  );
}
