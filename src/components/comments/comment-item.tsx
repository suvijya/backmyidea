"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import {
  ThumbsUp,
  Reply,
  Pin,
  EyeOff,
  MoreHorizontal,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CommentForm } from "@/components/comments/comment-form";
import { upvoteComment, togglePinComment, toggleHideComment } from "@/actions/comment-actions";
import { timeAgo } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { CommentWithAuthor } from "@/types";

interface CommentItemProps {
  comment: CommentWithAuthor;
  ideaId: string;
  ideaFounderId: string;
  isReply?: boolean;
}

export function CommentItem({
  comment,
  ideaId,
  ideaFounderId,
  isReply = false,
}: CommentItemProps) {
  const { userId } = useAuth();
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [upvotes, setUpvotes] = useState(comment._count.upvotes);
  const [hasUpvoted, setHasUpvoted] = useState(false);

  const isFounder = userId === ideaFounderId;

  const handleUpvote = () => {
    const prevUpvotes = upvotes;
    const prevHasUpvoted = hasUpvoted;
    
    // Optimistic update
    setUpvotes(hasUpvoted ? upvotes - 1 : upvotes + 1);
    setHasUpvoted(!hasUpvoted);

    startTransition(async () => {
      const result = await upvoteComment(comment.id);
      if (!result.success) {
        setUpvotes(prevUpvotes);
        setHasUpvoted(prevHasUpvoted);
      }
    });
  };

  const handlePin = () => {
    startTransition(async () => {
      await togglePinComment(comment.id);
    });
  };

  const handleHide = () => {
    startTransition(async () => {
      await toggleHideComment(comment.id);
    });
  };

  return (
    <div className={cn("group", isReply && "ml-10 border-l-2 border-warm-border pl-4")}>
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <Link
          href={`/profile/${comment.user.username ?? ""}`}
          className="flex-shrink-0"
        >
          <div className="h-7 w-7 overflow-hidden rounded-full bg-warm-subtle">
            {comment.user.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={comment.user.image}
                alt={comment.user.name ?? "User"}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-[11px] font-semibold text-text-secondary">
                {comment.user.name?.charAt(0) ?? "U"}
              </div>
            )}
          </div>
        </Link>

        <div className="flex-1 min-w-0">
          {/* Name + time */}
          <div className="flex items-center gap-2">
            <Link
              href={`/profile/${comment.user.username ?? ""}`}
              className="text-[13px] font-semibold text-deep-ink hover:underline"
            >
              {comment.user.name}
            </Link>
            {comment.user.id === ideaFounderId && (
              <span className="rounded-full bg-saffron-light px-1.5 py-0.5 text-[10px] font-medium text-saffron">
                Founder
              </span>
            )}
            {comment.isPinned && (
              <Pin className="h-3 w-3 text-brand-amber" />
            )}
            <span className="text-[12px] text-text-muted">
              {timeAgo(comment.createdAt)}
            </span>
          </div>

          {/* Content */}
          <p className="mt-1 text-[14px] leading-relaxed text-text-secondary">
            {comment.content}
          </p>

          {/* Actions */}
          <div className="mt-1.5 flex items-center gap-3">
            <button
              onClick={handleUpvote}
              disabled={isPending}
              className={cn(
                "flex items-center gap-1 text-[12px] transition-colors",
                hasUpvoted
                  ? "text-saffron"
                  : "text-text-muted hover:text-deep-ink"
              )}
            >
              <ThumbsUp className="h-3.5 w-3.5" />
              {upvotes > 0 && <span className="font-data">{upvotes}</span>}
            </button>

            {!isReply && (
              <button
                onClick={() => setShowReplyForm(!showReplyForm)}
                className="flex items-center gap-1 text-[12px] text-text-muted transition-colors hover:text-deep-ink"
              >
                <Reply className="h-3.5 w-3.5" />
                Reply
              </button>
            )}

            {/* Founder actions */}
            {isFounder && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="rounded p-0.5 text-text-muted opacity-0 transition-opacity hover:bg-warm-hover group-hover:opacity-100">
                    <MoreHorizontal className="h-3.5 w-3.5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem onClick={handlePin}>
                    <Pin className="mr-2 h-3.5 w-3.5" />
                    {comment.isPinned ? "Unpin" : "Pin"}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleHide}>
                    <EyeOff className="mr-2 h-3.5 w-3.5" />
                    Hide
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>

      {/* Reply form */}
      {showReplyForm && (
        <div className="ml-10 mt-3">
          <CommentForm
            ideaId={ideaId}
            parentId={comment.id}
            placeholder={`Reply to ${comment.user.name}...`}
            autoFocus
            onSubmit={() => setShowReplyForm(false)}
          />
        </div>
      )}
    </div>
  );
}
