import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        category: true,
        province: true,
        district: true,
        createdAt: true,
        products: {
          select: { id: true, title: true, createdAt: true },
          orderBy: { createdAt: "desc" },
        },
        _count: { select: { products: true } },
      },
    });
    return NextResponse.json({ success: true, users });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch users" },
      { status: 500 }
    );
  }
}
