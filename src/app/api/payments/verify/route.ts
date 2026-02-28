import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { verifyRazorpaySignature } from "@/lib/razorpay";
import { sendDonorConfirmation, sendFounderDonationAlert } from "@/lib/resend";
import { createNotificationInternal } from "@/lib/notifications";
import { z } from "zod";

// ═══════════════════════════════
// REQUEST VALIDATION
// ═══════════════════════════════

const verifySchema = z.object({
  razorpayOrderId: z.string().min(1),
  razorpayPaymentId: z.string().min(1),
  razorpaySignature: z.string().min(1),
  donationId: z.string().min(1),
});

// ═══════════════════════════════
// POST /api/payments/verify
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

    // 2. Parse & validate
    const body: unknown = await req.json();
    const parsed = verifySchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? "Invalid input";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const {
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      donationId,
    } = parsed.data;

    // 3. Fetch donation
    const donation = await prisma.donation.findUnique({
      where: { id: donationId },
      include: {
        donor: {
          select: { id: true, name: true, email: true },
        },
        idea: {
          select: {
            id: true,
            title: true,
            slug: true,
            founderId: true,
            founder: {
              select: { name: true, email: true },
            },
          },
        },
      },
    });

    if (!donation) {
      return NextResponse.json(
        { error: "Donation not found" },
        { status: 404 }
      );
    }

    // 4. Idempotency check — if already COMPLETED, return success
    if (donation.status === "COMPLETED") {
      return NextResponse.json({ success: true, alreadyCompleted: true });
    }

    // 5. Verify order ID matches
    if (donation.razorpayOrderId !== razorpayOrderId) {
      return NextResponse.json(
        { error: "Order ID mismatch" },
        { status: 400 }
      );
    }

    // 6. HMAC signature verification — MANDATORY, never skip
    const isValid = verifyRazorpaySignature({
      orderId: razorpayOrderId,
      paymentId: razorpayPaymentId,
      signature: razorpaySignature,
    });

    if (!isValid) {
      // Mark as FAILED and return error
      await prisma.donation.update({
        where: { id: donationId },
        data: { status: "FAILED" },
      });

      return NextResponse.json(
        { error: "Payment verification failed" },
        { status: 400 }
      );
    }

    // 7. Atomic transaction: update Donation + increment Idea counts
    await prisma.$transaction([
      prisma.donation.update({
        where: { id: donationId },
        data: {
          status: "COMPLETED",
          razorpayPaymentId,
          razorpaySignature,
          completedAt: new Date(),
        },
      }),
      prisma.idea.update({
        where: { id: donation.ideaId },
        data: {
          totalDonations: { increment: donation.amountPaise },
          donorCount: { increment: 1 },
        },
      }),
    ]);

    // 8. Fire-and-forget: emails + notification
    if (donation.donor.email) {
      sendDonorConfirmation({
        donorEmail: donation.donor.email,
        donorName: donation.donor.name,
        ideaTitle: donation.idea.title,
        ideaSlug: donation.idea.slug,
        amountPaise: donation.amountPaise,
      }).catch(console.error);
    }

    if (donation.idea.founder.email) {
      sendFounderDonationAlert({
        founderEmail: donation.idea.founder.email,
        founderName: donation.idea.founder.name,
        donorName: donation.donor.name,
        ideaTitle: donation.idea.title,
        ideaSlug: donation.idea.slug,
        amountPaise: donation.amountPaise,
        isAnonymous: donation.isAnonymous,
      }).catch(console.error);
    }

    const rupees = (donation.amountPaise / 100).toFixed(
      donation.amountPaise % 100 === 0 ? 0 : 2
    );
    const donorDisplay = donation.isAnonymous
      ? "Someone"
      : donation.donor.name;

    createNotificationInternal({
      userId: donation.idea.founderId,
      type: "SYSTEM",
      title: "New donation received!",
      body: `${donorDisplay} donated ₹${rupees} to "${donation.idea.title}"`,
      data: {
        ideaSlug: donation.idea.slug,
        donationId: donation.id,
      },
    }).catch(console.error);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[payments/verify] Error:", error);
    return NextResponse.json(
      { error: "Verification failed" },
      { status: 500 }
    );
  }
}
