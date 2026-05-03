import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { 
      productId, 
      tenantName, 
      tenantNationality, 
      tenantID, 
      tenantAddress, 
      tenantContact,
      userName,
      userEmail,
      customerPhone,
      deliveryAddress,
      village,
      productTitle,
      productPrice,
      category,
      subcategory,
      contractFileUrl
    } = await request.json();

    if (!productId || !tenantName || !userName || !userEmail) {
      return NextResponse.json(
        { error: 'Product ID, tenant name, user name, and user email are required' },
        { status: 400 }
      );
    }

    // Create a new order with pending payment status
    const newOrder = await prisma.order.create({
      data: {
        productId,
        productTitle,
        productPrice,
        quantity: 1,
        userName,
        userEmail,
        customerPhone,
        deliveryAddress,
        village,
        category: category || 'OtherProducts',
        subcategory,
        status: 'pending',
        paymentStatus: 'pending',
        contractUploaded: !!contractFileUrl,
        contractFileUrl: contractFileUrl,
        contractSubmittedAt: contractFileUrl ? new Date() : null,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Contract request submitted successfully! Please contact admin to arrange payment.',
      orderId: newOrder.id,
      order: newOrder,
    });
  } catch (error) {
    console.error('Error submitting contract request:', error);
    return NextResponse.json(
      { error: 'Failed to submit contract request' },
      { status: 500 }
    );
  }
}
