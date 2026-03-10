"use server";

import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export async function createProduct(prevState: any, formData: FormData) {
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const price = formData.get("price") as string;
  const imageFiles = formData.getAll("image") as File[];
  const videoFiles = formData.getAll("video") as File[];
  const latitude = formData.get("latitude") as string;
  const longitude = formData.get("longitude") as string;
  const available = formData.get("available") as string; // Get availability from form
  const contactNumber = formData.get("contactNumber") as string;
  const whatsappNumber = formData.get("whatsappNumber") as string;

  // Debug logging for contact fields
  console.log("=== CREATE PRODUCT DEBUG ===");
  console.log("Contact Number:", contactNumber);
  console.log("WhatsApp Number:", whatsappNumber);
  console.log("==========================");

  if (!title || !description || imageFiles.length === 0) {
    return { success: false, message: "Title, description, and at least one image are required." };
  }

  try {
    // Get user session
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("user_session")?.value;

    if (!sessionToken) {
      return { success: false, message: "Unauthorized. Please login." };
    }

    const user = await prisma.user.findUnique({
      where: { id: sessionToken },
    });

    if (!user) {
      return { success: false, message: "User not found." };
    }

    // Process images
    const images: string[] = [];
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    
    for (const file of imageFiles) {
      if (!allowedTypes.includes(file.type)) {
        return { success: false, message: "Invalid image file type. Please upload JPEG, PNG, or GIF." };
      }
      
      if (file.size > 5 * 1024 * 1024) {
        return { success: false, message: "Image size too large. Please upload images smaller than 5MB each." };
      }

      let buffer: ArrayBuffer;
      try {
        buffer = await file.arrayBuffer();
      } catch (error) {
        console.error("Error reading image file:", error);
        return { success: false, message: "Failed to read image file. Please try again." };
      }
      
      let imageBase64: string;
      try {
        imageBase64 = Buffer.from(buffer).toString("base64");
      } catch (error) {
        console.error("Error converting to base64:", error);
        return { success: false, message: "Failed to process image. Please try a different image." };
      }
      
      images.push(`data:${file.type};base64,${imageBase64}`);
    }

    // Process videos
    const videos: string[] = [];
    const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/ogg'];
    
    for (const file of videoFiles) {
      if (!allowedVideoTypes.includes(file.type)) {
        return { success: false, message: "Invalid video file type. Please upload MP4, WebM, or OGG." };
      }
      
      if (file.size > 10 * 1024 * 1024) {
        return { success: false, message: "Video size too large. Please upload videos smaller than 10MB." };
      }

      let buffer: ArrayBuffer;
      try {
        buffer = await file.arrayBuffer();
      } catch (error) {
        console.error("Error reading video file:", error);
        return { success: false, message: "Failed to read video file. Please try again." };
      }
      
      let videoBase64: string;
      try {
        videoBase64 = Buffer.from(buffer).toString("base64");
      } catch (error) {
        console.error("Error converting video to base64:", error);
        return { success: false, message: "Failed to process video. Please try a different video." };
      }
      
      videos.push(`data:${file.type};base64,${videoBase64}`);
    }

    // Parse latitude and longitude if provided
    const parsedLatitude = latitude ? parseFloat(latitude) : null;
    const parsedLongitude = longitude ? parseFloat(longitude) : null;

    // Validate coordinates if provided
    if (latitude && (isNaN(parsedLatitude!) || parsedLatitude! < -90 || parsedLatitude! > 90)) {
      return { success: false, message: "Invalid latitude. Must be between -90 and 90." };
    }
    if (longitude && (isNaN(parsedLongitude!) || parsedLongitude! < -180 || parsedLongitude! > 180)) {
      return { success: false, message: "Invalid longitude. Must be between -180 and 180." };
    }

    // Create product with new schema
    const productData: any = {
      title,
      description,
      images,
      videos,
      userId: user.id,
      available: available !== "false", // Convert to boolean, default to true
    };

    // Add optional fields
    if (price) {
      productData.price = parseFloat(price);
    }
    if (parsedLatitude !== null && parsedLongitude !== null) {
      productData.latitude = parsedLatitude;
      productData.longitude = parsedLongitude;
    }
    if (contactNumber) {
      productData.contactNumber = contactNumber;
    }
    if (whatsappNumber) {
      productData.whatsappNumber = whatsappNumber;
    }

    console.log("=== PRODUCT DATA BEING SAVED ===");
    console.log("Complete product data:", productData);
    console.log("Contact Number in data:", productData.contactNumber);
    console.log("WhatsApp Number in data:", productData.whatsappNumber);
    console.log("==============================");

    // Set main image and video
    if (images.length > 0) {
      productData.mainImage = images[0]; // First image as main
    }
    if (videos.length > 0) {
      productData.mainVideo = videos[0]; // First video as main
    }

    const product = await prisma.product.create({
      data: productData,
    });

    return { success: true, message: "Product uploaded successfully!", productId: product.id };
  } catch (error) {
    console.error("Product creation error:", error);
    return { success: false, message: "Failed to upload product. Please try again." };
  }
}

