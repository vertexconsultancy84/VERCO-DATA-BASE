import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  let orderData: any;
  
  try {
    orderData = await request.json();
    
    const {
      productId,
      productTitle,
      productPrice,
      userId,
      userName,
      userEmail,
      customerPhone,
      deliveryAddress,
      village,
      deliveryInstructions,
      paymentMethod,
      category,
      subcategory,
      status,
      createdAt
    } = orderData;

    if (!productId || !userName) {
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
        userId: userId || "507f191e810c19729de860ea", // Valid 12-byte ObjectId for guest orders
        userName,
        userEmail,
        customerPhone,
        deliveryAddress,
        village,
        deliveryInstructions,
        paymentMethod,
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

  } catch (error: any) {
    console.error("Order creation error details:", {
      message: error?.message || 'Unknown error',
      stack: error?.stack || 'No stack trace',
      orderData: orderData
    });
    return NextResponse.json({ 
      success: false, 
      message: `Failed to create order: ${error?.message || 'Unknown error'}` 
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

export async function DELETE(request: NextRequest) {
  try {
    const { orderId } = await request.json();
    
    if (!orderId) {
      return NextResponse.json({ 
        success: false, 
        message: "Order ID is required" 
      }, { status: 400 });
    }

    // Delete order from database
    const deletedOrder = await (prisma as any).order.delete({
      where: { id: orderId }
    });

    return NextResponse.json({ 
      success: true, 
      message: "Order deleted successfully",
      order: deletedOrder
    });

  } catch (error) {
    console.error("Order deletion error:", error);
    return NextResponse.json({ 
      success: false, 
      message: "Failed to delete order. Please try again." 
    }, { status: 500 });
  }
}
