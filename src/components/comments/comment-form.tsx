"use client";

import { useState, useTransition } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { createComment } from "@/actions/comment-actions";
import { MAX_COMMENT_LENGTH } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface CommentFormProps {
  ideaId: string;
  parentId?: string;
  placeholder?: string;
  onSubmit?: () => void;
  autoFocus?: boolean;
  className?: string;
}

export function CommentForm({
  ideaId,
  parentId,
  placeholder = "Share your thoughts...",
  onSubmit,
  autoFocus = false,
  className,
}: CommentFormProps) {
  const { isSignedIn } = useAuth();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [content, setContent] = useState("");

  const handleSubmit = () => {
    if (!isSignedIn) {
      router.push("/sign-in");
      return;
    }

    if (!content.trim()) return;

    startTransition(async () => {
      const fd = new FormData();
      fd.append("ideaId", ideaId);
      fd.append("content", content.trim());
      if (parentId) fd.append("parentId", parentId);

      const result = await createComment(fd);
      if (result.success) {
        setContent("");
        onSubmit?.();
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <div className={cn("space-y-2", className)}>
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        maxLength={MAX_COMMENT_LENGTH}
        placeholder={placeholder}
        autoFocus={autoFocus}
        rows={3}
        className="resize-none border-warm-border input-focus-ring"
      />
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-text-muted">
          {content.length}/{MAX_COMMENT_LENGTH}
        </span>
        <Button
          onClick={handleSubmit}
          disabled={isPending || !content.trim()}
          size="sm"
          className="gap-1.5 bg-saffron text-white hover:bg-saffron-dark disabled:opacity-50"
        >
          {isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Send className="h-3.5 w-3.5" />
          )}
          Comment
        </Button>
      </div>
    </div>
  );
}
