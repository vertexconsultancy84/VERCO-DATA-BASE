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
      contractFileUrl,
    } = await request.json();

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
      message: 'Contract submitted successfully. You will receive the signed contract after payment.',
      contractId: newContract.id,
      contract: newContract,
    });
  } catch (error) {
    console.error('Error submitting contract request:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
