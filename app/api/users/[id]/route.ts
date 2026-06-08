import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json(
      { success: false, message: "User ID is required" },
      { status: 400 }
    );
  }

  try {
    // Orders referencing this user's products are cascade-deleted via Product → Order.
    // ProductMedia is also cascade-deleted via Product → ProductMedia.
    // We just need to delete the User; Prisma handles the rest via onDelete: Cascade.
    await prisma.user.delete({ where: { id } });

    return NextResponse.json({
      success: true,
      message: "User and all associated data deleted successfully.",
    });
  } catch (error: any) {
    console.error("Error deleting user:", error);
    // P2025 = record not found
    if (error?.code === "P2025") {
      return NextResponse.json(
        { success: false, message: "User not found." },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { success: false, message: "Failed to delete user." },
      { status: 500 }
    );
  }
}
