import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { uploadToCloudinary } from "@/lib/cloudinary";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("user_session")?.value;

    if (!sessionToken) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: sessionToken },
    });

    if (!user) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 401 });
    }

    // FORM DATA
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const category = formData.get("category") as string;
    const subcategory = (formData.get("subcategory") as string)?.toLowerCase();
    const propertyType = formData.get("propertyType") as string;
    const price = formData.get("price") as string;
    const latitude = formData.get("latitude") as string;
    const longitude = formData.get("longitude") as string;
    const province = formData.get("province") as string;
    const district = formData.get("district") as string;
    const sector = formData.get("sector") as string;
    const village = formData.get("village") as string;
    const zone = formData.get("zone") as string;
    const available = formData.get("available") as string;

    if (!title || !description || !category) {
      return NextResponse.json({ success: false, message: "Missing required fields (title, description, or category)" }, { status: 400 });
    }

    const imageFiles = formData.getAll("image") as File[];
    const videoFiles = formData.getAll("video") as File[];

    if (imageFiles.length === 0) {
      return NextResponse.json({ success: false, message: "At least one image required" }, { status: 400 });
    }

    // Check total file size to prevent timeout
    const totalSize = [...imageFiles, ...videoFiles].reduce((acc, file) => acc + file.size, 0);
    const maxTotalSize = 100 * 1024 * 1024; // 100MB total limit
    if (totalSize > maxTotalSize) {
      return NextResponse.json({ 
        success: false, 
        message: `Files too large. Maximum total size is ${maxTotalSize / 1024 / 1024}MB` 
      }, { status: 400 });
    }

    const savedImages: string[] = [];
    const savedVideos: string[] = [];

    // Upload images sequentially to prevent overwhelming the server
    for (const file of imageFiles) {
      try {
        console.log(`Starting upload for ${file.name}...`);
        const result: any = await uploadToCloudinary(file, "products/images");
        savedImages.push(result.url);
        console.log(`Successfully uploaded ${file.name}`);
      } catch (error) {
        console.error(`Image upload failed for ${file.name}:`, error);
        const errorMessage = (error as Error)?.message || JSON.stringify(error);
        throw new Error(`Failed to upload image ${file.name}: ${errorMessage}`);
      }
    }

    // Upload videos sequentially
    for (const file of videoFiles) {
      try {
        console.log(`Starting video upload for ${file.name}...`);
        const result: any = await uploadToCloudinary(file, "products/videos");
        savedVideos.push(result.url);
        console.log(`Successfully uploaded video ${file.name}`);
      } catch (error) {
        console.error(`Video upload failed for ${file.name}:`, error);
        const errorMessage = (error as Error)?.message || JSON.stringify(error);
        throw new Error(`Failed to upload video ${file.name}: ${errorMessage}`);
      }
    }

    const productData: any = {
      title,
      description,
      category: category as any,
      subcategory: subcategory || null,
      propertyType: propertyType || null,
      price: price ? parseFloat(price) : null,
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
      province,
      district,
      sector,
      village,
      zone,
      available: available !== "false",
      userId: user.id,
    };

    const product = await prisma.product.create({
      data: productData,
    });

    await prisma.productMedia.create({
      data: {
        productId: product.id,
        images: savedImages,
        videos: savedVideos,
        mainImage: savedImages[0] || null,
        mainVideo: savedVideos[0] || null,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Uploaded successfully",
      productId: product.id,
    });

  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : "Server error during upload" 
      },
      { status: 500 }
    );
  }
}
