"use server";
import { prisma } from "@/lib/prisma";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { MongoClient, ObjectId } from "mongodb";

const DB_NAME = "VERTEX_DB";

function getMongoClient() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) throw new Error("DATABASE_URL not found in environment variables");
  return new MongoClient(dbUrl);
}

export async function createProduct(prevState: any, formData: FormData) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("user_session")?.value;
  if (!sessionToken) return { success: false, message: "Unauthorized. Please login." };

  const user = await prisma.user.findUnique({
    where: { id: sessionToken },
    select: { id: true },
  });

  if (!user) return { success: false, message: "User not found." };

  const images: string[] = [];
  const videos: string[] = [];

  const imageFiles = formData.getAll("image") as File[];
  const videoFiles = formData.getAll("video") as File[];

  for (const file of imageFiles) {
    if (file.size > 0) {
      try {
        const result = await uploadToCloudinary(file, "products") as any;
        if (result?.url) images.push(result.url);
      } catch (error) {
        console.error("Image upload error:", error);
      }
    }
  }

  for (const file of videoFiles) {
    if (file.size > 0) {
      try {
        const result = await uploadToCloudinary(file, "video") as any;
        if (result?.url) videos.push(result.url);
      } catch (error) {
        console.error("Video upload error:", error);
      }
    }
  }

  // Cloudinary fallback for media loop
  for (let i = 0; i < 10; i++) {
    const file = formData.get("media-" + i) as File;
    if (file && file.size > 0) {
      if (file.type.startsWith("image/")) {
        const url = await uploadToCloudinary(file, "products") as any;
        if (url?.url) images.push(url.url);
      } else if (file.type.startsWith("video/")) {
        const url = await uploadToCloudinary(file, "video") as any;
        if (url?.url) videos.push(url.url);
      }
    }
  }

  const category = formData.get("category") as string;
  const subcategory = formData.get("subcategory") as string || null;
  const propertyType = formData.get("propertyType") as string || null;
  const priceParsed = formData.get("price") ? parseFloat(formData.get("price") as string) : null;

  try {
    const product = await prisma.product.create({
      data: {
        title: formData.get("title") as string,
        description: formData.get("description") as string,
        price: priceParsed,
        latitude: parseFloat(formData.get("latitude") as string) || null,
        longitude: parseFloat(formData.get("longitude") as string) || null,
        province: formData.get("province") as string,
        district: formData.get("district") as string,
        sector: formData.get("sector") as string,
        village: formData.get("village") as string,
        category: category as any,
        subcategory,
        propertyType,
        available: true,
        hidden: false,
        contactNumber: formData.get("contactNumber") as string,
        whatsappNumber: formData.get("whatsappNumber") as string,
        user: { connect: { id: user.id } },
        media: {
          create: {
            images,
            videos,
            mainImage: images[0] || null,
            mainVideo: videos[0] || null,
          }
        }
      }
    });

    redirect("/user/dashboard");
  } catch (error) {
    if (error instanceof Error && error.message === "NEXT_REDIRECT") {
      throw error;
    }
    console.error("Error creating product via Prisma:", error);
    return { success: false, message: "Failed to create product." };
  }
}

export async function getUserProducts() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("user_session")?.value;
    if (!sessionToken) return null;

    const products = await prisma.product.findMany({
      where: { userId: sessionToken },
      orderBy: [
        { available: 'desc' },
        { createdAt: 'desc' }
      ],
      include: { media: true }
    });

    return products.map((product: any) => {
      const mediaData = product.media && product.media.length > 0 ? product.media[0] : null;
      return {
        ...product,
        media: mediaData ? [{
          images: mediaData.images || [],
          videos: mediaData.videos || [],
          mainImage: mediaData.mainImage || null,
          mainVideo: mediaData.mainVideo || null,
        }] : []
      };
    });
  } catch (error) {
    console.error("Error fetching user products via Prisma:", error);
    return null;
  }
}

export async function getAllPublishedProducts(): Promise<any[]> {
  console.log("=== GET ALL PUBLISHED PRODUCTS DEBUG ===");
  try {
    const products = await prisma.product.findMany({
      where: { hidden: false },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        },
        media: true
      },
      orderBy: [
        { available: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    const formattedProducts = products.map((product: any) => {
      const mediaData = product.media && product.media.length > 0 ? product.media[0] : null;
      return {
        ...product,
        user: product.user ? {
          ...product.user,
          id: product.user.id
        } : null,
        media: mediaData ? [{
          images: mediaData.images || [],
          videos: mediaData.videos || [],
          mainImage: mediaData.mainImage || null,
          mainVideo: mediaData.mainVideo || null,
        }] : []
      };
    });

    return formattedProducts;
  } catch (error) {
    console.error("Error fetching all products via Prisma:", error);
    return [];
  }
}

export async function getProductById(productId: string) {
  console.log("=== GET PRODUCT BY ID DEBUG ===", productId);
  try {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { media: true }
    });

    if (!product) {
      return { success: false, message: "Product not found." };
    }

    return { success: true, data: product };
  } catch (error) {
    console.error("Error fetching product:", error);
    return { success: false, message: "Failed to fetch product." };
  }
}

export async function updateProduct(productId: string, input: FormData | any) {
  try {
    let data: any = {};
    let mediaData: any = null;

    if (input instanceof FormData) {
      data = {
        title: input.get("title") as string,
        description: input.get("description") as string,
        price: input.get("price") ? parseFloat(input.get("price") as string) : null,
        latitude: input.get("latitude") ? parseFloat(input.get("latitude") as string) : null,
        longitude: input.get("longitude") ? parseFloat(input.get("longitude") as string) : null,
        province: input.get("province") as string,
        district: input.get("district") as string,
        sector: input.get("sector") as string,
        village: input.get("village") as string,
        available: input.get("available") !== "false",
        category: input.get("category") as string,
        subcategory: input.get("subcategory") as string,
        propertyType: input.get("propertyType") as string,
        contactNumber: input.get("contactNumber") as string,
        whatsappNumber: input.get("whatsappNumber") as string,
      };
    } else {
      // If it's a plain object, extract product fields and media fields
      const { images, videos, mainImage, mainVideo, media, ...productFields } = input;
      data = productFields;
      
      if (images || videos || mainImage || mainVideo) {
        mediaData = {
          images: images || [],
          videos: videos || [],
          mainImage: mainImage || (images && images[0]) || null,
          mainVideo: mainVideo || (videos && videos[0]) || null,
        };
      }
    }

    // Update the product
    await prisma.product.update({
      where: { id: productId },
      data: { 
        ...data, 
        updatedAt: new Date() 
      }
    });

    // If media data was provided in the object, update the related ProductMedia
    if (mediaData) {
      await (prisma as any).productMedia.upsert({
        where: { productId: productId },
        update: mediaData,
        create: {
          ...mediaData,
          productId: productId
        }
      });
    }

    return { success: true, message: "Product updated successfully." };
  } catch (error) {
    console.error("Error updating product:", error);
    return { success: false, message: "Failed to update product." };
  }
}

export async function deleteProduct(productId: string) {
  try {
    await prisma.product.delete({
      where: { id: productId }
    });

    return { success: true, message: "Product deleted successfully" };
  } catch (error) {
    console.error("Error deleting product via Prisma:", error);
    return { success: false, message: "Failed to delete product." };
  }
}
