"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { commentLimiter, upvoteLimiter } from "@/lib/redis";
import { createCommentSchema } from "@/lib/validations";
import { createNotificationInternal } from "@/lib/notifications";
import { awardPoints, checkAndAwardBadges, updateUserLevel } from "@/lib/gamification";
import { trackDailyStat } from "@/lib/daily-stats";
import type { ActionResult, CommentWithReplies, CommentWithAuthor } from "@/types";
import type { Comment } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { COMMENTS_PAGE_SIZE } from "@/lib/constants";

// ═══════════════════════════════
// CREATE COMMENT
// ═══════════════════════════════

export async function createComment(
  formData: FormData
): Promise<ActionResult<Comment>> {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return { success: false, error: "Not authenticated" };
  }

  const user = await prisma.user.findUnique({ where: { clerkId } });
  if (!user || !user.onboarded) {
    return { success: false, error: "Complete onboarding first" };
  }

  // Rate limit
  const { success: withinLimit } = await commentLimiter.limit(user.id);
  if (!withinLimit) {
    return { success: false, error: "Too many comments. Try again later." };
  }

  const raw = {
    ideaId: formData.get("ideaId") as string,
    content: formData.get("content") as string,
    parentId: (formData.get("parentId") as string) || undefined,
  };

  const parsed = createCommentSchema.safeParse(raw);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "Invalid input";
    return { success: false, error: firstError };
  }

  const { ideaId, content, parentId } = parsed.data;

  // Check idea exists and is active
  const idea = await prisma.idea.findUnique({
    where: { id: ideaId },
    select: { id: true, founderId: true, slug: true, title: true, status: true },
  });
  if (!idea || idea.status !== "ACTIVE") {
    return { success: false, error: "Idea not found or not active" };
  }

  // Handle reply depth: max 1 level. If replying to a reply, attach to grandparent.
  let resolvedParentId = parentId;
  if (parentId) {
    const parentComment = await prisma.comment.findUnique({
      where: { id: parentId },
      select: { id: true, parentId: true, userId: true },
    });
    if (!parentComment) {
      return { success: false, error: "Parent comment not found" };
    }
    // If replying to a reply, use grandparent
    if (parentComment.parentId) {
      resolvedParentId = parentComment.parentId;
    }
  }

  // Atomic: create comment + increment cached count
  const [comment] = await prisma.$transaction([
    prisma.comment.create({
      data: {
        userId: user.id,
        ideaId,
        content,
        parentId: resolvedParentId ?? null,
      },
    }),
    prisma.idea.update({
      where: { id: ideaId },
      data: { totalComments: { increment: 1 } },
    }),
  ]);

  // Fire-and-forget gamification + daily stats
  awardPoints(user.id, "COMMENT").catch(console.error);
  checkAndAwardBadges(user.id).catch(console.error);
  updateUserLevel(user.id).catch(console.error);
  trackDailyStat(ideaId, "comments").catch(console.error);

  // Notifications (fire-and-forget)
  // Notify idea founder about new comment
  if (idea.founderId !== user.id) {
    createNotificationInternal({
      userId: idea.founderId,
      type: "NEW_COMMENT",
      title: "New comment on your idea",
      body: `${user.name} commented on "${idea.title}"`,
      data: { ideaId, ideaSlug: idea.slug, commentId: comment.id },
    }).catch(console.error);
  }

  // If replying, notify the parent comment author
  if (resolvedParentId) {
    const parentComment = await prisma.comment.findUnique({
      where: { id: resolvedParentId },
      select: { userId: true },
    });
    if (parentComment && parentComment.userId !== user.id) {
      createNotificationInternal({
        userId: parentComment.userId,
        type: "COMMENT_REPLY",
        title: "New reply to your comment",
        body: `${user.name} replied to your comment on "${idea.title}"`,
        data: { ideaId, ideaSlug: idea.slug, commentId: comment.id },
      }).catch(console.error);
    }
  }

  revalidatePath(`/idea/${idea.slug}`);
  return { success: true, data: comment };
}

// ═══════════════════════════════
// GET COMMENTS FOR IDEA
// ═══════════════════════════════

const commentAuthorSelect = {
  id: true,
  name: true,
  username: true,
  image: true,
} as const;

