import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/clerk";
import type { ReportStatus } from "@prisma/client";

export async function GET(req: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const status = (searchParams.get("status") ?? "PENDING") as ReportStatus;
  const cursor = searchParams.get("cursor") ?? undefined;

  const reports = await prisma.report.findMany({
    where: { status },
    include: {
      user: {
        select: { id: true, name: true, username: true, image: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 21,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });

  const hasMore = reports.length > 20;
  const items = hasMore ? reports.slice(0, 20) : reports;

  return NextResponse.json({
    reports: items,
    hasMore,
    nextCursor: hasMore ? items[items.length - 1]?.id : null,
  });
}

export async function PATCH(req: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const body = await req.json() as {
    reportId: string;
    status: ReportStatus;
  };

  const report = await prisma.report.update({
    where: { id: body.reportId },
    data: {
      status: body.status,
      resolvedAt: body.status !== "PENDING" ? new Date() : null,
    },
  });

  return NextResponse.json({ report });
}
