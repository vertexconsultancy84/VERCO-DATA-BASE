import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const contracts = await prisma.order.findMany({
      where: {
        contractUploaded: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      success: true,
      contracts: contracts
    });
  } catch (error) {
    console.error("Error fetching contracts:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch contracts" },
      { status: 500 }
    );
  }
}

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

    // Create a new order record acting as a contract
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
      message: 'Contract submitted successfully! Please contact admin to arrange payment.',
      contractId: newContract.id,
      contract: newContract,
    });
  } catch (error) {
    console.error('Error submitting contract:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to submit contract' },
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

    const updatedContract = await prisma.order.update({
      where: { id: contractId },
      data: { 
        status,
        updatedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Contract status updated successfully',
      contract: updatedContract
    });
  } catch (error) {
    console.error('Error updating contract status:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update contract status' },
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

    await prisma.order.delete({
      where: { id: contractId }
    });

    return NextResponse.json({
      success: true,
      message: 'Contract deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting contract:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete contract' },
      { status: 500 }
    );
  }
}
