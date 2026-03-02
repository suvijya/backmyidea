import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { checkIdeaQuality } from "@/lib/gemini";
import { aiLimiter } from "@/lib/redis";
import { z } from "zod";
import { CategoryEnum } from "@/lib/validations";

const checkQualitySchema = z.object({
  title: z.string().min(5),
  pitch: z.string().min(10),
  problem: z.string().min(20),
  solution: z.string().min(20),
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
    const resultParse = checkQualitySchema.safeParse(json);
    if (!resultParse.success) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }
    const body = resultParse.data;

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
