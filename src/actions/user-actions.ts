"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { onboardingSchema, updateProfileSchema } from "@/lib/validations";
import type { ActionResult, UserProfile, DashboardStats, DashboardIdea } from "@/types";
import type { User } from "@prisma/client";
import { revalidatePath } from "next/cache";

// ═══════════════════════════════
// ONBOARDING
// ═══════════════════════════════

export async function completeOnboarding(
  formData: FormData
): Promise<ActionResult<User>> {
  const clerkUser = await currentUser();
  if (!clerkUser) {
    return { success: false, error: "Not authenticated" };
  }
  const clerkId = clerkUser.id;

  const raw = {
    username: formData.get("username") as string,
    role: formData.get("role") as string,
    bio: formData.get("bio") as string,
    city: formData.get("city") as string,
    state: formData.get("state") as string,
    college: formData.get("college") as string,
    company: formData.get("company") as string,
    linkedinUrl: formData.get("linkedinUrl") as string,
  };

  const parsed = onboardingSchema.safeParse(raw);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "Invalid input";
    return { success: false, error: firstError };
  }

  const { username, role, bio, city, state, college, company, linkedinUrl } = parsed.data;

  // Check username uniqueness
  const existingUsername = await prisma.user.findUnique({ where: { username } });
  if (existingUsername && existingUsername.clerkId !== clerkId) {
    return { success: false, error: "Username is already taken" };
  }

  // Find or Create user (Just-in-time sync if webhook failed/wasn't set up)
  const existingUser = await prisma.user.findUnique({ where: { clerkId } });
  
  if (existingUser?.onboarded) {
    return { success: false, error: "Already onboarded" };
  }

  let updatedUser: User;

  if (existingUser) {
    updatedUser = await prisma.user.update({
      where: { clerkId },
      data: {
        username,
        role: role as User["role"],
        bio: bio || null,
        city: city || null,
        state: state || null,
        college: college || null,
        company: company || null,
        linkedinUrl: linkedinUrl || null,
        onboarded: true,
      },
    });
  } else {
    // Just-in-time creation
    const email = clerkUser.emailAddresses[0]?.emailAddress ?? null;
    const name = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || "User";
    
    updatedUser = await prisma.user.create({
      data: {
        clerkId,
        name,
        email,
        image: clerkUser.imageUrl,
        username,
        role: role as User["role"],
        bio: bio || null,
        city: city || null,
        state: state || null,
        college: college || null,
        company: company || null,
        linkedinUrl: linkedinUrl || null,
        onboarded: true,
      },
    });
  }

  revalidatePath("/dashboard");
  return { success: true, data: updatedUser };
}

// ═══════════════════════════════
// UPDATE PROFILE
// ═══════════════════════════════

export async function updateProfile(
  formData: FormData
): Promise<ActionResult<User>> {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return { success: false, error: "Not authenticated" };
  }

  const user = await prisma.user.findUnique({ where: { clerkId } });
  if (!user || !user.onboarded) {
    return { success: false, error: "User not found or not onboarded" };
  }

  const raw = {
    name: formData.get("name") as string,
    bio: formData.get("bio") as string,
    city: formData.get("city") as string,
    state: formData.get("state") as string,
    college: formData.get("college") as string,
    company: formData.get("company") as string,
    linkedinUrl: formData.get("linkedinUrl") as string,
    role: formData.get("role") as string,
  };

  const parsed = updateProfileSchema.safeParse(raw);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "Invalid input";
    return { success: false, error: firstError };
  }

  const { name, bio, city, state, college, company, linkedinUrl, role } = parsed.data;

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      name,
      bio: bio || null,
      city: city || null,
      state: state || null,
      college: college || null,
      company: company || null,
      linkedinUrl: linkedinUrl || null,
      ...(role && { role }),
    },
  });

  revalidatePath(`/profile/${user.username}`);
  revalidatePath("/dashboard/settings");
  return { success: true, data: updated };
}

// ═══════════════════════════════
// GET USER PROFILE (public)
// ═══════════════════════════════

export async function getUserProfile(
  username: string
): Promise<ActionResult<UserProfile>> {
  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      name: true,
      username: true,
      image: true,
      bio: true,
      city: true,
      state: true,
      college: true,
      company: true,
      linkedinUrl: true,
      role: true,
      points: true,
      level: true,
      currentStreak: true,
      longestStreak: true,
      createdAt: true,
      _count: {
        select: {
          ideas: true,
          votes: true,
          comments: true,
        },
      },
      badges: {
        include: { badge: true },
        orderBy: { earnedAt: "desc" },
      },
    },
  });

  if (!user) {
    return { success: false, error: "User not found" };
  }

  return { success: true, data: user };
}

// ═══════════════════════════════
// DASHBOARD STATS
// ═══════════════════════════════

export async function getDashboardStats(
  userId: string
): Promise<DashboardStats> {
  const ideas = await prisma.idea.findMany({
    where: { founderId: userId, status: { not: "REMOVED" } },
    select: {
      totalVotes: true,
      totalComments: true,
      validationScore: true,
    },
  });

  const totalIdeas = ideas.length;
  const totalVotesReceived = ideas.reduce((sum, i) => sum + i.totalVotes, 0);
  const totalCommentsReceived = ideas.reduce((sum, i) => sum + i.totalComments, 0);
  const averageScore =
    totalIdeas > 0
      ? Math.round(
          ideas.reduce((sum, i) => sum + i.validationScore, 0) / totalIdeas
        )
      : 0;

  return {
    totalIdeas,
    totalVotesReceived,
    totalCommentsReceived,
    averageScore,
  };
}

// ═══════════════════════════════
// DASHBOARD IDEAS LIST
// ═══════════════════════════════

export async function getDashboardIdeas(
  userId: string
): Promise<DashboardIdea[]> {
  const ideas = await prisma.idea.findMany({
    where: { founderId: userId, status: { not: "REMOVED" } },
    select: {
      id: true,
      slug: true,
      title: true,
      status: true,
      totalVotes: true,
      totalComments: true,
      validationScore: true,
      scoreTier: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return ideas;
}
