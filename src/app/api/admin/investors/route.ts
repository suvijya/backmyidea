import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/clerk";
import type { Prisma } from "@prisma/client";
import { z } from "zod";

const querySchema = z.object({
  status: z.enum(["all", "PENDING", "APPROVED", "REJECTED"]).default("PENDING"),
});

function isRedirectError(error: unknown): boolean {
  return (
    error instanceof Error &&
    "digest" in error &&
    typeof (error as Record<string, unknown>).digest === "string" &&
    ((error as Record<string, unknown>).digest as string).includes("NEXT_REDIRECT")
  );
}

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = request.nextUrl;
    const parseResult = querySchema.safeParse({
      status: searchParams.get("status") || undefined,
    });

    if (!parseResult.success) {
      return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
    }

    const { status } = parseResult.data;

    const where: Prisma.InvestorRequestWhereInput = {};
    if (status !== "all") {
      where.status = status;
    }

    const requests = await prisma.investorRequest.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            email: true,
            image: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ requests });
  } catch (error) {
    if (isRedirectError(error)) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }
    console.error("[ADMIN_INVESTORS] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
