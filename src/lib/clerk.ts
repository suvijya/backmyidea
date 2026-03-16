import "server-only";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "./prisma";
import type { User } from "@prisma/client";
import { cookies } from "next/headers";

/**
 * Get the current Prisma user from Clerk session.
 * Returns null if not authenticated or user not found in DB.
 */
export async function getCurrentUser(): Promise<User | null> {
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { clerkId },
  });

  return user;
}

/**
 * Require an authenticated and onboarded user.
 * Redirects to /sign-in if not authenticated,
 * redirects to /onboarding if not onboarded.
 */
export async function requireUser(): Promise<User> {
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    redirect("/sign-in");
  }

  const user = await prisma.user.findUnique({
    where: { clerkId },
  });

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
    redirect("/");
  }

  return user;
}

export async function canUserViewGlobalScores(): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;
  if (user.isAdmin || user.isEmployee) return true;
  
  const investorProfile = await prisma.investorProfile.findUnique({
    where: { userId: user.id },
  });
  
  return !!investorProfile;
}
