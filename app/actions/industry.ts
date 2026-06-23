"use server";

import { MongoClient, ObjectId } from "mongodb";
import dns from "dns";
import { getUserSession } from "./auth";
import { revalidatePath } from "next/cache";

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
      currentStock: d.currentStock as number,
      createdAt: (d.createdAt as Date).toISOString(),
    }));
  } catch {
    return [];
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
      createdAt: (d.createdAt as Date).toISOString(),
    }));
  } catch {
    return [];
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
