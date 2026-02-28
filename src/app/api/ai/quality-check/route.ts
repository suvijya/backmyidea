import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { checkIdeaQuality } from "@/lib/gemini";

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
      problem: string;
      solution: string;
      category: string;
    };

    const result = await checkIdeaQuality({
      title: body.title,
      pitch: body.pitch,
      problem: body.problem,
      solution: body.solution,
      category: body.category,
    });

    // AI fails open — return null result, not an error
    return NextResponse.json({ result });
  } catch {
    return NextResponse.json({ result: null });
  }
}
