import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const contracts = await prisma.contract.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ success: true, contracts });
  } catch (error) {
    console.error("Error fetching contracts:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch contracts", error: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
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
      contractFileUrl,
    } = body;

    if (!productId || !tenantName || !userName || !userEmail) {
      return NextResponse.json(
        { success: false, error: 'Product ID, tenant name, user name, and user email are required' },
        { status: 400 }
      );
    }

    const newContract = await prisma.contract.create({
      data: {
        productId,
        productTitle: productTitle || "Product",
        productPrice: productPrice || 0,
        tenantName,
        tenantNationality: tenantNationality || null,
        tenantID: tenantID || null,
        tenantAddress: tenantAddress || null,
        tenantContact: tenantContact || null,
        userName,
        userEmail,
        customerPhone: customerPhone || null,
        deliveryAddress: deliveryAddress || null,
        village: village || null,
        category: category || 'OtherProducts',
        subcategory: subcategory || null,
        contractFileUrl: contractFileUrl || null,
        status: 'pending',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Contract submitted successfully.',
      contractId: newContract.id,
      contract: newContract,
    });
  } catch (error) {
    console.error('Error submitting contract:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { contractId, status } = await request.json();
    if (!contractId || !status) {
      return NextResponse.json(
        { success: false, error: 'Contract ID and status are required' },
        { status: 400 }
      );
    }
    const updated = await prisma.contract.update({
      where: { id: contractId },
      data: { status, updatedAt: new Date() },
    });
    return NextResponse.json({ success: true, contract: updated });
  } catch (error) {
    console.error('Error updating contract:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const contractId = searchParams.get('id');
    if (!contractId) {
      return NextResponse.json(
        { success: false, error: 'Contract ID is required' },
        { status: 400 }
      );
    }
    await prisma.contract.delete({ where: { id: contractId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting contract:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
