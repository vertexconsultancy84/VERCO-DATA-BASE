import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";
    const userAgent = req.headers.get("user-agent") || "";
    const page = body.page || "/";
    const referrer = body.referrer || "";

    await prisma.siteVisitor.create({
      data: { ip, userAgent, page, referrer },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

export async function GET() {
  try {
    const visitors = await prisma.siteVisitor.findMany({
      orderBy: { createdAt: "desc" },
      take: 500,
    });
    return NextResponse.json({ success: true, visitors });
  } catch {
    return NextResponse.json({ success: false, visitors: [] }, { status: 500 });
  }
}
