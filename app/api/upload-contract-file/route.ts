import { NextRequest, NextResponse } from 'next/server';
import { uploadToCloudinary } from '@/lib/cloudinary';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }

    // Upload file to Cloudinary in the 'contracts' folder
    console.log('Contract upload started for:', file.name);
    
    // Create a clean public_id from filename
    const cleanPublicId = file.name
      .replace(/[^a-zA-Z0-9._-]/g, '') // Remove special characters
      .replace(/\s+/g, '_') // Replace spaces with underscores
      .toLowerCase();
    
    const result: any = await uploadToCloudinary(file, 'contracts');
    
    if (!result || !result.url) {
      throw new Error('Cloudinary upload failed - no URL returned');
    }

    console.log('Contract upload successful:', result.url);
    
    return NextResponse.json({
      success: true,
      url: result.url,
      message: 'File uploaded successfully'
    });
  } catch (error: any) {
    console.error('Contract upload API error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Upload failed',
      details: JSON.stringify(error) 
    }, { status: 500 });
  }
}
