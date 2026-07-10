"use server";

import { MongoClient, ObjectId } from "mongodb";
import dns from "dns";
import { getUserSession } from "./auth";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

const DB_NAME = "VERTEX_DB";

// mongodb+srv:// URIs require a DNS SRV lookup. Some networks/ISPs resolve SRV
// records very slowly or not at all, causing "querySrv ETIMEOUT". Point DNS at
// reliable public resolvers so Atlas connections stay fast and stable.
try {
  dns.setServers(["8.8.8.8", "1.1.1.1", ...dns.getServers()]);
} catch {
  /* ignore — fall back to system DNS */
}

function getMongoClient() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) throw new Error("DATABASE_URL not set");
  return new MongoClient(dbUrl, {
    // Fail fast instead of hanging ~60s when the cluster can't be reached.
    serverSelectionTimeoutMS: 15000,
    connectTimeoutMS: 15000,
  });
}

export interface ExtraFeed {
  id: string;
  name: string;
  price: number;
}

export interface CalculationData {
  rawMaterialName: string;
  feedQuantity: number;
  pricePerUnit: number;
  autoFeedPrice: number;
  extraFeeds: ExtraFeed[];
  totalTaxes: number;
  commission: number;
  labourCost: number;
  totalTransport: number;
  otherExpenses: number;
  totalQty: number;
  qtyProducedBoxes: number;
  qtyProduced: number;
  possibleDiscount: number;
  calculatedPricePerUnit: number;
  calculatedPricePerBox: number;
  totalFeedsPrice: number;
}

export interface StockItemData {
  name: string;
  currentValue: number;
  newValue: number;
  isAuto: boolean;
}

export interface FinishedProductCalculationData {
  productName?: string;
  purchasePrice: number;
  transport: number;
  taxes: number;
  packaging: number;
  labor: number;
  otherExpenses: number;
  customExpenses: { id: string; label: string; amount: number }[];
  desiredProfitPct: number;
  totalCost: number;
  recommendedSellingPrice: number;
  actualSellingPrice?: number;
}