export async function getUserProducts() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("user_session")?.value;

    if (!sessionToken) {
      return null;
    }

    const products = await prisma.product.findMany({
      where: { userId: sessionToken },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: [
        { available: "desc" }, // Available products first (true = 1, false = 0)
        { createdAt: "desc" }   // Then by creation date (newest first)
      ],
    });

    // Fetch media for each product
    const productsWithMedia = await Promise.all(
      products.map(async (product) => {
        let mediaData = null;
        try {
          mediaData = await (prisma as any).productMedia.findFirst({
            where: { productId: product.id },
          });
        } catch (error) {
          // ProductMedia collection might not exist yet
          console.log("ProductMedia collection not found for product:", product.id);
        }

        return {
          ...product,
          media: mediaData ? {
            images: mediaData.images,
            videos: mediaData.videos,
            mainImage: mediaData.mainImage,
            mainVideo: mediaData.mainVideo,
          } : null,
        };
      })
    );

    return productsWithMedia;
  } catch (error) {
    console.error("Error fetching user products:", error);
    return null;
  }
}

export async function deleteProduct(productId: string) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("user_session")?.value;

    if (!sessionToken) {
      return { success: false, message: "Unauthorized." };
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product || product.userId !== sessionToken) {
      return { success: false, message: "Product not found or you don't have permission to delete it." };
    }

    await prisma.product.delete({
      where: { id: productId },
    });

    // Also delete associated media records from ProductMedia collection
    try {
      await (prisma as any).productMedia.deleteMany({
        where: { productId: productId },
      });
      console.log(`✅ Also deleted media records for product: ${productId}`);
    } catch (mediaError: any) {
      console.log("⚠️  Could not delete media records:", mediaError.message);
      // Don't fail the deletion if media cleanup fails
    }

    return { success: true, message: "Product deleted successfully." };
  } catch (error) {
    console.error("Product deletion error:", error);
    return { success: false, message: "Failed to delete product." };
  }
}

