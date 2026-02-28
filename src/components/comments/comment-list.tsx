"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, MessageSquare } from "lucide-react";
import { CommentForm } from "@/components/comments/comment-form";
import { CommentItem } from "@/components/comments/comment-item";
import { getComments } from "@/actions/comment-actions";
import type { CommentWithReplies } from "@/types";
import { cn } from "@/lib/utils";

interface CommentListProps {
  ideaId: string;
  ideaFounderId: string;
  totalComments: number;
  className?: string;
}

export function CommentList({
  ideaId,
  ideaFounderId,
  totalComments,
  className,
}: CommentListProps) {
  const [comments, setComments] = useState<CommentWithReplies[]>([]);
  const [cursor, setCursor] = useState<string | undefined>();
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const loadedRef = useRef(false);

  const loadComments = useCallback(async (loadCursor?: string) => {
    setIsLoading(true);
    try {
      const result = await getComments(ideaId, loadCursor);
      if (loadCursor) {
        setComments((prev) => [...prev, ...result.comments]);
      } else {
        setComments(result.comments);
      }
      setCursor(result.nextCursor);
      setHasMore(result.hasMore);
    } catch {
      // Silently fail
    } finally {
      setIsLoading(false);
    }
  }, [ideaId]);

  useEffect(() => {
    if (!loadedRef.current) {
      loadedRef.current = true;
      loadComments();
    }
  }, [loadComments]);

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center gap-2">
        <MessageSquare className="h-5 w-5 text-deep-ink" />
        <h3 className="text-[17px] font-bold text-deep-ink">
          Comments ({totalComments})
        </h3>
      </div>

      {/* Comment form */}
      <CommentForm
        ideaId={ideaId}
        onSubmit={() => loadComments()}
      />

      {/* Comments list */}
      <div className="space-y-5">
        {comments.map((comment) => (
          <div key={comment.id} className="space-y-3">
            <CommentItem
              comment={comment}
              ideaId={ideaId}
              ideaFounderId={ideaFounderId}
            />
            {/* Replies */}
            {comment.replies.map((reply) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                ideaId={ideaId}
                ideaFounderId={ideaFounderId}
                isReply
              />
            ))}
          </div>
        ))}
      </div>

      {/* Load more */}
      {isLoading && (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-4 w-4 animate-spin text-text-muted" />
        </div>
      )}

      {hasMore && !isLoading && comments.length > 0 && (
        <button
          onClick={() => loadComments(cursor)}
          className="w-full rounded-lg border border-warm-border py-2.5 text-[13px] font-medium text-text-secondary transition-colors hover:bg-warm-hover"
        >
          Load more comments
        </button>
      )}

      {!isLoading && comments.length === 0 && (
        <p className="py-8 text-center text-[14px] text-text-muted">
          No comments yet. Be the first to share your thoughts!
        </p>
      )}
    </div>
  );
}
