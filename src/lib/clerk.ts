import "server-only";
import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import { prisma } from "./prisma";
import type { User } from "@prisma/client";
import { cache } from "react";
import { unstable_cache } from "next/cache";

/**
 * Get the current Prisma user from Clerk session.
 * Returns null if not authenticated or user not found in DB.
 */
export const getCurrentUser = cache(async (): Promise<User | null> => {
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { clerkId },
  });

  return user;
});

/**
 * Require an authenticated and onboarded user.
 * Redirects to /sign-in if not authenticated,
 * redirects to /onboarding if not onboarded.
 */
export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/sign-in");
  }

  if (!user.onboarded) {
    redirect("/onboarding");
  }

  return user;
}

/**
 * Require an admin user.
 * Redirects to / if not admin.
 */
export async function requireAdmin(): Promise<User> {
  const user = await requireUser();

  if (!user.isAdmin) {
    notFound();
  }

  return user;
}

export const getCachedUserPermissions = unstable_cache(
  async (clerkId: string) => {
    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true, name: true, username: true, createdAt: true, isAdmin: true, isEmployee: true, onboarded: true, investorProfile: { select: { id: true } } },
    });
    return user;
  },
  ["user-permissions"],
  { revalidate: 300 } // Cache for 5 minutes
);

export async function canUserViewGlobalScores(): Promise<boolean> {
  const { userId: clerkId } = await auth();
  if (!clerkId) return false;
  
  const user = await getCachedUserPermissions(clerkId);
  
  if (!user) return false;
  if (user.isAdmin || user.isEmployee) return true;
  return !!user.investorProfile;
}
