import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const orderData = await request.json();
    
    const {
      productId,
      productTitle,
      productPrice,
      userId,
      userName,
      userEmail,
      category,
      subcategory,
      status,
      createdAt
    } = orderData;

    if (!productId || !userId || !userName) {
      return NextResponse.json({ 
        success: false, 
        message: "Missing required fields" 
      }, { status: 400 });
    }

    // Create order in database
    const order = await (prisma as any).order.create({
      data: {
        productId,
        productTitle,
        productPrice,
        userId,
        userName,
        userEmail,
        category,
        subcategory,
        status: status || "pending",
        createdAt: createdAt || new Date().toISOString()
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: "Order created successfully",
      orderId: order.id 
    });

  } catch (error) {
    console.error("Order creation error:", error);
    return NextResponse.json({ 
      success: false, 
      message: "Failed to create order. Please try again." 
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { orderId, status } = await request.json();
    
    if (!orderId || !status) {
      return NextResponse.json({ 
        success: false, 
        message: "Missing orderId or status" 
      }, { status: 400 });
    }

    // Update order status
    const order = await (prisma as any).order.update({
      where: { id: orderId },
      data: { status }
    });

    return NextResponse.json({ 
      success: true, 
      message: "Order status updated successfully",
      order 
    });

  } catch (error) {
    console.error("Order update error:", error);
    return NextResponse.json({ 
      success: false, 
      message: "Failed to update order status. Please try again." 
    }, { status: 500 });
  }
}
  export async function GET(request: NextRequest) {
  try {
    // Get all orders for admin dashboard
    const orders = await (prisma as any).order.findMany({
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ 
      success: true, 
      orders 
    });

  } catch (error) {
    console.error("Get orders error:", error);
    return NextResponse.json({ 
      success: false, 
      message: "Failed to fetch orders." 
    }, { status: 500 });
  }
}
