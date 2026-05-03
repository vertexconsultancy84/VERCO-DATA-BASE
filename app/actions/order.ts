"use server";

import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

export async function getUserPlacedOrders() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("user_session")?.value;
    
    if (!sessionToken) return [];

    const user = await prisma.user.findUnique({
      where: { id: sessionToken },
    });

    if (!user) return [];

    const orders = await prisma.order.findMany({
      where: { userEmail: user.email },
      orderBy: { createdAt: "desc" },
    });

    return orders;
  } catch (error) {
    console.error("Error fetching user orders:", error);
    return [];
  }
}