export async function saveFinishedProductCalculation(data: FinishedProductCalculationData) {
  const session = await getUserSession();
  if (!session) return { success: false, message: "Unauthorized" };

  const client = getMongoClient();
  try {
    await client.connect();
    const db = client.db(DB_NAME);
    await db.collection("FinishedProductCalculation").insertOne({
      _id: new ObjectId(),
      userId: session.id,
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return { success: true };
  } catch (error) {
    console.error("saveFinishedProductCalculation:", error);
    return { success: false, message: "Failed to save" };
  } finally {
    await client.close();
  }
}

export async function getFinishedProductCalculations() {
  const session = await getUserSession();
  if (!session) return [];

  const client = getMongoClient();
  try {
    await client.connect();
    const db = client.db(DB_NAME);
    const docs = await db
      .collection("FinishedProductCalculation")
      .find({ userId: session.id })
      .sort({ createdAt: -1 })
      .toArray();
    return docs.map((d) => ({
      id: d._id.toString(),
      productName: d.productName as string | undefined,
      purchasePrice: d.purchasePrice as number,
      transport: d.transport as number,
      taxes: d.taxes as number,
      packaging: d.packaging as number,
      labor: d.labor as number,
      otherExpenses: d.otherExpenses as number,
      customExpenses: (d.customExpenses ?? []) as { id: string; label: string; amount: number }[],
      totalCost: d.totalCost as number,
      recommendedSellingPrice: d.recommendedSellingPrice as number,
      actualSellingPrice: d.actualSellingPrice as number | undefined,
      desiredProfitPct: d.desiredProfitPct as number,
      createdAt: (d.createdAt as Date).toISOString(),
    }));
  } catch {
    return [];
  } finally {
    await client.close();
  }
}

export interface FinishedProductDraftData {
  productName: string;
  purchasePrice: number;
  transport: number;
  taxes: number;
  packaging: number;
  labor: number;
  otherExpenses: number;
  customExpenses: { id: string; label: string; amount: number }[];
  desiredProfitPct: number;
  actualSellingPrice: number;
}

export async function saveFinishedProductDraft(data: FinishedProductDraftData) {
  const session = await getUserSession();
  if (!session) return { success: false };

  const client = getMongoClient();
  try {
    await client.connect();
    const db = client.db(DB_NAME);
    await db.collection("FinishedProductDraft").updateOne(
      { userId: session.id },
      { $set: { userId: session.id, ...data, updatedAt: new Date() }, $setOnInsert: { createdAt: new Date() } },
      { upsert: true }
    );
    return { success: true };
  } catch {
    return { success: false };
  } finally {
    await client.close();
  }
}

export async function getFinishedProductDraft(): Promise<FinishedProductDraftData | null> {
  const session = await getUserSession();
  if (!session) return null;

  const client = getMongoClient();
  try {
    await client.connect();
    const db = client.db(DB_NAME);
    const doc = await db.collection("FinishedProductDraft").findOne({ userId: session.id });
    if (!doc) return null;
    return {
      productName: (doc.productName as string) ?? "",
      purchasePrice: (doc.purchasePrice as number) ?? 0,
      transport: (doc.transport as number) ?? 0,
      taxes: (doc.taxes as number) ?? 0,
      packaging: (doc.packaging as number) ?? 0,
      labor: (doc.labor as number) ?? 0,
      otherExpenses: (doc.otherExpenses as number) ?? 0,
      customExpenses: (doc.customExpenses as { id: string; label: string; amount: number }[]) ?? [],
      desiredProfitPct: (doc.desiredProfitPct as number) ?? 20,
      actualSellingPrice: (doc.actualSellingPrice as number) ?? 0,
    };
  } catch {
    return null;
  } finally {
    await client.close();
  }
}

export async function clearFinishedProductDraft() {
  const session = await getUserSession();
  if (!session) return;

  const client = getMongoClient();
  try {
    await client.connect();
    await client.db(DB_NAME).collection("FinishedProductDraft").deleteOne({ userId: session.id });
  } catch {
    // silent
  } finally {
    await client.close();
  }
}

export async function deleteFinishedProductCalculation(id: string) {
  const session = await getUserSession();
  if (!session) return { success: false, message: "Unauthorized" };

  const client = getMongoClient();
  try {
    await client.connect();
    const db = client.db(DB_NAME);
    await db.collection("FinishedProductCalculation").deleteOne({
      _id: new ObjectId(id),
      userId: session.id,
    });
    return { success: true };
  } catch (error) {
    console.error("deleteFinishedProductCalculation:", error);
    return { success: false, message: "Failed to delete" };
  } finally {
    await client.close();
  }
}

export async function updateFinishedProductCalculation(id: string, data: FinishedProductCalculationData) {
  const session = await getUserSession();
  if (!session) return { success: false, message: "Unauthorized" };

  const client = getMongoClient();
  try {
    await client.connect();
    const db = client.db(DB_NAME);
    await db.collection("FinishedProductCalculation").updateOne(
      { _id: new ObjectId(id), userId: session.id },
      { $set: { ...data, updatedAt: new Date() } }
    );
    return { success: true };
  } catch (error) {
    console.error("updateFinishedProductCalculation:", error);
    return { success: false, message: "Failed to update" };
  } finally {
    await client.close();
  }
}

/** Save a new calculation record each time Confirm is clicked. */
export async function saveIndustryCalculation(data: CalculationData) {
  const session = await getUserSession();
  if (!session) return { success: false, message: "Unauthorized" };

  const client = getMongoClient();
  try {
    await client.connect();
    const db = client.db(DB_NAME);
    await db.collection("IndustryCalculation").insertOne({
      _id: new ObjectId(),
      userId: session.id,
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return { success: true };
  } catch (error) {
    console.error("saveIndustryCalculation:", error);
    return { success: false, message: "Failed to save calculation" };
  } finally {
    await client.close();
  }
}

/** Upsert the stock list (one snapshot per user). */
export async function saveIndustryStock(items: StockItemData[]) {
  const session = await getUserSession();
  if (!session) return { success: false, message: "Unauthorized" };

  const client = getMongoClient();
  try {
    await client.connect();
    const db = client.db(DB_NAME);
    await db.collection("IndustryStock").updateOne(
      { userId: session.id },
      { $set: { userId: session.id, items, updatedAt: new Date() }, $setOnInsert: { createdAt: new Date() } },
      { upsert: true }
    );
    revalidatePath("/industry/dashboard");
    return { success: true };
  } catch (error) {
    console.error("saveIndustryStock:", error);
    return { success: false, message: "Failed to save stock" };
  } finally {
    await client.close();
  }
}

/** Load the stock list for the logged-in user. */
export async function getMyIndustryStock(): Promise<StockItemData[]> {
  const session = await getUserSession();
  if (!session) return [];

  const client = getMongoClient();
  try {
    await client.connect();
    const db = client.db(DB_NAME);
    const doc = await db.collection("IndustryStock").findOne({ userId: session.id });
    return (doc?.items as StockItemData[]) ?? [];
  } catch {
    return [];
  } finally {
    await client.close();
  }
}

export interface AnalyticsRow {
  productId: string;
  productName: string;
  sellingPrice: number;
  productCost: number;
  afterSoldPrice: number;
  totalQuantity: number;
  quantityManual: number;
  soldAt: string;
}

export async function saveProductAnalytics(
  month: string,
  rows: AnalyticsRow[],
  excludedProductIds: string[] = []
) {
  const session = await getUserSession();
  if (!session) return { success: false, message: "Unauthorized" };

  const client = getMongoClient();
  try {
    await client.connect();
    const db = client.db(DB_NAME);
    await db.collection("IndustryProductAnalytics").updateOne(
      { userId: session.id, month },
      { $set: { rows, excludedProductIds, updatedAt: new Date() }, $setOnInsert: { _id: new ObjectId(), createdAt: new Date() } },
      { upsert: true }
    );
    return { success: true };
  } catch (error) {
    console.error("saveProductAnalytics:", error);
    return { success: false, message: "Failed to save" };
  } finally {
    await client.close();
  }
}

export async function getProductAnalytics(month: string): Promise<{ rows: AnalyticsRow[]; excludedProductIds: string[] }> {
  const session = await getUserSession();
  if (!session) return { rows: [], excludedProductIds: [] };

  const client = getMongoClient();
  try {
    await client.connect();
    const db = client.db(DB_NAME);
    const doc = await db.collection("IndustryProductAnalytics").findOne({ userId: session.id, month });
    return {
      rows: (doc?.rows as AnalyticsRow[]) ?? [],
      excludedProductIds: (doc?.excludedProductIds as string[]) ?? [],
    };
  } catch {
    return { rows: [], excludedProductIds: [] };
  } finally {
    await client.close();
  }
}

// ─── Stock Movements (IN / OUT) ────────────────────────────────────────────

export interface StockMovement {
  id: string;
  type: "raw" | "finished";
  recordId: string;
  recordName: string;
  unit: string;
  movement: "in" | "out";
  quantity: number;
  notes?: string;
  date: string;
  createdAt: string;
}

export async function saveStockMovement(
  data: Omit<StockMovement, "id" | "createdAt">
) {
  const session = await getUserSession();
  if (!session) return { success: false, message: "Unauthorized" };

  const client = getMongoClient();
  try {
    await client.connect();
    await client.db(DB_NAME).collection("StockMovement").insertOne({
      _id: new ObjectId(),
      userId: session.id,
      ...data,
      date: new Date(data.date),
      createdAt: new Date(),
    });
    return { success: true };
  } catch (error) {
    console.error("saveStockMovement:", error);
    return { success: false, message: "Failed to save" };
  } finally {
    await client.close();
  }
}

export async function getStockMovements(recordId?: string): Promise<StockMovement[]> {
  const session = await getUserSession();
  if (!session) return [];

  const client = getMongoClient();
  try {
    await client.connect();
    const filter: Record<string, unknown> = { userId: session.id };
    if (recordId) filter.recordId = recordId;
    const docs = await client
      .db(DB_NAME)
      .collection("StockMovement")
      .find(filter)
      .sort({ date: -1 })
      .toArray();
    return docs.map((d) => ({
      id: d._id.toString(),
      type: d.type as "raw" | "finished",
      recordId: d.recordId as string,
      recordName: d.recordName as string,
      unit: d.unit as string,
      movement: d.movement as "in" | "out",
      quantity: d.quantity as number,
      notes: d.notes as string | undefined,
      date: (d.date as Date).toISOString(),
      createdAt: (d.createdAt as Date).toISOString(),
    }));
  } catch {
    return [];
  } finally {
    await client.close();
  }
}

export async function deleteStockMovement(id: string) {
  const session = await getUserSession();
  if (!session) return { success: false, message: "Unauthorized" };

  const client = getMongoClient();
  try {
    await client.connect();
    await client.db(DB_NAME).collection("StockMovement").deleteOne({
      _id: new ObjectId(id),
      userId: session.id,
    });
    return { success: true };
  } catch (error) {
    console.error("deleteStockMovement:", error);
    return { success: false, message: "Failed to delete" };
  } finally {
    await client.close();
  }
}

// ─── Raw Material Stock Records ────────────────────────────────────────────

export interface CustomExpense {
  id: string;
  label: string;
  amount: number;
}

export interface RawMaterialRecord {
  id: string;
  materialName: string;
  quantityPurchased: number;
  unit: string;
  purchasePrice: number;
  tax: number;
  transportCost: number;
  otherExpenses: number;
  customExpenses: CustomExpense[];
  totalCost: number;
  costPerUnit: number;
  desiredProfit?: number;     // profit to add on top of cost → selling price
  sellingPrice?: number;      // totalCost + desiredProfit (persisted on save)
  currentStock: number;
  createdAt: string;
}

export async function saveRawMaterialRecord(
  data: Omit<RawMaterialRecord, "id" | "createdAt">
) {
  const session = await getUserSession();
  if (!session) return { success: false, message: "Unauthorized" };

  const client = getMongoClient();
  try {
    await client.connect();
    await client.db(DB_NAME).collection("RawMaterialStock").insertOne({
      _id: new ObjectId(),
      userId: session.id,
      ...data,
      createdAt: new Date(),
    });
    return { success: true };
  } catch (error) {
    console.error("saveRawMaterialRecord:", error);
    return { success: false, message: "Failed to save" };
  } finally {
    await client.close();
  }
}

export async function getRawMaterialRecords(): Promise<RawMaterialRecord[]> {
  const session = await getUserSession();
  if (!session) return [];

  const client = getMongoClient();
  try {
    await client.connect();
    const docs = await client
      .db(DB_NAME)
      .collection("RawMaterialStock")
      .find({ userId: session.id })
      .sort({ createdAt: -1 })
      .toArray();
    return docs.map((d) => ({
      id: d._id.toString(),
      materialName: d.materialName as string,
      quantityPurchased: d.quantityPurchased as number,
      unit: d.unit as string,
      purchasePrice: d.purchasePrice as number,
      tax: d.tax as number,
      transportCost: d.transportCost as number,
      otherExpenses: d.otherExpenses as number,
      customExpenses: (d.customExpenses ?? []) as CustomExpense[],
      totalCost: d.totalCost as number,
      costPerUnit: d.costPerUnit as number,
      desiredProfit: d.desiredProfit as number | undefined,
      sellingPrice: d.sellingPrice as number | undefined,
      currentStock: d.currentStock as number,
      createdAt: (d.createdAt as Date).toISOString(),
    }));
  } catch {
    return [];
  } finally {
    await client.close();
  }
}

// Deduct the quantities used (in the price calculator) from each raw material
// record's available stock, clamped at zero. This persists so the remaining
// amount carries over to the next visit (50 → 44 → … → 0).
export async function consumeRawMaterialStock(
  consumptions: { id: string; quantity: number }[]
): Promise<{ success: boolean; message?: string }> {
  const session = await getUserSession();
  if (!session) return { success: false, message: "Unauthorized" };

  const client = getMongoClient();
  try {
    await client.connect();
    const col = client.db(DB_NAME).collection("RawMaterialStock");
    for (const c of consumptions) {
      if (!c.quantity || c.quantity <= 0) continue;
      const rec = await col.findOne({ _id: new ObjectId(c.id), userId: session.id });
      if (!rec) continue;
      const current = Number(rec.quantityPurchased) || 0;
      const next = Math.max(0, current - c.quantity);
      await col.updateOne(
        { _id: new ObjectId(c.id), userId: session.id },
        { $set: { quantityPurchased: next, currentStock: next } }
      );
    }
    return { success: true };
  } catch (error) {
    console.error("consumeRawMaterialStock:", error);
    return { success: false, message: "Failed to update raw material stock" };
  } finally {
    await client.close();
  }
}

// Increase a raw material's available quantity when it runs low/out — the
// inverse of consumeRawMaterialStock. Keeps the cost-per-unit unchanged so the
// price calculator prices the restocked units at the same rate.
export async function restockRawMaterial(
  id: string,
  addQty: number
): Promise<{ success: boolean; message?: string; quantityPurchased?: number }> {
  const session = await getUserSession();
  if (!session) return { success: false, message: "Unauthorized" };
  if (!addQty || addQty <= 0) return { success: false, message: "Enter a quantity to add" };

  const client = getMongoClient();
  try {
    await client.connect();
    const col = client.db(DB_NAME).collection("RawMaterialStock");
    const rec = await col.findOne({ _id: new ObjectId(id), userId: session.id });
    if (!rec) return { success: false, message: "Record not found" };
    const newQty = (Number(rec.quantityPurchased) || 0) + addQty;
    const newStock = (Number(rec.currentStock) || 0) + addQty;
    await col.updateOne(
      { _id: new ObjectId(id), userId: session.id },
      { $set: { quantityPurchased: newQty, currentStock: newStock } }
    );
    return { success: true, quantityPurchased: newQty };
  } catch (error) {
    console.error("restockRawMaterial:", error);
    return { success: false, message: "Failed to restock" };
  } finally {
    await client.close();
  }
}

export async function updateRawMaterialCostPerUnit(id: string, costPerUnit: number) {
  const session = await getUserSession();
  if (!session) return { success: false, message: "Unauthorized" };

  const client = getMongoClient();
  try {
    await client.connect();
    await client.db(DB_NAME).collection("RawMaterialStock").updateOne(
      { _id: new ObjectId(id), userId: session.id },
      { $set: { costPerUnit } }
    );
    return { success: true };
  } catch (error) {
    console.error("updateRawMaterialCostPerUnit:", error);
    return { success: false, message: "Failed to update" };
  } finally {
    await client.close();
  }
}

// Save the desired profit on a raw material and roll it into the selling price
// (sellingPrice = totalCost + desiredProfit). Returns the new selling price.
export async function updateRawMaterialDesiredProfit(id: string, desiredProfit: number) {
  const session = await getUserSession();
  if (!session) return { success: false, message: "Unauthorized" };

  const client = getMongoClient();
  try {
    await client.connect();
    const col = client.db(DB_NAME).collection("RawMaterialStock");
    const record = await col.findOne({ _id: new ObjectId(id), userId: session.id });
    if (!record) return { success: false, message: "Record not found" };

    const sellingPrice = (record.totalCost as number) + desiredProfit;
    await col.updateOne(
      { _id: new ObjectId(id), userId: session.id },
      { $set: { desiredProfit, sellingPrice } }
    );
    return { success: true, sellingPrice };
  } catch (error) {
    console.error("updateRawMaterialDesiredProfit:", error);
    return { success: false, message: "Failed to update" };
  } finally {
    await client.close();
  }
}

export async function updateRawMaterialRecord(
  id: string,
  data: Omit<RawMaterialRecord, "id" | "createdAt">
) {
  const session = await getUserSession();
  if (!session) return { success: false, message: "Unauthorized" };

  const client = getMongoClient();
  try {
    await client.connect();
    await client.db(DB_NAME).collection("RawMaterialStock").updateOne(
      { _id: new ObjectId(id), userId: session.id },
      { $set: { ...data } }
    );
    return { success: true };
  } catch (error) {
    console.error("updateRawMaterialRecord:", error);
    return { success: false, message: "Failed to update" };
  } finally {
    await client.close();
  }
}

export async function updateFinishedProductStockRecord(
  id: string,
  data: Omit<FinishedProductStockRecord, "id" | "createdAt">
) {
  const session = await getUserSession();
  if (!session) return { success: false, message: "Unauthorized" };

  const client = getMongoClient();
  try {
    await client.connect();
    await client.db(DB_NAME).collection("FinishedProductStock").updateOne(
      { _id: new ObjectId(id), userId: session.id },
      { $set: { ...data } }
    );
    return { success: true };
  } catch (error) {
    console.error("updateFinishedProductStockRecord:", error);
    return { success: false, message: "Failed to update" };
  } finally {
    await client.close();
  }
}

export async function deleteRawMaterialRecord(id: string) {
  const session = await getUserSession();
  if (!session) return { success: false, message: "Unauthorized" };

  const client = getMongoClient();
  try {
    await client.connect();
    await client.db(DB_NAME).collection("RawMaterialStock").deleteOne({
      _id: new ObjectId(id),
      userId: session.id,
    });
    return { success: true };
  } catch (error) {
    console.error("deleteRawMaterialRecord:", error);
    return { success: false, message: "Failed to delete" };
  } finally {
    await client.close();
  }
}

// ─── Finished Product Stock Records ────────────────────────────────────────

export interface FinishedProductStockRecord {
  id: string;
  productName: string;
  quantityProduced: number;
  productionCost: number;
  laborCost: number;
  packagingCost: number;
  transportCost: number;
  otherExpenses: number;
  customExpenses: CustomExpense[];
  totalProductionCost: number;
  costPerUnit: number;
  // supermarket variant: products are purchased, so these track on-hand stock
  // and the chosen record date; optional so the industry variant is unaffected
  currentStock?: number;
  recordDate?: string;
  // inventory-management fields (optional so older records still load)
  imageUrl?: string;          // product photo (base64 data URL)
  unitOfMeasure?: string;     // Piece, Kg, Box, …
  lowStockThreshold?: number; // alert level for current stock
  reservedStock?: number;     // units held for existing orders
  leadTimeDays?: number;      // production/restock lead time, used for smart reorder point
  published?: boolean;        // manager has published the product (Available)
  publishedProductId?: string; // linked marketplace Product created on publish
  createdAt: string;
}

export async function saveFinishedProductStockRecord(
  data: Omit<FinishedProductStockRecord, "id" | "createdAt">
) {
  const session = await getUserSession();
  if (!session) return { success: false, message: "Unauthorized" };

  const client = getMongoClient();
  try {
    await client.connect();
    await client.db(DB_NAME).collection("FinishedProductStock").insertOne({
      _id: new ObjectId(),
      userId: session.id,
      ...data,
      createdAt: new Date(),
    });
    return { success: true };
  } catch (error) {
    console.error("saveFinishedProductStockRecord:", error);
    return { success: false, message: "Failed to save" };
  } finally {
    await client.close();
  }
}

// Save products from the price calculator's stock list into Item Management,
// keyed by product name (per user). Each save counts as one unit made: a brand
// new product starts at quantity 1, and every later save of the same product
// bumps its quantity (2, 3, …). Products that already existed are returned in
// `existed` so the UI can tell the manager they were already there.
export interface ItemManagementProductInput {
  productName: string;
  costPerUnit: number;
  imageUrl?: string;
  unitOfMeasure?: string;
}

export async function upsertItemManagementProducts(
  products: ItemManagementProductInput[]
): Promise<{ success: boolean; message?: string; existed?: string[] }> {
  const session = await getUserSession();
  if (!session) return { success: false, message: "Unauthorized" };

  const client = getMongoClient();
  try {
    await client.connect();
    const col = client.db(DB_NAME).collection("FinishedProductStock");
    const existed: string[] = [];
    for (const p of products) {
      const name = p.productName.trim();
      if (!name) continue;
      const costPerUnit = p.costPerUnit || 0;
      const existing = await col.findOne({ userId: session.id, productName: name });

      if (existing) {
        // Already in Item Management → one more unit made.
        const newQty = (Number(existing.quantityProduced) || 0) + 1;
        const set: Record<string, unknown> = {
          quantityProduced: newQty,
          costPerUnit,
          productionCost: costPerUnit * newQty,
          totalProductionCost: costPerUnit * newQty,
        };
        // keep current on-hand stock in step with the produced count
        if (existing.currentStock != null) set.currentStock = (Number(existing.currentStock) || 0) + 1;
        if (p.imageUrl !== undefined) set.imageUrl = p.imageUrl || null;
        if (p.unitOfMeasure) set.unitOfMeasure = p.unitOfMeasure;
        await col.updateOne({ _id: existing._id }, { $set: set });
        existed.push(name);
      } else {
        // First unit of a new product.
        await col.insertOne({
          _id: new ObjectId(),
          userId: session.id,
          productName: name,
          quantityProduced: 1,
          productionCost: costPerUnit,
          laborCost: 0,
          packagingCost: 0,
          transportCost: 0,
          otherExpenses: 0,
          customExpenses: [],
          totalProductionCost: costPerUnit,
          costPerUnit,
          imageUrl: p.imageUrl || null,
          unitOfMeasure: p.unitOfMeasure || "Piece",
          published: false,
          createdAt: new Date(),
        });
      }
    }
    revalidatePath("/industry/stock-management");
    return { success: true, existed };
  } catch (error) {
    console.error("upsertItemManagementProducts:", error);
    return { success: false, message: "Failed to save products" };
  } finally {
    await client.close();
  }
}

export async function getFinishedProductStockRecords(): Promise<FinishedProductStockRecord[]> {
  const session = await getUserSession();
  if (!session) return [];

  const client = getMongoClient();
  try {
    await client.connect();
    const docs = await client
      .db(DB_NAME)
      .collection("FinishedProductStock")
      .find({ userId: session.id })
      .sort({ createdAt: -1 })
      .toArray();
    return docs.map((d) => ({
      id: d._id.toString(),
      productName: d.productName as string,
      quantityProduced: d.quantityProduced as number,
      productionCost: d.productionCost as number,
      laborCost: d.laborCost as number,
      packagingCost: d.packagingCost as number,
      transportCost: d.transportCost as number,
      otherExpenses: d.otherExpenses as number,
      customExpenses: (d.customExpenses ?? []) as CustomExpense[],
      totalProductionCost: d.totalProductionCost as number,
      costPerUnit: d.costPerUnit as number,
      currentStock: d.currentStock as number | undefined,
      recordDate: d.recordDate as string | undefined,
      imageUrl: d.imageUrl as string | undefined,
      unitOfMeasure: d.unitOfMeasure as string | undefined,
      lowStockThreshold: d.lowStockThreshold as number | undefined,
      reservedStock: d.reservedStock as number | undefined,
      leadTimeDays: d.leadTimeDays as number | undefined,
      published: d.published as boolean | undefined,
      publishedProductId: d.publishedProductId ? String(d.publishedProductId) : undefined,
      createdAt: (d.createdAt as Date).toISOString(),
    }));
  } catch {
    return [];
  } finally {
    await client.close();
  }
}

// Lightweight patch for single-field inline edits (image, threshold, reserved,
// publish toggle) — avoids resending the whole record from the table.
export async function patchFinishedProductStockRecord(
  id: string,
  data: Partial<
    Pick<
      FinishedProductStockRecord,
      "productName" | "quantityProduced" | "costPerUnit" | "currentStock" | "imageUrl" | "unitOfMeasure" | "lowStockThreshold" | "reservedStock" | "leadTimeDays" | "published"
    >
  >
) {
  const session = await getUserSession();
  if (!session) return { success: false, message: "Unauthorized" };

  const client = getMongoClient();
  try {
    await client.connect();
    await client.db(DB_NAME).collection("FinishedProductStock").updateOne(
      { _id: new ObjectId(id), userId: session.id },
      { $set: { ...data } }
    );
    return { success: true };
  } catch (error) {
    console.error("patchFinishedProductStockRecord:", error);
    return { success: false, message: "Failed to update" };
  } finally {
    await client.close();
  }
}

// Publish / unpublish a finished-product stock record to the public marketplace.
// The variant decides where the product is listed:
//   - industry    → category Industry / subcategory finished-products
//   - supermarket → category OtherProducts / subcategory supermarket
// Publishing creates (or re-shows) a real Product; unpublishing hides the linked
// Product but keeps it for re-publishing later.
export async function publishFinishedProductToMarketplace(
  recordId: string,
  publish: boolean,
  variant: "industry" | "supermarket" = "industry"
): Promise<{ success: boolean; published?: boolean; message?: string }> {
  const session = await getUserSession();
  if (!session) return { success: false, message: "Unauthorized" };

  const category = variant === "supermarket" ? "OtherProducts" : "Industry";
  const subcategory = variant === "supermarket" ? "supermarket" : "finished-products";

  const client = getMongoClient();
  try {
    await client.connect();
    const col = client.db(DB_NAME).collection("FinishedProductStock");
    const record = await col.findOne({ _id: new ObjectId(recordId), userId: session.id });
    if (!record) return { success: false, message: "Record not found" };

    const linkedId: string | undefined = record.publishedProductId
      ? String(record.publishedProductId)
      : undefined;

    // Does the linked product still exist?
    const existing = linkedId
      ? await prisma.product.findUnique({ where: { id: linkedId }, select: { id: true } })
      : null;

    let productId = existing?.id;

    if (publish) {
      const image = (record.imageUrl as string | undefined) || undefined;
      if (existing) {
        // Re-show and refresh the key fields from the current record. Category /
        // subcategory are refreshed too so any previously mis-listed product is
        // corrected to the right marketplace section on re-publish.
        await prisma.product.update({
          where: { id: existing.id },
          data: {
            title: record.productName as string,
            price: (record.costPerUnit as number) ?? null,
            category: category as any,
            subcategory,
            available: true,
            hidden: false,
          },
        });
      } else {
        // Create a fresh marketplace listing linked back to this record
        const created = await prisma.product.create({
          data: {
            title: record.productName as string,
            description: `${record.productName as string} — finished product`,
            price: (record.costPerUnit as number) ?? null,
            category: category as any,
            subcategory,
            available: true,
            hidden: false,
            user: { connect: { id: session.id } },
            media: {
              create: {
                images: image ? [image] : [],
                videos: [],
                mainImage: image ?? null,
                mainVideo: null,
              },
            },
          },
          select: { id: true },
        });
        productId = created.id;
      }
    } else if (existing) {
      // Unpublish → hide from public listings but keep the record link
      await prisma.product.update({
        where: { id: existing.id },
        data: { available: false, hidden: true },
      });
    }

    // Persist the publish state + link on the stock record
    await col.updateOne(
      { _id: new ObjectId(recordId), userId: session.id },
      { $set: { published: publish, ...(productId ? { publishedProductId: productId } : {}) } }
    );

    // Refresh the public surfaces so the change shows immediately
    revalidatePath("/");
    revalidatePath("/view-products");
    revalidatePath("/industry/finished-products");
    revalidatePath("/other-products/supermarket");

    return { success: true, published: publish };
  } catch (error) {
    console.error("publishFinishedProductToMarketplace:", error);
    return { success: false, message: "Failed to update publish state" };
  } finally {
    await client.close();
  }
}

export async function deleteFinishedProductStockRecord(id: string) {
  const session = await getUserSession();
  if (!session) return { success: false, message: "Unauthorized" };

  const client = getMongoClient();
  try {
    await client.connect();
    await client.db(DB_NAME).collection("FinishedProductStock").deleteOne({
      _id: new ObjectId(id),
      userId: session.id,
    });
    return { success: true };
  } catch (error) {
    console.error("deleteFinishedProductStockRecord:", error);
    return { success: false, message: "Failed to delete" };
  } finally {
    await client.close();
  }
}

// ─── Registered Item Names ─────────────────────────────────────────────────
// A per-manager list of product/item names registered from Item Management.
// These names populate the product dropdown in the Industry Price Calculator.
// Names are unique per user (case-insensitive): saving an existing name only
// updates it (touches updatedAt) instead of creating a duplicate.

export interface ItemName {
  id: string;
  name: string;
  imageUrl?: string; // product photo (base64 data URL)
  createdAt: string;
}

export async function saveItemName(
  rawName: string,
  imageUrl?: string
): Promise<{ success: boolean; created?: boolean; message?: string }> {
  const session = await getUserSession();
  if (!session) return { success: false, message: "Unauthorized" };

  const name = rawName.trim();
  if (!name) return { success: false, message: "Name is required" };

  const client = getMongoClient();
  try {
    await client.connect();
    const col = client.db(DB_NAME).collection("ItemName");
    // Match case-insensitively so "Mango" and "mango" don't both get stored.
    const existing = await col.findOne({
      userId: session.id,
      nameLower: name.toLowerCase(),
    });

    if (existing) {
      // Already exists → update only (keep the newly typed casing, touch stamp).
      // The image is only overwritten when a new one was supplied, so re-saving a
      // name without picking an image keeps the existing photo.
      const set: Record<string, unknown> = {
        name,
        nameLower: name.toLowerCase(),
        updatedAt: new Date(),
      };
      if (imageUrl !== undefined) set.imageUrl = imageUrl || null;
      await col.updateOne({ _id: existing._id }, { $set: set });
      revalidatePath("/industry/stock-management");
      return { success: true, created: false };
    }

    await col.insertOne({
      _id: new ObjectId(),
      userId: session.id,
      name,
      nameLower: name.toLowerCase(),
      imageUrl: imageUrl || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    revalidatePath("/industry/stock-management");
    return { success: true, created: true };
  } catch (error) {
    console.error("saveItemName:", error);
    return { success: false, message: "Failed to save name" };
  } finally {
    await client.close();
  }
}

export async function getItemNames(): Promise<ItemName[]> {
  const session = await getUserSession();
  if (!session) return [];

  const client = getMongoClient();
  try {
    await client.connect();
    const docs = await client
      .db(DB_NAME)
      .collection("ItemName")
      .find({ userId: session.id })
      .sort({ name: 1 })
      .toArray();
    return docs.map((d) => ({
      id: d._id.toString(),
      name: d.name as string,
      imageUrl: (d.imageUrl as string | undefined) ?? undefined,
      createdAt: (d.createdAt as Date).toISOString(),
    }));
  } catch {
    return [];
  } finally {
    await client.close();
  }
}

export async function deleteItemName(id: string) {
  const session = await getUserSession();
  if (!session) return { success: false, message: "Unauthorized" };

  const client = getMongoClient();
  try {
    await client.connect();
    await client.db(DB_NAME).collection("ItemName").deleteOne({
      _id: new ObjectId(id),
      userId: session.id,
    });
    revalidatePath("/industry/stock-management");
    return { success: true };
  } catch (error) {
    console.error("deleteItemName:", error);
    return { success: false, message: "Failed to delete" };
  } finally {
    await client.close();
  }
}

// ─── Stock of Raw Materials (simple list) ──────────────────────────────────
// A lightweight stock list: name, quantity purchased and amount.
// Independent from RawMaterialStock (cost-per-unit) records.

export interface RawMaterialStockItem {
  id: string;
  materialName: string;
  quantityPurchased: number;
  // remaining quantity after usage in the raw materials calculator; for older
  // records that predate this field it falls back to the purchased quantity
  quantityRemaining: number;
  amount: number;
  createdAt: string;
}

export async function saveRawMaterialStockItem(
  data: Omit<RawMaterialStockItem, "id" | "createdAt">
) {
  const session = await getUserSession();
  if (!session) return { success: false, message: "Unauthorized" };

  const client = getMongoClient();
  try {
    await client.connect();
    await client.db(DB_NAME).collection("RawMaterialStockList").insertOne({
      _id: new ObjectId(),
      userId: session.id,
      ...data,
      createdAt: new Date(),
    });
    return { success: true };
  } catch (error) {
    console.error("saveRawMaterialStockItem:", error);
    return { success: false, message: "Failed to save" };
  } finally {
    await client.close();
  }
}

export async function getRawMaterialStockItems(): Promise<RawMaterialStockItem[]> {
  const session = await getUserSession();
  if (!session) return [];

  const client = getMongoClient();
  try {
    await client.connect();
    const docs = await client
      .db(DB_NAME)
      .collection("RawMaterialStockList")
      .find({ userId: session.id })
      .sort({ createdAt: -1 })
      .toArray();
    return docs.map((d) => ({
      id: d._id.toString(),
      materialName: d.materialName as string,
      quantityPurchased: d.quantityPurchased as number,
      quantityRemaining: (d.quantityRemaining ?? d.quantityPurchased) as number,
      amount: d.amount as number,
      createdAt: (d.createdAt as Date).toISOString(),
    }));
  } catch {
    return [];
  } finally {
    await client.close();
  }
}

export async function updateRawMaterialStockItem(
  id: string,
  data: Omit<RawMaterialStockItem, "id" | "createdAt">
) {
  const session = await getUserSession();
  if (!session) return { success: false, message: "Unauthorized" };

  const client = getMongoClient();
  try {
    await client.connect();
    await client.db(DB_NAME).collection("RawMaterialStockList").updateOne(
      { _id: new ObjectId(id), userId: session.id },
      { $set: { ...data } }
    );
    return { success: true };
  } catch (error) {
    console.error("updateRawMaterialStockItem:", error);
    return { success: false, message: "Failed to update" };
  } finally {
    await client.close();
  }
}

export async function deleteRawMaterialStockItem(id: string) {
  const session = await getUserSession();
  if (!session) return { success: false, message: "Unauthorized" };

  const client = getMongoClient();
  try {
    await client.connect();
    await client.db(DB_NAME).collection("RawMaterialStockList").deleteOne({
      _id: new ObjectId(id),
      userId: session.id,
    });
    return { success: true };
  } catch (error) {
    console.error("deleteRawMaterialStockItem:", error);
    return { success: false, message: "Failed to delete" };
  } finally {
    await client.close();
  }
}

// ─── Service Transactions (records of payments made without a receipt) ──────
// The manager logs each service transaction: who provided the service (giver
// company), who received it (name, email, phone, optional ID) and the amount
// paid. Scoped per logged-in manager.

export interface ServiceTransaction {
  id: string;
  giverCompany: string;        // name of the giver of services (company)
  receiverName: string;        // receiver of the services
  receiverEmail: string;
  receiverPhone: string;
  receiverId?: string;         // optional national ID / passport
  serviceDescription?: string; // optional note about the service rendered
  amountPaid: number;
  date: string;                // date of the transaction (ISO)
  createdAt: string;
}

export async function saveServiceTransaction(
  data: Omit<ServiceTransaction, "id" | "createdAt">
) {
  const session = await getUserSession();
  if (!session) return { success: false, message: "Unauthorized" };

  const client = getMongoClient();
  try {
    await client.connect();
    await client.db(DB_NAME).collection("ServiceTransaction").insertOne({
      _id: new ObjectId(),
      userId: session.id,
      ...data,
      date: new Date(data.date),
      createdAt: new Date(),
    });
    return { success: true };
  } catch (error) {
    console.error("saveServiceTransaction:", error);
    return { success: false, message: "Failed to save" };
  } finally {
    await client.close();
  }
}

export async function getServiceTransactions(): Promise<ServiceTransaction[]> {
  const session = await getUserSession();
  if (!session) return [];

  const client = getMongoClient();
  try {
    await client.connect();
    const docs = await client
      .db(DB_NAME)
      .collection("ServiceTransaction")
      .find({ userId: session.id })
      .sort({ date: -1, createdAt: -1 })
      .toArray();
    return docs.map((d) => ({
      id: d._id.toString(),
      giverCompany: d.giverCompany as string,
      receiverName: d.receiverName as string,
      receiverEmail: d.receiverEmail as string,
      receiverPhone: d.receiverPhone as string,
      receiverId: d.receiverId as string | undefined,
      serviceDescription: d.serviceDescription as string | undefined,
      amountPaid: d.amountPaid as number,
      date: (d.date as Date).toISOString(),
      createdAt: (d.createdAt as Date).toISOString(),
    }));
  } catch {
    return [];
  } finally {
    await client.close();
  }
}

export async function updateServiceTransaction(
  id: string,
  data: Omit<ServiceTransaction, "id" | "createdAt">
) {
  const session = await getUserSession();
  if (!session) return { success: false, message: "Unauthorized" };

  const client = getMongoClient();
  try {
    await client.connect();
    await client.db(DB_NAME).collection("ServiceTransaction").updateOne(
      { _id: new ObjectId(id), userId: session.id },
      { $set: { ...data, date: new Date(data.date) } }
    );
    return { success: true };
  } catch (error) {
    console.error("updateServiceTransaction:", error);
    return { success: false, message: "Failed to update" };
  } finally {
    await client.close();
  }
}

export async function deleteServiceTransaction(id: string) {
  const session = await getUserSession();
  if (!session) return { success: false, message: "Unauthorized" };

  const client = getMongoClient();
  try {
    await client.connect();
    await client.db(DB_NAME).collection("ServiceTransaction").deleteOne({
      _id: new ObjectId(id),
      userId: session.id,
    });
    return { success: true };
  } catch (error) {
    console.error("deleteServiceTransaction:", error);
    return { success: false, message: "Failed to delete" };
  } finally {
    await client.close();
  }
}

/** Load the last N calculations for the logged-in user. */
export async function getMyIndustryCalculations(take = 10) {
  const session = await getUserSession();
  if (!session) return [];

  const client = getMongoClient();
  try {
    await client.connect();
    const db = client.db(DB_NAME);
    return await db
      .collection("IndustryCalculation")
      .find({ userId: session.id })
      .sort({ createdAt: -1 })
      .limit(take)
      .toArray();
  } catch {
    return [];
  } finally {
    await client.close();
  }
}
