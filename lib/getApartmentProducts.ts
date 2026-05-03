import { prisma } from "@/lib/prisma";

export async function getApartmentProducts() {
  return await prisma.product.findMany({
    where: {
      category: "RealEstate",
      subcategory: "for-rent",
      propertyType: "apartment",
    } as any, // Type assertion to bypass Prisma client type issues
    orderBy: {
      createdAt: "desc",
    },
    include: {
      media: true,
    },
  });
}