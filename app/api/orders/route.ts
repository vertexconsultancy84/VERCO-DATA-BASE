import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

async function getSessionUserId(): Promise<{ id: string; email: string } | null> {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("user_session")?.value;
    if (!sessionToken) return null;
    const user = await prisma.user.findUnique({
      where: { id: sessionToken },
      select: { id: true, email: true },
    });
    return user ?? null;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  let orderData: any;

  try {
    orderData = await request.json();

    const {
      productId,
      productTitle,
      productPrice,
      quantity,
      userName,
      userEmail,
      customerPhone,
      fulfillmentMethod,
      deliveryPersonName,
      deliveryAddress,
      village,
      deliveryInstructions,
      paymentMethod,
      category,
      subcategory,
      status,
      createdAt,
    } = orderData;

    if (!productId || !userName) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Always resolve the real user from the server-side session — never trust the client-sent userId
    const sessionUser = await getSessionUserId();

    // Create with fields the current generated client knows about
    const order = await prisma.order.create({
      data: {
        productId,
        productTitle,
        productPrice,
        quantity: quantity || 1,
        // Use the server-resolved userId; fall back to the guest placeholder only when truly not logged in
        userId: sessionUser?.id ?? "507f191e810c19729de860ea",
        userName,
        userEmail: sessionUser?.email ?? userEmail,
        customerPhone,
        deliveryAddress,
        village,
        deliveryInstructions,
        paymentMethod,
        category,
        subcategory,
        status: status || "pending",
        createdAt: createdAt || new Date().toISOString(),
      },
    });

    // Patch the two new schema fields via raw MongoDB command.
    // This is needed because the Prisma client was generated before
    // fulfillmentMethod / deliveryPersonName were added to schema.prisma.
    // Run `npx prisma generate` (with dev server stopped) to make this permanent.
    try {
      await (prisma as any).$runCommandRaw({
        update: "Order",
        updates: [
          {
            q: { _id: { $oid: order.id } },
            u: {
              $set: {
                fulfillmentMethod: fulfillmentMethod ?? "delivery",
                deliveryPersonName: deliveryPersonName ?? null,
              },
            },
          },
        ],
      });
    } catch (patchErr) {
      // Non-critical — order is created; only the two new fields may be absent
      console.warn("fulfillmentMethod patch failed:", patchErr);
    }

    return NextResponse.json({
      success: true,
      message: "Order created successfully",
      orderId: order.id,
    });
  } catch (error: any) {
    console.error("Order creation error details:", {
      message: error?.message || "Unknown error",
      stack: error?.stack || "No stack trace",
      orderData,
    });
    return NextResponse.json(
      {
        success: false,
        message: `Failed to create order: ${error?.message || "Unknown error"}`,
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { orderId, status, paymentStatus, deliveryPersonName, deliveryAddress, notes } = await request.json();

    if (!orderId) {
      return NextResponse.json(
        { success: false, message: "Missing orderId" },
        { status: 400 }
      );
    }

    const updateData: Record<string, any> = {};
    if (status !== undefined) updateData.status = status;
    if (paymentStatus !== undefined) updateData.paymentStatus = paymentStatus;
    if (deliveryPersonName !== undefined) updateData.deliveryPersonName = deliveryPersonName;
    if (deliveryAddress !== undefined) updateData.deliveryAddress = deliveryAddress;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, message: "No fields to update" },
        { status: 400 }
      );
    }

    const order = await prisma.order.update({
      where: { id: orderId },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      message: "Order updated successfully",
      order,
    });
  } catch (error) {
    console.error("Order update error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update order. Please try again." },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const orders = await prisma.order.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, orders });
  } catch (error) {
    console.error("Get orders error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch orders." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { orderId } = await request.json();

    if (!orderId) {
      return NextResponse.json(
        { success: false, message: "Order ID is required" },
        { status: 400 }
      );
    }

    const deletedOrder = await prisma.order.delete({
      where: { id: orderId },
    });

    return NextResponse.json({
      success: true,
      message: "Order deleted successfully",
      order: deletedOrder,
    });
  } catch (error) {
    console.error("Order deletion error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete order. Please try again." },
      { status: 500 }
    );
  }
}
