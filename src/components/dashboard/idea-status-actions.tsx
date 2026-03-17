"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  MoreHorizontal,
  Pencil,
  Archive,
  RotateCcw,
  ExternalLink,
  Trash2,
  Loader2,
  LineChart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { updateIdeaStatus } from "@/actions/idea-actions";
import type { IdeaStatus } from "@prisma/client";

interface IdeaStatusActionsProps {
  ideaId: string;
  slug: string;
  status: IdeaStatus;
}

export function IdeaStatusActions({ ideaId, slug, status }: IdeaStatusActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleStatusChange = (newStatus: IdeaStatus) => {
    startTransition(async () => {
      const result = await updateIdeaStatus(ideaId, newStatus);
      if (result.success) {
        const messages: Record<string, string> = {
          ARCHIVED: "Idea archived",
          ACTIVE: "Idea reactivated",
          REMOVED: "Idea deleted",
        };
        toast.success(messages[newStatus] ?? "Status updated");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-text-muted hover:text-deep-ink"
          disabled={isPending}
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <MoreHorizontal className="h-4 w-4" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem asChild>
          <Link href={`/dashboard/ideas/${ideaId}`} className="flex items-center gap-2">
            <LineChart className="h-3.5 w-3.5" />
            View dashboard
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link href={`/idea/${slug}`} className="flex items-center gap-2">
            <ExternalLink className="h-3.5 w-3.5" />
            View public page
          </Link>
        </DropdownMenuItem>

        {status === "ACTIVE" && (
          <DropdownMenuItem asChild>
            <Link
              href={`/dashboard/ideas/${ideaId}/edit`}
              className="flex items-center gap-2"
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit idea
            </Link>
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />

        {status === "ACTIVE" && (
          <DropdownMenuItem
            onClick={() => handleStatusChange("ARCHIVED")}
            className="flex items-center gap-2"
          >
            <Archive className="h-3.5 w-3.5" />
            Archive
          </DropdownMenuItem>
        )}

        {status === "ARCHIVED" && (
          <DropdownMenuItem
            onClick={() => handleStatusChange("ACTIVE")}
            className="flex items-center gap-2"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reactivate
          </DropdownMenuItem>
        )}

        <DropdownMenuItem
          onClick={() => handleStatusChange("REMOVED")}
          className="flex items-center gap-2 text-brand-red focus:text-brand-red"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
