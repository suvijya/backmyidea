"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Share2, Pencil, Flag, Trash2, Archive, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { incrementShareCount, updateIdeaStatus } from "@/actions/idea-actions";
import { ReportModal } from "@/components/shared/report-modal";
import { cn } from "@/lib/utils";

interface IdeaDetailClientProps {
  ideaId: string;
  slug: string;
  isOwnIdea: boolean;
}

export function IdeaDetailClient({
  ideaId,
  slug,
  isOwnIdea,
}: IdeaDetailClientProps) {
  const { isSignedIn } = useAuth();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [reportOpen, setReportOpen] = useState(false);

  const handleShare = async () => {
    const url = `${window.location.origin}/idea/${slug}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Check out this idea on Piqd",
          url,
        });
        incrementShareCount(ideaId).catch(console.error);
      } catch {
        // User cancelled share
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard!");
      incrementShareCount(ideaId).catch(console.error);
    }
  };

  const handleArchive = () => {
    startTransition(async () => {
      const result = await updateIdeaStatus(ideaId, "ARCHIVED");
      if (result.success) {
        toast.success("Idea archived");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  };

  const handleDelete = () => {
    startTransition(async () => {
      const result = await updateIdeaStatus(ideaId, "REMOVED");
      if (result.success) {
        toast.success("Idea deleted");
        router.push("/dashboard/ideas");
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <div className="space-y-2">
      {/* Share */}
      <Button
        variant="outline"
        onClick={handleShare}
        className="w-full gap-2 border-warm-border text-text-secondary hover:bg-warm-hover"
      >
        <Share2 className="h-4 w-4" />
        Share this idea
      </Button>

      {/* Owner actions */}
      {isOwnIdea && (
        <>
          <Link href={`/dashboard/ideas/${ideaId}/edit`} className="block">
            <Button
              variant="outline"
              className="w-full gap-2 border-warm-border text-text-secondary hover:bg-warm-hover"
            >
              <Pencil className="h-4 w-4" />
              Edit idea
            </Button>
          </Link>

          <Button
            variant="outline"
            onClick={handleArchive}
            disabled={isPending}
            className="w-full gap-2 border-warm-border text-text-secondary hover:bg-warm-hover"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Archive className="h-4 w-4" />
            )}
            Archive idea
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                className="w-full gap-2 border-brand-red/30 text-brand-red hover:bg-brand-red-light"
              >
                <Trash2 className="h-4 w-4" />
                Delete idea
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this idea?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. All votes, comments, and data
                  associated with this idea will be permanently removed.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-brand-red text-white hover:bg-brand-red/90"
                >
                  Delete permanently
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}

      {/* Report (for non-owners) */}
      {isSignedIn && !isOwnIdea && (
        <>
          <button
            onClick={() => setReportOpen(true)}
            className="flex w-full items-center justify-center gap-1.5 py-2 text-[12px] text-text-muted transition-colors hover:text-brand-red"
          >
            <Flag className="h-3 w-3" />
            Report this idea
          </button>
          <ReportModal
            entityType="idea"
            entityId={ideaId}
            open={reportOpen}
            onOpenChange={setReportOpen}
          />
        </>
      )}
    </div>
  );
}
