import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { signStoredCloudinaryUrl } from '@/lib/cloudinary';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const download = request.nextUrl.searchParams.get('download') === '1';

    const order = await prisma.order.findUnique({
      where: { id },
      select: { contractFileUrl: true, contractUploaded: true },
    });

    if (!order?.contractUploaded || !order.contractFileUrl) {
      return NextResponse.json({ error: 'Contract file not found' }, { status: 404 });
    }

    const signed = signStoredCloudinaryUrl(order.contractFileUrl, {
      attachment: download,
    });
    const target = signed ?? order.contractFileUrl;

    return NextResponse.redirect(target);
  } catch (error) {
    console.error('Contract view redirect error:', error);
    return NextResponse.json({ error: 'Failed to open contract' }, { status: 500 });
  }
}