export async function getComments(
  ideaId: string,
  cursor?: string
): Promise<{ comments: CommentWithReplies[]; nextCursor?: string; hasMore: boolean }> {
  // Get top-level comments with replies
  const comments = await prisma.comment.findMany({
    where: {
      ideaId,
      parentId: null,
      isHidden: false,
    },
    include: {
      user: { select: commentAuthorSelect },
      _count: { select: { upvotes: true } },
      replies: {
        where: { isHidden: false },
        include: {
          user: { select: commentAuthorSelect },
          _count: { select: { upvotes: true } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: [
      { isPinned: "desc" },
      { createdAt: "desc" },
    ],
    take: COMMENTS_PAGE_SIZE + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });

  const hasMore = comments.length > COMMENTS_PAGE_SIZE;
  const items = hasMore ? comments.slice(0, COMMENTS_PAGE_SIZE) : comments;
  const nextCursor = hasMore ? items[items.length - 1]?.id : undefined;

  return { comments: items, nextCursor, hasMore };
}

// ═══════════════════════════════
// PIN / UNPIN COMMENT (founder only)
// ═══════════════════════════════

export async function togglePinComment(
  commentId: string
): Promise<ActionResult> {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return { success: false, error: "Not authenticated" };
  }

  const user = await prisma.user.findUnique({ where: { clerkId } });
  if (!user) {
    return { success: false, error: "User not found" };
  }

  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    include: { idea: { select: { founderId: true, slug: true } } },
  });
  if (!comment) {
    return { success: false, error: "Comment not found" };
  }

  // Only the idea founder can pin/unpin
  if (comment.idea.founderId !== user.id) {
    return { success: false, error: "Only the idea founder can pin comments" };
  }

  await prisma.comment.update({
    where: { id: commentId },
    data: { isPinned: !comment.isPinned },
  });

  revalidatePath(`/idea/${comment.idea.slug}`);
  return { success: true, data: undefined };
}

// ═══════════════════════════════
// HIDE / UNHIDE COMMENT (founder only)
// ═══════════════════════════════

export async function toggleHideComment(
  commentId: string
): Promise<ActionResult> {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return { success: false, error: "Not authenticated" };
  }

  const user = await prisma.user.findUnique({ where: { clerkId } });
  if (!user) {
    return { success: false, error: "User not found" };
  }

  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    include: { idea: { select: { founderId: true, slug: true } } },
  });
  if (!comment) {
    return { success: false, error: "Comment not found" };
  }

  if (comment.idea.founderId !== user.id && !user.isAdmin) {
    return { success: false, error: "Not authorized" };
  }

  await prisma.comment.update({
    where: { id: commentId },
    data: { isHidden: !comment.isHidden },
  });

  revalidatePath(`/idea/${comment.idea.slug}`);
  return { success: true, data: undefined };
}

// ═══════════════════════════════
// UPVOTE COMMENT
// ═══════════════════════════════

export async function upvoteComment(
  commentId: string
): Promise<ActionResult> {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return { success: false, error: "Not authenticated" };
  }

  const user = await prisma.user.findUnique({ where: { clerkId } });
  if (!user || !user.onboarded) {
    return { success: false, error: "Complete onboarding first" };
  }

  // Rate limit
  const { success: withinLimit } = await upvoteLimiter.limit(user.id);
  if (!withinLimit) {
    return { success: false, error: "Too many upvotes. Try again later." };
  }

  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    select: { id: true, userId: true },
  });
  if (!comment) {
    return { success: false, error: "Comment not found" };
  }

  // Check if already upvoted
  const existing = await prisma.commentUpvote.findUnique({
    where: { userId_commentId: { userId: user.id, commentId } },
  });

  if (existing) {
    // Toggle off
    await prisma.$transaction([
      prisma.commentUpvote.delete({ where: { id: existing.id } }),
      prisma.comment.update({
        where: { id: commentId },
        data: { upvoteCount: { decrement: 1 } },
      }),
    ]);
  } else {
    // Toggle on
    await prisma.$transaction([
      prisma.commentUpvote.create({
        data: { userId: user.id, commentId },
      }),
      prisma.comment.update({
        where: { id: commentId },
        data: { upvoteCount: { increment: 1 } },
      }),
    ]);

    // Award points to comment author (fire-and-forget)
    if (comment.userId !== user.id) {
      awardPoints(comment.userId, "COMMENT_UPVOTED").catch(console.error);
      updateUserLevel(comment.userId).catch(console.error);
      checkAndAwardBadges(comment.userId).catch(console.error);
    }
  }

  return { success: true, data: undefined };
}
