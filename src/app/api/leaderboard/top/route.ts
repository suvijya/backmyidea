import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 120;

export async function GET() {
  try {
    const topValidatorRaw = await prisma.user.findFirst({
      orderBy: { points: "desc" },
      where: { onboarded: true, isBanned: false },
      select: {
        name: true,
        username: true,
        image: true,
        level: true,
        _count: { select: { votes: true } },
      },
    });

    if (!topValidatorRaw) {
      return NextResponse.json({ data: null });
    }

    const data = {
      name: topValidatorRaw.name,
      username: topValidatorRaw.username || "",
      image: topValidatorRaw.image,
      level: topValidatorRaw.level,
      reviewCount: topValidatorRaw._count.votes,
    };

    return NextResponse.json({ data });
  } catch (error) {
    console.error("Error fetching top validator:", error);
    return NextResponse.json({ data: null }, { status: 500 });
  }
}
