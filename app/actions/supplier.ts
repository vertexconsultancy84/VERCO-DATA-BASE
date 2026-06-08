"use server";

import { prisma } from "@/lib/prisma";
import { ProductCategory } from "@prisma/client";

export interface SupplierInfo {
  id: string;
  name: string;
  province: string | null;
  district: string | null;
  sector: string | null;
  zone: string | null;
}

export async function getSuppliersBySubcategory(
  category: string,
  subcategory: string
): Promise<SupplierInfo[]> {
  try {
    const users = await prisma.user.findMany({
      where: {
        products: {
          some: {
            category: category as ProductCategory,
            subcategory,
            available: true,
            hidden: false,
          },
        },
      },
      select: {
        id: true,
        name: true,
        province: true,
        district: true,
        sector: true,
        zone: true,
      },
      orderBy: { name: "asc" },
    });
    return users;
  } catch {
    return [];
  }
}

export async function searchAllSuppliers(
  query: string,
  category: string,
  subcategory?: string
): Promise<SupplierInfo[]> {
  try {
    const q = query.trim();
    if (!q) return [];

    const productFilter: any = {
      category: category as ProductCategory,
      available: true,
      hidden: false,
    };
    if (subcategory && subcategory !== "all") {
      productFilter.subcategory = subcategory;
    }

    return await prisma.user.findMany({
      where: {
        AND: [
          // Only users who have at least one product in the requested category
          { products: { some: productFilter } },
          // Match the search query against name or location fields
          {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { province: { contains: q, mode: "insensitive" } },
              { district: { contains: q, mode: "insensitive" } },
              { sector: { contains: q, mode: "insensitive" } },
              { zone: { contains: q, mode: "insensitive" } },
            ],
          },
        ],
      },
      select: {
        id: true,
        name: true,
        province: true,
        district: true,
        sector: true,
        zone: true,
      },
      orderBy: { name: "asc" },
      take: 30,
    });
  } catch {
    return [];
  }
}

export async function getSupplierWithProducts(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        province: true,
        district: true,
        sector: true,
        zone: true,
        products: {
          where: { available: true, hidden: false },
          include: { media: true },
          orderBy: { createdAt: "desc" },
        },
      },
    });
    if (!user) return null;
    return {
      ...user,
      products: user.products.map((p: any) => {
        const mediaData = Array.isArray(p.media) && p.media.length > 0 ? p.media[0] : null;
        return {
          ...p,
          media: mediaData
            ? [{ images: mediaData.images || [], videos: mediaData.videos || [], mainImage: mediaData.mainImage || null, mainVideo: mediaData.mainVideo || null }]
            : [],
        };
      }),
    };
  } catch {
    return null;
  }
}
