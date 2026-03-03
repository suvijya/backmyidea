import { NextResponse } from "next/server";
import { requireUser } from "@/lib/clerk";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    if (!user.isEmployee && !user.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { reportId, action } = await req.json();
    if (!reportId || !action) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const newStatus = action === "resolve" ? "ACTION_TAKEN" : "DISMISSED";

    await prisma.report.update({
      where: { id: reportId },
      data: { status: newStatus, resolvedAt: new Date() }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Employee report action error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
