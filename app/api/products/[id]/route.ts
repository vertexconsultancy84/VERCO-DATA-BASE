import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await context.params;

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!product) {
      return NextResponse.json(
        { success: false, message: "Product not found" },
        { status: 404 }
      );
    }

    let mediaData = null;

    try {
      mediaData = await (prisma as any).productMedia.findFirst({
        where: { productId: productId },
      });
      console.log("Media data found:", mediaData);
    } catch (error) {
      console.log("ProductMedia not found for product:", productId, error);
    }

    console.log("=== PRODUCT DEBUG ===");
    console.log("Raw product data:", product);
    console.log("Contact Number:", (product as any).contactNumber);
    console.log("WhatsApp Number:", (product as any).whatsappNumber);
    console.log("Product keys:", Object.keys(product));
    console.log("===================");

    return NextResponse.json({
      success: true,
      product: {
        ...product,
        contactNumber: (product as any).contactNumber || null,
        whatsappNumber: (product as any).whatsappNumber || null,
        media: mediaData
          ? [
              {
                images: mediaData.images || [],
                videos: mediaData.videos || [],
                mainImage: mediaData.mainImage || null,
                mainVideo: mediaData.mainVideo || null,
              },
            ]
          : [],
      },
    });
  } catch (error) {
    console.error("Error fetching product:", error);

    return NextResponse.json(
      { success: false, message: "Failed to fetch product" },
      { status: 500 }
    );
  }
}