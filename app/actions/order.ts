"use server";

import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

async function getSessionUser() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("user_session")?.value;
  if (!sessionToken) return null;
  try {
    return await prisma.user.findUnique({ where: { id: sessionToken } });
  } catch {
    return null;
  }
}

// Orders placed ON the logged-in user's published products (seller view)
export async function getOrdersForMyIndustryProducts() {
  try {
    const user = await getSessionUser();
    if (!user) return [];

    const myProducts = await prisma.product.findMany({
      where: { userId: user.id },
      select: { id: true },
    });

    if (myProducts.length === 0) return [];

    const productIds = myProducts.map((p) => p.id);

    const orders = await prisma.order.findMany({
      where: { productId: { in: productIds } },
      orderBy: { createdAt: "desc" },
    });

    // `saleChannel` was added to the schema after the Prisma client was last
    // generated, so findMany may not return it. Pull it via a raw read and
    // merge so the orders table can show "Manual" vs "Online" reliably.
    return await withSaleChannel(orders);
  } catch (error) {
    console.error("getOrdersForMyIndustryProducts:", error);
    return [];
  }
}

// Attach `saleChannel` (read raw from MongoDB) to a list of orders.
// Falls back to "online" for legacy orders that never had the field set.
async function withSaleChannel<T extends { id: string }>(orders: T[]): Promise<(T & { saleChannel: string })[]> {
  if (orders.length === 0) return orders as (T & { saleChannel: string })[];
  try {
    const result: any = await (prisma as any).$runCommandRaw({
      find: "Order",
      filter: { _id: { $in: orders.map((o) => ({ $oid: o.id })) } },
      projection: { saleChannel: 1 },
    });
    const docs: any[] = result?.cursor?.firstBatch ?? [];
    const channelById = new Map<string, string>(
      docs.map((d) => [String(d._id?.$oid ?? d._id), d.saleChannel ?? "online"])
    );
    return orders.map((o) => ({ ...o, saleChannel: channelById.get(o.id) ?? "online" }));
  } catch (error) {
    console.warn("withSaleChannel:", error);
    return orders.map((o) => ({ ...o, saleChannel: "online" }));
  }
}

// Minimal list of the logged-in manager's own products — used to populate
// the "Record Manual Sale" form on the orders page.
export async function getMyProductsForSale() {
  try {
    const user = await getSessionUser();
    if (!user) return [];

    const products = await prisma.product.findMany({
      where: { userId: user.id },
      select: { id: true, title: true, price: true, category: true, subcategory: true },
      orderBy: { title: "asc" },
    });

    return products.map((p) => ({
      id: p.id,
      title: p.title,
      price: p.price ?? 0,
      category: String(p.category),
      subcategory: p.subcategory ?? null,
    }));
  } catch (error) {
    console.error("getMyProductsForSale:", error);
    return [];
  }
}

// Orders placed BY the logged-in user (buyer view)
// Matches by userId (reliable after the API fix) AND userEmail (fallback for older orders)
export async function getUserPlacedOrders() {
  try {
    const user = await getSessionUser();
    if (!user) return [];

    return await prisma.order.findMany({
      where: {
        OR: [
          { userId: user.id },
          { userEmail: user.email },
        ],
      },
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    console.error("getUserPlacedOrders:", error);
    return [];
  }
}

// Alias used by the user dashboard seller section
export async function getOrdersOnMyProducts() {
  try {
    const user = await getSessionUser();
    if (!user) return [];

    const myProducts = await prisma.product.findMany({
      where: { userId: user.id },
      select: { id: true },
    });

    if (myProducts.length === 0) return [];

    const productIds = myProducts.map((p) => p.id);

    return await prisma.order.findMany({
      where: { productId: { in: productIds } },
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    console.error("getOrdersOnMyProducts:", error);
    return [];
  }
}
