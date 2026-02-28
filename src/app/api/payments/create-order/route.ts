import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { donateLimiter } from "@/lib/redis";
import {
  createRazorpayOrder,
  isValidDonationAmount,
} from "@/lib/razorpay";
import { z } from "zod";

// ═══════════════════════════════
// REQUEST VALIDATION
// ═══════════════════════════════

const createOrderSchema = z.object({
  ideaId: z.string().min(1, "Idea ID is required"),
  amountPaise: z.number().int().positive("Amount must be positive"),
  isAnonymous: z.boolean().optional().default(false),
  message: z.string().max(200).optional(),
});

// ═══════════════════════════════
// POST /api/payments/create-order
// ═══════════════════════════════

export async function POST(req: NextRequest) {
  try {
    // 1. Auth
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({ where: { clerkId } });
    if (!user || !user.onboarded) {
      return NextResponse.json(
        { error: "Complete onboarding first" },
        { status: 403 }
      );
    }

    // 2. Rate limit
    const { success: withinLimit } = await donateLimiter.limit(user.id);
    if (!withinLimit) {
      return NextResponse.json(
        { error: "Too many donation attempts. Try again later." },
        { status: 429 }
      );
    }

    // 3. Parse & validate
    const body: unknown = await req.json();
    const parsed = createOrderSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? "Invalid input";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const { ideaId, amountPaise, isAnonymous, message } = parsed.data;

    // 4. Validate amount server-side — NEVER trust client amounts
    if (!isValidDonationAmount(amountPaise)) {
      return NextResponse.json(
        { error: "Invalid donation amount" },
        { status: 400 }
      );
    }

    // 5. Fetch idea — must be ACTIVE + donationsEnabled
    const idea = await prisma.idea.findUnique({
      where: { id: ideaId },
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        donationsEnabled: true,
        founderId: true,
      },
    });

    if (!idea) {
      return NextResponse.json({ error: "Idea not found" }, { status: 404 });
    }

    if (idea.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "This idea is not accepting donations" },
        { status: 400 }
      );
    }

    if (!idea.donationsEnabled) {
      return NextResponse.json(
        { error: "Donations are not enabled for this idea" },
        { status: 400 }
      );
    }

    // NOTE: Founders can donate to their own ideas (no restriction per spec)

    // 6. Create Donation record (PENDING)
    const donation = await prisma.donation.create({
      data: {
        amountPaise,
        isAnonymous,
        message: message || null,
        donorId: user.id,
        ideaId: idea.id,
        status: "PENDING",
      },
    });

    // 7. Create Razorpay order
    const order = await createRazorpayOrder({
      amountPaise,
      receipt: donation.id,
      notes: {
        donationId: donation.id,
        ideaId: idea.id,
        donorId: user.id,
        ideaTitle: idea.title,
      },
    });

    // 8. Update donation with razorpayOrderId
    await prisma.donation.update({
      where: { id: donation.id },
      data: { razorpayOrderId: order.id },
    });

    return NextResponse.json({
      orderId: order.id,
      donationId: donation.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error("[payments/create-order] Error:", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}