export async function getAllPublishedProducts() {
  console.log("=== GET ALL PUBLISHED PRODUCTS DEBUG ===");
  try {
    // For MongoDB, we need to fetch all products and filter in JavaScript
    // since $queryRaw is not supported for MongoDB provider
    const products = await prisma.product.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: [
        { available: "desc" }, // Available products first
        { createdAt: "desc" }   // Then by creation date
      ],
    });

    console.log("Raw products from database:", products.length);

    // Filter out hidden products in JavaScript (since MongoDB doesn't support raw queries)
    const visibleProducts = products.filter((product: any) => {
      // If hidden field doesn't exist or is false, show the product
      return !product.hidden || product.hidden === false;
    });

    console.log("Visible products after filtering:", visibleProducts.length);

    // Fetch media for each product from ProductMedia collection
    const productsWithMedia = await Promise.all(
      visibleProducts.map(async (product: any) => {
        let mediaData = null;
        try {
          mediaData = await (prisma as any).productMedia.findFirst({
            where: { productId: product.id },
          });
        } catch (error) {
          console.log("ProductMedia not found for product:", product.id);
        }

        return {
          ...product,
          media: mediaData ? {
            images: mediaData.images,
            videos: mediaData.videos,
            mainImage: mediaData.mainImage,
            mainVideo: mediaData.mainVideo,
          } : null,
        };
      })
    );

    return productsWithMedia;
  } catch (error: any) {
    console.error("Error fetching all products:", error);
    // Fallback to standard query without filtering if there's an error
    try {
      const products = await prisma.product.findMany({
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: [
          { available: "desc" },
          { createdAt: "desc" }
        ],
      });
      return products;
    } catch (fallbackError: any) {
      console.error("Fallback query also failed:", fallbackError);
      return [];
    }
  }
}

export async function updateProduct(productId: string, formData: FormData) {
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const price = formData.get("price") as string;
  const latitude = formData.get("latitude") as string;
  const longitude = formData.get("longitude") as string;
  const province = formData.get("province") as string;
  const district = formData.get("district") as string;
  const sector = formData.get("sector") as string;
  const village = formData.get("village") as string;
  const available = formData.get("available") as string;

  // Debug logging
  console.log("=== UPDATE PRODUCT ACTION DEBUG ===");
  console.log("Product ID:", productId);
  console.log("Title:", title);
  console.log("Province:", province);
  console.log("District:", district);
  console.log("Sector:", sector);
  console.log("Village:", village);
  console.log("Available:", available);
  console.log("=====================================");

  if (!title || !description) {
    return { success: false, message: "Title and description are required." };
  }

  try {
    // Get user session
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("user_session")?.value;

    if (!sessionToken) {
      return { success: false, message: "Unauthorized. Please login." };
    }

    const user = await prisma.user.findUnique({
      where: { id: sessionToken },
    });

    if (!user) {
      return { success: false, message: "User not found." };
    }

    // Check if product belongs to user
    const existingProduct = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!existingProduct) {
      return { success: false, message: "Product not found." };
    }

    if (existingProduct.userId !== user.id) {
      return { success: false, message: "You can only edit your own products." };
    }

    // Parse latitude and longitude if provided
    const parsedLatitude = latitude ? parseFloat(latitude) : null;
    const parsedLongitude = longitude ? parseFloat(longitude) : null;

    // Validate coordinates if provided
    if (latitude && (isNaN(parsedLatitude!) || parsedLatitude! < -90 || parsedLatitude! > 90)) {
      return { success: false, message: "Invalid latitude. Must be between -90 and 90." };
    }
    if (longitude && (isNaN(parsedLongitude!) || parsedLongitude! < -180 || parsedLongitude! > 180)) {
      return { success: false, message: "Invalid longitude. Must be between -180 and 180." };
    }

    // Update product data
    const updateData: any = {
      title,
      description,
      available: available !== "false", // Convert to boolean, default to true
    };

    // Add optional fields
    if (price) {
      updateData.price = parseFloat(price);
    }
    if (parsedLatitude !== null && parsedLongitude !== null) {
      updateData.latitude = parsedLatitude;
      updateData.longitude = parsedLongitude;
    }
    if (province) {
      updateData.province = province;
    }
    if (district) {
      updateData.district = district;
    }
    if (sector) {
      updateData.sector = sector;
    }
    if (village) {
      updateData.village = village;
    }

    // Debug logging
    console.log("=== UPDATE DATA DEBUG ===");
    console.log("Final updateData:", JSON.stringify(updateData, null, 2));
    console.log("=========================");

    // Update product
    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: updateData,
    });

    return { success: true, message: "Product updated successfully!", product: updatedProduct };
  } catch (error) {
    console.error("Product update error:", error);
    return { success: false, message: "Failed to update product. Please try again." };
  }
}
