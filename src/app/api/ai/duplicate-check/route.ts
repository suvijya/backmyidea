import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { checkDuplicateIdea } from "@/lib/gemini";
import { aiLimiter } from "@/lib/redis";
import { z } from "zod";
import { CategoryEnum } from "@/lib/validations";

const checkDuplicateSchema = z.object({
  title: z.string().min(5),
  pitch: z.string().min(10),
  category: CategoryEnum,
});

export async function POST(req: Request) {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { success } = await aiLimiter.limit(clerkId);
  if (!success) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true, onboarded: true },
  });
  if (!user || !user.onboarded) {
    return NextResponse.json({ error: "Complete onboarding first" }, { status: 403 });
  }

  try {
    const json = await req.json();
    const resultParse = checkDuplicateSchema.safeParse(json);
    if (!resultParse.success) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }
    const body = resultParse.data;

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
