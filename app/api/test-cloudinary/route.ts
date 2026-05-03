import { NextResponse } from "next/server";
import * as cloudinary from 'cloudinary';

// Configure Cloudinary
cloudinary.v2.config({
  cloud_name: 'dzikttrya',
  api_key: '466747726444735',
  api_secret: 'Kcg7jS0ApBQVUc45WPFg8eZQ7vA',
  secure: true,
});

export async function GET() {
  try {
    // Test Cloudinary connection by getting account info
    const result = await new Promise((resolve, reject) => {
      cloudinary.v2.api.resources(
        { type: 'upload', max_results: 1 },
        (error: any, result: any) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        }
      );
    });

    return NextResponse.json({ 
      success: true, 
      message: "Cloudinary connection successful",
      data: result 
    });
  } catch (error) {
    console.error("Cloudinary connection test failed:", error);
    return NextResponse.json({ 
      success: false, 
      message: "Cloudinary connection failed",
      error: error 
    }, { status: 500 });
  }
}
