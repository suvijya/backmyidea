import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { usernameSchema } from "@/lib/validations";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const username = searchParams.get("username");

  if (!username) {
    return NextResponse.json(
      { available: false, error: "Username is required" },
      { status: 400 }
    );
  }

  const parsed = usernameSchema.safeParse(username);
  if (!parsed.success) {
    const error = parsed.error.issues[0]?.message ?? "Invalid username";
    return NextResponse.json({ available: false, error }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({
    where: { username: parsed.data },
    select: { id: true },
  });

  return NextResponse.json({
    available: !existing,
    username: parsed.data,
  });
}
