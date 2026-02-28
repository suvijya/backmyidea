"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/types";
import type { Donation } from "@prisma/client";

// ═══════════════════════════════
// TOGGLE DONATIONS ON/OFF
// ═══════════════════════════════

export async function toggleDonations(
  ideaId: string,
  enabled: boolean
): Promise<ActionResult> {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return { success: false, error: "Not authenticated" };
  }

  const user = await prisma.user.findUnique({ where: { clerkId } });
  if (!user || !user.onboarded) {
    return { success: false, error: "Complete onboarding first" };
  }

  const idea = await prisma.idea.findUnique({ where: { id: ideaId } });
  if (!idea) {
    return { success: false, error: "Idea not found" };
  }

  if (idea.founderId !== user.id) {
    return { success: false, error: "You can only manage your own ideas" };
  }

  if (idea.status !== "ACTIVE") {
    return { success: false, error: "Donations can only be enabled on active ideas" };
  }

  await prisma.idea.update({
    where: { id: ideaId },
    data: { donationsEnabled: enabled },
  });

  revalidatePath(`/idea/${idea.slug}`);
  revalidatePath("/dashboard/ideas");
  revalidatePath(`/dashboard/ideas/${ideaId}`);

  return { success: true, data: undefined };
}

// ═══════════════════════════════
// GET DONATION STATS (for founder dashboard)
// ═══════════════════════════════

export type DonationStats = {
  totalRaisedPaise: number;
  donorCount: number;
  recentDonations: (Pick<
    Donation,
    "id" | "amountPaise" | "isAnonymous" | "message" | "completedAt"
  > & {
    donor: { name: string; image: string | null };
  })[];
};

/** NOTE: This is not a mutation, but a server action for convenience.
 *  Only the idea's founder can access this. */
export async function getDonationStats(
  ideaId: string
): Promise<ActionResult<DonationStats>> {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return { success: false, error: "Not authenticated" };
  }

  const user = await prisma.user.findUnique({ where: { clerkId } });
  if (!user) {
    return { success: false, error: "User not found" };
  }

  const idea = await prisma.idea.findUnique({
    where: { id: ideaId },
    select: { founderId: true, totalDonations: true, donorCount: true },
  });
  if (!idea) {
    return { success: false, error: "Idea not found" };
  }

  if (idea.founderId !== user.id) {
    return { success: false, error: "Not authorized" };
  }

  const recentDonations = await prisma.donation.findMany({
    where: { ideaId, status: "COMPLETED" },
    select: {
      id: true,
      amountPaise: true,
      isAnonymous: true,
      message: true,
      completedAt: true,
      donor: {
        select: { name: true, image: true },
      },
    },
    orderBy: { completedAt: "desc" },
    take: 20,
  });

  return {
    success: true,
    data: {
      totalRaisedPaise: idea.totalDonations,
      donorCount: idea.donorCount,
      recentDonations: recentDonations as DonationStats["recentDonations"],
    },
  };
}

// ═══════════════════════════════
// GET PUBLIC DONORS (supporter wall)
// ═══════════════════════════════

export type PublicDonor = {
  id: string;
  amountPaise: number;
  isAnonymous: boolean;
  message: string | null;
  completedAt: Date | null;
  donor: { name: string; username: string | null; image: string | null };
};

export async function getPublicDonors(
  ideaId: string,
  limit = 10
): Promise<PublicDonor[]> {
  const donations = await prisma.donation.findMany({
    where: { ideaId, status: "COMPLETED" },
    select: {
      id: true,
      amountPaise: true,
      isAnonymous: true,
      message: true,
      completedAt: true,
      donor: {
        select: { name: true, username: true, image: true },
      },
    },
    orderBy: { completedAt: "desc" },
    take: limit,
  });

  return donations as PublicDonor[];
}
