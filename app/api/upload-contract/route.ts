import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { uploadToCloudinary } from '@/lib/cloudinary';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const orderId = formData.get('orderId') as string;
    const file = formData.get('file') as File;

    if (!orderId || !file) {
      return NextResponse.json(
        { error: 'Order ID and file are required' },
        { status: 400 }
      );
    }

    // Check if payment is verified before allowing contract upload
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    if (order.paymentStatus !== 'verified') {
      return NextResponse.json(
        { 
          error: 'Payment must be verified before uploading contract',
          paymentStatus: order.paymentStatus 
        },
        { status: 403 }
      );
    }

    // Upload file to Cloudinary
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    const uploadResult = await uploadToCloudinary(buffer, 'contracts');
    
    if (!uploadResult || !(uploadResult as any).url) {
      return NextResponse.json(
        { error: 'Failed to upload contract file' },
        { status: 500 }
      );
    }

    // Update order with contract information
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        contractUploaded: true,
        contractFileUrl: (uploadResult as any).url,
        contractSubmittedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Contract uploaded successfully',
      contractUrl: (uploadResult as any).url,
      order: updatedOrder,
    });
  } catch (error) {
    console.error('Error uploading contract:', error);
    return NextResponse.json(
      { error: 'Failed to upload contract' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        paymentStatus: true,
        contractUploaded: true,
        contractFileUrl: true,
        contractSubmittedAt: true,
        productTitle: true,
        userName: true,
        userEmail: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      order,
    });
  } catch (error) {
    console.error('Error fetching contract information:', error);
    return NextResponse.json(
      { error: 'Failed to fetch contract information' },
      { status: 500 }
    );
  }
}
