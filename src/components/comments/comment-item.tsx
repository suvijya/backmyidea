"use client";

import { useState, useTransition, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  ThumbsUp,
  Reply,
  Pin,
  EyeOff,
  MoreHorizontal,
  Loader2,
  Flag,
  Trash2,
  Edit2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { CommentForm } from "@/components/comments/comment-form";
import { ReportModal } from "@/components/shared/report-modal";
import { upvoteComment, togglePinComment, toggleHideComment, deleteComment, editComment } from "@/actions/comment-actions";
import { timeAgo } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { CommentWithAuthor } from "@/types";

interface CommentItemProps {
  comment: CommentWithAuthor;
  ideaId: string;
  ideaFounderId: string;
  currentUserId: string | null;
  isReply?: boolean;
  isAdminOrEmployee?: boolean;
  onDeleted?: () => void;
}

export function CommentItem({
  comment,
  ideaId,
  ideaFounderId,
  currentUserId,
  isReply = false,
  isAdminOrEmployee = false,
  onDeleted,
}: CommentItemProps) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [upvotes, setUpvotes] = useState(comment._count.upvotes);
  const [hasUpvoted, setHasUpvoted] = useState(false);

  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [now, setNow] = useState(Date.now());

  // Update time for the 15-min check periodically
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(interval);
  }, []);

  const isFounder = currentUserId === ideaFounderId;
  const isAuthor = currentUserId === comment.user.id;
  const commentTime = new Date(comment.createdAt).getTime();
  const canEdit = isAuthor && (now - commentTime < 15 * 60 * 1000);
  const isEdited = comment.updatedAt && new Date(comment.updatedAt).getTime() > commentTime + 1000;

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

  const handleDelete = () => {
    if (!confirm("Are you sure you want to delete this comment?")) return;
    startTransition(async () => {
      const result = await deleteComment(comment.id);
      if (result.success) {
        toast.success("Comment deleted");
        onDeleted?.();
      } else {
        toast.error(result.error || "Failed to delete comment");
      }
    });
  };

  const handleEditSubmit = () => {
    const trimmed = editContent.trim();
    if (!trimmed || trimmed === comment.content) {
      setIsEditing(false);
      return;
    }
    
    startTransition(async () => {
      const result = await editComment(comment.id, trimmed);
      if (result.success) {
        setIsEditing(false);
        toast.success("Comment updated");
      } else {
        toast.error(result.error || "Failed to update comment");
      }
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
              {isEdited ? " (edited)" : ""}
            </span>
          </div>

          {/* Content */}
          {isEditing ? (
            <div className="mt-2 space-y-2">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full rounded-md border border-warm-border bg-white px-3 py-2 text-sm focus:border-brand-amber focus:outline-none focus:ring-1 focus:ring-brand-amber"
                rows={3}
                disabled={isPending}
                autoFocus
              />
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={handleEditSubmit} disabled={isPending || !editContent.trim()}>
                  {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save
                </Button>
                <Button variant="ghost" size="sm" onClick={() => { setIsEditing(false); setEditContent(comment.content); }} disabled={isPending}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <p className="mt-1 text-[14px] leading-relaxed text-text-secondary whitespace-pre-wrap break-words">
              {comment.content}
            </p>
          )}

          {/* Actions */}
          {!isEditing && (
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

              {/* Menu actions */}
              {(isFounder || isAdminOrEmployee || isAuthor || (currentUserId && currentUserId !== comment.user.id)) && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="rounded p-0.5 text-text-muted opacity-0 transition-opacity hover:bg-warm-hover group-hover:opacity-100">
                      <MoreHorizontal className="h-3.5 w-3.5" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    {canEdit && (
                      <DropdownMenuItem onClick={() => setIsEditing(true)}>
                        <Edit2 className="mr-2 h-3.5 w-3.5" />
                        Edit
                      </DropdownMenuItem>
                    )}
                    {isAuthor && (
                      <DropdownMenuItem onClick={handleDelete} className="text-brand-red">
                        <Trash2 className="mr-2 h-3.5 w-3.5" />
                        Delete
                      </DropdownMenuItem>
                    )}
                    {isFounder && (
                      <>
                        <DropdownMenuItem onClick={handlePin}>
                          <Pin className="mr-2 h-3.5 w-3.5" />
                          {comment.isPinned ? "Unpin" : "Pin"}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleHide}>
                          <EyeOff className="mr-2 h-3.5 w-3.5" />
                          Hide
                        </DropdownMenuItem>
                      </>
                    )}
                    {(isAuthor || isFounder) && (currentUserId !== comment.user.id || isAdminOrEmployee || currentUserId && currentUserId !== comment.user.id) && <DropdownMenuSeparator />}
                    
                    {currentUserId && currentUserId !== comment.user.id && (
                      <DropdownMenuItem onClick={() => setShowReportModal(true)}>
                        <Flag className="mr-2 h-3.5 w-3.5 text-brand-red" />
                        Report Spam
                      </DropdownMenuItem>
                    )}
                    {isAdminOrEmployee && !isAuthor && (
                      <>
                        {currentUserId !== comment.user.id && <DropdownMenuSeparator />}
                        <DropdownMenuItem onClick={handleDelete} className="text-brand-red">
                          <Trash2 className="mr-2 h-3.5 w-3.5" />
                          Delete (Admin/Employee)
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          )}
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

      {/* Report Modal */}
      {showReportModal && (
        <ReportModal
          entityType="comment"
          entityId={comment.id}
          open={showReportModal}
          onOpenChange={setShowReportModal}
        />
      )}
    </div>
  );
}
