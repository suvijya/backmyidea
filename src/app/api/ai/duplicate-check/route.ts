import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { checkDuplicateIdea } from "@/lib/gemini";

export async function POST(req: Request) {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true, onboarded: true },
  });
  if (!user || !user.onboarded) {
    return NextResponse.json({ error: "Complete onboarding first" }, { status: 403 });
  }

  try {
    const body = await req.json() as {
      title: string;
      pitch: string;
      category: string;
    };

    // Fetch existing ideas in the same category for comparison
    const existingIdeas = await prisma.idea.findMany({
      where: { status: "ACTIVE", category: body.category as never },
      select: { id: true, title: true, slug: true, pitch: true },
      take: 50,
      orderBy: { totalVotes: "desc" },
    });

    const result = await checkDuplicateIdea(
      body.title,
      body.pitch,
      existingIdeas
    );

    // AI fails open
    return NextResponse.json({ result });
  } catch {
    return NextResponse.json({ result: null });
  }
}
