"use server";

import { requireUser } from "@/lib/clerk";
import { prisma } from "@/lib/prisma";
import { dmLimiter } from "@/lib/redis";
import { directMessageSchema } from "@/lib/validations";
import { createNotificationInternal } from "@/lib/notifications";
import { revalidatePath } from "next/cache";

export async function sendDirectMessage(ideaId: string, content: string) {
  try {
    const user = await requireUser();

    // Check rate limit
    const { success } = await dmLimiter.limit(user.id);
    if (!success) {
      return {
        success: false,
        error: "Rate limit exceeded. You can only send 2 direct messages per day.",
      };
    }

    // Validate input
    const parsed = directMessageSchema.safeParse({ ideaId, content });
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    // Find the idea to ensure it exists and we get the founder's ID
    const idea = await prisma.idea.findUnique({
      where: { id: ideaId },
      select: { id: true, founderId: true, title: true, slug: true },
    });

    if (!idea) {
      return { success: false, error: "Idea not found." };
    }

    if (idea.founderId === user.id) {
      return { success: false, error: "You cannot send a direct message to yourself." };
    }

    // Insert direct message
    const message = await (prisma as any).directMessage.create({
      data: {
        content: parsed.data.content,
        userId: user.id,
        ideaId: idea.id,
      },
    });

    // Notify the founder
    await createNotificationInternal({
      userId: idea.founderId,
      type: "NEW_DIRECT_MESSAGE" as any,
      title: "New Private Suggestion",
      body: `${user.username || "Someone"} sent a private suggestion for "${idea.title}"`,
      data: {
        link: `/dashboard/ideas/${idea.id}#messages`,
      },
    }).catch(console.error);

    return { success: true };
  } catch (error: any) {
    console.error("Failed to send direct message:", error);
    return { success: false, error: error.message || "Failed to send message" };
  }
}
