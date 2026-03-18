import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/clerk";
import { createNotificationInternal } from "@/lib/notifications";

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    if (!user.isEmployee && !user.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { ideaId, action } = await req.json();
    const idea = await prisma.idea.findUnique({ where: { id: ideaId } });
    if (!idea) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const newStatus = action === "approve" ? "ACTIVE" : "REJECTED";
    await prisma.idea.update({ where: { id: ideaId }, data: { status: newStatus } });

    if (action === "approve") {
      await createNotificationInternal({
        userId: idea.founderId,
        type: "SYSTEM",
        title: "Your Piqd!",
        body: "Your idea has been approved and is now live on the platform.",
        data: { ideaSlug: idea.slug }
      });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
