"use server";

import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

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

/** Manager publishes a product with only name, price and amount. */
export async function publishMarketProduct(prevState: any, formData: FormData) {
  const user = await getSessionUser();
  if (!user) return { success: false, message: "Please log in to publish a product." };

  const name = (formData.get("name") as string)?.trim();
  const price = parseFloat(formData.get("price") as string);

  if (!name) return { success: false, message: "Product name is required." };
  if (isNaN(price) || price < 0) return { success: false, message: "Enter a valid price." };

  try {
    await prisma.marketProduct.create({
      data: { userId: user.id, name, price },
    });
    revalidatePath("/supermarket/stock-records");
    revalidatePath("/marketplace");
    return { success: true, message: "Product published to the marketplace." };
  } catch (error) {
    console.error("publishMarketProduct:", error);
    return { success: false, message: "Failed to publish product." };
  }
}

/** Products published by the currently logged-in manager. */
export async function getMyMarketProducts() {
  const user = await getSessionUser();
  if (!user) return [];
  try {
    return await prisma.marketProduct.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    console.error("getMyMarketProducts:", error);
    return [];
  }
}

/** Manager deletes one of their own published products. */
export async function deleteMarketProduct(id: string) {
  const user = await getSessionUser();
  if (!user) return { success: false, message: "Please log in." };
  try {
    const product = await prisma.marketProduct.findUnique({ where: { id } });
    if (!product || product.userId !== user.id) {
      return { success: false, message: "Product not found." };
    }
    await prisma.marketProduct.delete({ where: { id } });
    revalidatePath("/supermarket/stock-records");
    revalidatePath("/marketplace");
    return { success: true, message: "Product removed." };
  } catch (error) {
    console.error("deleteMarketProduct:", error);
    return { success: false, message: "Failed to remove product." };
  }
}

/** Public: every seller/company that has at least one published product. */
export async function getMarketSellers() {
  try {
    const products = await prisma.marketProduct.findMany({
      select: { userId: true, user: { select: { id: true, name: true } } },
    });

    const byId = new Map<string, { id: string; name: string; count: number }>();
    for (const p of products) {
      if (!p.user) continue;
      const existing = byId.get(p.user.id);
      if (existing) existing.count += 1;
      else byId.set(p.user.id, { id: p.user.id, name: p.user.name, count: 1 });
    }
    return Array.from(byId.values()).sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error("getMarketSellers:", error);
    return [];
  }
}

/** Public: a seller's name and all their published products. */
export async function getSellerMarketProducts(sellerId: string) {
  try {
    const seller = await prisma.user.findUnique({
      where: { id: sellerId },
      select: { id: true, name: true },
    });
    if (!seller) return null;

    const products = await prisma.marketProduct.findMany({
      where: { userId: sellerId },
      orderBy: { createdAt: "desc" },
    });
    return { seller, products };
  } catch (error) {
    console.error("getSellerMarketProducts:", error);
    return null;
  }
}

/** Public: a customer places an order on a published product. */
export async function placeMarketOrder(prevState: any, formData: FormData) {
  const productId = formData.get("productId") as string;
  const customerName = (formData.get("customerName") as string)?.trim();
  const customerPhone = (formData.get("customerPhone") as string)?.trim();
  const quantity = parseInt(formData.get("quantity") as string, 10) || 1;

  if (!productId) return { success: false, message: "Missing product." };
  if (!customerName) return { success: false, message: "Your name is required." };
  if (!customerPhone) return { success: false, message: "Your phone number is required." };

  try {
    const product = await prisma.marketProduct.findUnique({ where: { id: productId } });
    if (!product) return { success: false, message: "Product no longer available." };

    await prisma.marketOrder.create({
      data: {
        productId: product.id,
        sellerId: product.userId,
        productName: product.name,
        price: product.price,
        quantity: quantity < 1 ? 1 : quantity,
        customerName,
        customerPhone,
      },
    });
    return { success: true, message: "Order placed! The seller will contact you shortly." };
  } catch (error) {
    console.error("placeMarketOrder:", error);
    return { success: false, message: "Failed to place order." };
  }
}

/** Orders received by the currently logged-in manager on their products. */
export async function getMyMarketOrders() {
  const user = await getSessionUser();
  if (!user) return [];
  try {
    return await prisma.marketOrder.findMany({
      where: { sellerId: user.id },
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    console.error("getMyMarketOrders:", error);
    return [];
  }
}
