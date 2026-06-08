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

    return await prisma.order.findMany({
      where: { productId: { in: productIds } },
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    console.error("getOrdersForMyIndustryProducts:", error);
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
