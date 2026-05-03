import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { orderId, adminId } = await request.json();

    if (!orderId || !adminId) {
      return NextResponse.json(
        { error: 'Order ID and Admin ID are required' },
        { status: 400 }
      );
    }

    // Update order payment verification
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: 'verified',
        paymentVerifiedBy: adminId,
        paymentVerifiedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Payment verified successfully',
      order: updatedOrder,
    });
  } catch (error) {
    console.error('Error verifying payment:', error);
    return NextResponse.json(
      { error: 'Failed to verify payment' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const whereClause = status ? { paymentStatus: status } : {};

    const orders = await prisma.order.findMany({
      where: whereClause,
      include: {
        product: {
          select: {
            title: true,
            price: true,
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      orders,
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}
