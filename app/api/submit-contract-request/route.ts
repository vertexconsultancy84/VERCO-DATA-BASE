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
        { success: false, error: 'Product ID, tenant name, user name, and user email are required' },
        { status: 400 }
      );
    }

    // Create a new order record acting as a contract request
    const newContract = await prisma.order.create({
      data: {
        productId,
        productTitle: productTitle || "Product",
        productPrice: productPrice || 0,
        userName: tenantName || userName || "Client",
        userEmail: userEmail || "N/A",
        customerPhone: customerPhone || tenantContact || "N/A",
        deliveryAddress: tenantAddress || deliveryAddress || "N/A",
        village: village || "N/A",
        category: category || 'OtherProducts',
        subcategory: subcategory,
        contractFileUrl: contractFileUrl,
        contractUploaded: !!contractFileUrl,
        contractSubmittedAt: new Date(),
        status: 'pending',
        deliveryInstructions: `CONTRACT INFO: Nationality: ${tenantNationality || 'N/A'}, ID: ${tenantID || 'N/A'}, Address: ${tenantAddress || 'N/A'}`,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'contract succesful submited and you will get full asigned contract after payment.',
      contractId: newContract.id,
      contract: newContract,
    });
  } catch (error) {
    console.error('Error submitting contract request:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to submit contract request' },
      { status: 500 }
    );
  }
}
