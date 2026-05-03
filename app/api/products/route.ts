import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    console.log('=== PRODUCTS API DEBUG ===');
    console.log('Attempting to fetch products from MongoDB via Prisma...');
    
    // Use Prisma to fetch all products
    const products = await prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        },
        media: true
      }
    });

    console.log('Products fetched successfully from Prisma:', products.length);
    
    // Transform Prisma data to match expected format
    const formattedProducts = products.map((product: any) => {
      const mediaData = product.media && product.media.length > 0 ? product.media[0] : null;
      return {
        ...product,
        user: product.user ? {
          id: product.user.id,
          name: product.user.name,
          email: product.user.email
        } : null,
        media: mediaData ? [{
          images: mediaData.images || [],
          videos: mediaData.videos || [],
          mainImage: mediaData.mainImage || null,
          mainVideo: mediaData.mainVideo || null
        }] : []
      };
    });
    
    return NextResponse.json({
      success: true,
      data: formattedProducts
    });
  } catch (error) {
    console.error("Error fetching products from Prisma:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch products" },
      { status: 500 }
    );
  }
}


export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Product ID is required" },
        { status: 400 }
      );
    }

    // Use direct MongoDB connection instead of Prisma
    const { MongoClient, ObjectId } = require('mongodb');
    const dbUrl = process.env.DATABASE_URL;
    
    if (!dbUrl) {
      throw new Error('DATABASE_URL not found in environment variables');
    }
    
    const client = new MongoClient(dbUrl);
    await client.connect();
    
    const db = client.db('VERTEX_DB');
    const productsCollection = db.collection('products');
    
    // Delete product
    const result = await productsCollection.deleteOne({ _id: new ObjectId(id) });
    
    await client.close();

    return NextResponse.json({
      success: true,
      message: "Product deleted successfully",
      data: { deletedCount: result.deletedCount }
    });
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete product" },
      { status: 500 }
    );
  }
}
