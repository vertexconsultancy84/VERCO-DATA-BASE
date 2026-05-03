import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const userEmail = searchParams.get('userEmail');

    if (!productId && !userEmail) {
      return NextResponse.json(
        { error: 'Product ID or User Email is required' },
        { status: 400 }
      );
    }

    // Find orders for the given product or user
    const whereClause: any = {};
    if (productId) {
      whereClause.productId = productId;
    }
    if (userEmail) {
      whereClause.userEmail = userEmail;
    }

    const orders = await prisma.order.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'desc',
      },
      take: 1, // Get the most recent order
    });

    if (orders.length === 0) {
      return NextResponse.json({
        success: true,
        paymentStatus: 'pending',
        orderId: null,
        message: 'No order found',
      });
    }

    const order = orders[0];

    return NextResponse.json({
      success: true,
      paymentStatus: order.paymentStatus || 'pending',
      orderId: order.id,
      contractUploaded: order.contractUploaded || false,
      contractFileUrl: order.contractFileUrl,
      order: {
        id: order.id,
        productTitle: order.productTitle,
        productPrice: order.productPrice,
        userName: order.userName,
        userEmail: order.userEmail,
        status: order.status,
        paymentStatus: order.paymentStatus || 'pending',
        contractUploaded: order.contractUploaded || false,
        createdAt: order.createdAt,
      },
    });
  } catch (error) {
    console.error('Error checking payment status:', error);
    return NextResponse.json(
      { error: 'Failed to check payment status' },
      { status: 500 }
    );
  }
}
