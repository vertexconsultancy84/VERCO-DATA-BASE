import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { uploadToCloudinary } from "@/lib/cloudinary";

export async function POST(request: NextRequest) {
  try {
    // Get user session
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("user_session")?.value;

    if (!sessionToken) {
      return NextResponse.json({ success: false, message: "Unauthorized. Please login." }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: sessionToken },
    });

    if (!user) {
      return NextResponse.json({ success: false, message: "User not found." }, { status: 401 });
    }

    const formData = await request.formData();
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
    const contactNumber = formData.get("contactNumber") as string;
    const whatsappNumber = formData.get("whatsappNumber") as string;

    if (!title || !description) {
      return NextResponse.json({ success: false, message: "Title and description are required." }, { status: 400 });
    }

    // Get files
    const imageFiles = formData.getAll("image") as File[];
    const videoFiles = formData.getAll("video") as File[];

    if (imageFiles.length === 0) {
      return NextResponse.json({ success: false, message: "At least one image is required." }, { status: 400 });
    }

    // Upload files to Cloudinary
    const savedImages: string[] = [];
    const savedVideos: string[] = [];

    // Upload images
    for (const file of imageFiles) {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json({ success: false, message: "Invalid image file type." }, { status: 400 });
      }
      
      if (file.size > 5 * 1024 * 1024) {
        return NextResponse.json({ success: false, message: "Image size too large. Maximum 5MB per image." }, { status: 400 });
      }

      try {
        const result: any = await uploadToCloudinary(file, 'products/images');
        savedImages.push(result.url);
      } catch (error) {
        console.error("Image upload error:", error);
        return NextResponse.json({ success: false, message: "Failed to upload image to cloud." }, { status: 500 });
      }
    }

    // Upload videos
    for (const file of videoFiles) {
      const allowedTypes = ['video/mp4', 'video/webm', 'video/ogg'];
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json({ success: false, message: "Invalid video file type." }, { status: 400 });
      }
      
      if (file.size > 10 * 1024 * 1024) {
        return NextResponse.json({ success: false, message: "Video size too large. Maximum 10MB per video." }, { status: 400 });
      }

      try {
        const result: any = await uploadToCloudinary(file, 'products/videos');
        savedVideos.push(result.url);
      } catch (error) {
        console.error("Video upload error:", error);
        return NextResponse.json({ success: false, message: "Failed to upload video to cloud." }, { status: 500 });
      }
    }

    // Parse coordinates
    const parsedLatitude = latitude ? parseFloat(latitude) : null;
    const parsedLongitude = longitude ? parseFloat(longitude) : null;

    // Validate coordinates
    if (latitude && (isNaN(parsedLatitude!) || parsedLatitude! < -90 || parsedLatitude! > 90)) {
      return NextResponse.json({ success: false, message: "Invalid latitude. Must be between -90 and 90." }, { status: 400 });
    }
    if (longitude && (isNaN(parsedLongitude!) || parsedLongitude! < -180 || parsedLongitude! > 180)) {
      return NextResponse.json({ success: false, message: "Invalid longitude. Must be between -180 and 180." }, { status: 400 });
    }

    // Create product with metadata only (no media URLs in database)
    const productData: any = {
      title,
      description,
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
    if (province) {
      productData.province = province;
    }
    if (district) {
      productData.district = district;
    }
    if (sector) {
      productData.sector = sector;
    }
    if (village) {
      productData.village = village;
    }
    if (contactNumber) {
      productData.contactNumber = contactNumber;
    }
    if (whatsappNumber) {
      productData.whatsappNumber = whatsappNumber;
    }

    // Create product first
    const product = await prisma.product.create({
      data: productData,
    });

    // Then store media references in ProductMedia collection
    const mediaData = {
      productId: product.id,
      images: savedImages,
      videos: savedVideos,
      mainImage: savedImages[0] || null,
      mainVideo: savedVideos[0] || null,
    };

    await (prisma as any).productMedia.create({
      data: mediaData,
    });

    return NextResponse.json({ 
      success: true, 
      message: "Product uploaded successfully to Cloudinary!", 
      productId: product.id 
    });

  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ 
      success: false, 
      message: "Failed to upload product. Please try again." 
    }, { status: 500 });
  }
}
