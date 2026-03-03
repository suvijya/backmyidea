"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Search,
  Lightbulb,
  Loader2,
  Archive,
  Trash2,
  RotateCcw,
  ExternalLink,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { formatDate, formatNumber } from "@/lib/utils";
import { CATEGORY_LABELS } from "@/lib/constants";
import type { IdeaStatus, Category } from "@prisma/client";

type AdminIdea = {
  id: string;
  slug: string;
  title: string;
  pitch: string;
  category: Category;
  status: IdeaStatus;
  totalVotes: number;
  validationScore: number;
  isSpam: boolean;
  isDuplicate: boolean;
  createdAt: string;
  founder: {
    id: string;
    name: string;
    username: string | null;
    isBanned: boolean;
  };
};

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: "bg-brand-green-light text-brand-green border-brand-green/20",
  DRAFT: "bg-warm-subtle text-text-muted border-warm-border",
  ARCHIVED: "bg-brand-amber-light text-brand-amber border-brand-amber/20",
  REMOVED: "bg-brand-red-light text-brand-red border-brand-red/20",
};

const STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "ACTIVE", label: "Active" },
  { value: "DRAFT", label: "Draft" },
  { value: "ARCHIVED", label: "Archived" },
  { value: "REMOVED", label: "Removed" },
];

export function IdeasClient() {
  const [ideas, setIdeas] = useState<AdminIdea[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  // Confirmation dialog state
  const [confirmAction, setConfirmAction] = useState<{
    ideaId: string;
    ideaTitle: string;
    newStatus: IdeaStatus;
  } | null>(null);

  const fetchIdeas = useCallback(
    async (append = false) => {
      try {
        if (!append) setLoading(true);
        const params = new URLSearchParams();
        if (search) params.set("search", search);
        if (statusFilter !== "all") params.set("status", statusFilter);
        if (append && cursor) params.set("cursor", cursor);

        const res = await fetch(`/api/admin/ideas?${params.toString()}`);
        if (!res.ok) throw new Error("Failed to fetch ideas");

        const data = (await res.json()) as {
          ideas: AdminIdea[];
          hasMore: boolean;
          nextCursor: string | null;
        };

        if (append) {
          setIdeas((prev) => [...prev, ...data.ideas]);
        } else {
          setIdeas(data.ideas);
        }
        setHasMore(data.hasMore);
        setCursor(data.nextCursor);
      } catch {
        toast.error("Failed to load ideas");
      } finally {
        setLoading(false);
      }
    },
    [statusFilter, search, cursor]
  );

  useEffect(() => {
    setCursor(null);
    const timeout = setTimeout(() => {
      fetchIdeas();
    }, search ? 300 : 0);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, search]);

  async function handleStatusChange(ideaId: string, newStatus: IdeaStatus) {
    setActionInProgress(ideaId);
    setConfirmAction(null);
    try {
      const res = await fetch("/api/admin/ideas", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ideaId, status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to update idea");

      setIdeas((prev) =>
        prev.map((i) => (i.id === ideaId ? { ...i, status: newStatus } : i))
      );
      toast.success(`Idea status changed to ${newStatus.toLowerCase()}`);
    } catch {
      toast.error("Failed to update idea status");
    } finally {
      setActionInProgress(null);
    }
  }

  function getAvailableActions(idea: AdminIdea): { label: string; status: IdeaStatus; icon: typeof Archive; variant: "default" | "destructive" }[] {
    const actions: { label: string; status: IdeaStatus; icon: typeof Archive; variant: "default" | "destructive" }[] = [];

    if (idea.status !== "ACTIVE") {
      actions.push({ label: "Restore", status: "ACTIVE", icon: RotateCcw, variant: "default" });
    }
    if (idea.status !== "ARCHIVED") {
      actions.push({ label: "Archive", status: "ARCHIVED", icon: Archive, variant: "default" });
    }
    if (idea.status !== "REMOVED") {
      actions.push({ label: "Remove", status: "REMOVED", icon: Trash2, variant: "destructive" });
    }

    return actions;
  }

  // Counts by status
  const statusCounts = {
    ACTIVE: ideas.filter((i) => i.status === "ACTIVE").length,
    DRAFT: ideas.filter((i) => i.status === "DRAFT").length,
    ARCHIVED: ideas.filter((i) => i.status === "ARCHIVED").length,
    REMOVED: ideas.filter((i) => i.status === "REMOVED").length,
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[28px] font-bold text-deep-ink">Ideas</h1>
        <p className="mt-1 text-[15px] text-text-secondary">
          Browse and manage all ideas on the platform
        </p>
      </div>

      {/* Search + Filters */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <Input
            placeholder="Search by title or slug..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 border-warm-border"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px] border-warm-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Status Summary */}
      <div className="mb-6 flex flex-wrap gap-3">
        {(
          Object.entries(statusCounts) as [IdeaStatus, number][]
        ).map(([status, count]) => (
          <div
            key={status}
            className="flex items-center gap-2 rounded-lg border border-warm-border bg-white px-4 py-2.5"
          >
            <Badge
              variant="outline"
              className={`text-[11px] ${STATUS_STYLES[status]}`}
            >
              {status}
            </Badge>
            <span className="font-data text-[15px] font-medium text-deep-ink">
              {count}
            </span>
          </div>
        ))}
      </div>

      {loading ? (
        <Card className="border-warm-border">
          <CardContent className="p-0">
            <div className="space-y-0">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 border-b border-warm-border px-4 py-3"
                >
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-72" />
                  </div>
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-8 w-20" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : ideas.length === 0 ? (
        <div className="rounded-xl border border-warm-border bg-white py-16 text-center">
          <Lightbulb className="mx-auto mb-3 h-10 w-10 text-text-disabled" />
          <p className="text-[15px] font-medium text-text-secondary">
            No ideas found
          </p>
          <p className="mt-1 text-[13px] text-text-muted">
            {search
              ? "Try a different search term"
              : "No ideas match the current filter"}
          </p>
        </div>
      ) : (
        <>
          <Card className="border-warm-border overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-warm-border bg-warm-subtle">
                      <TableHead className="text-[13px] font-semibold text-text-secondary">
                        Idea
                      </TableHead>
                      <TableHead className="text-[13px] font-semibold text-text-secondary">
                        Founder
                      </TableHead>
                      <TableHead className="text-[13px] font-semibold text-text-secondary">
                        Category
                      </TableHead>
                      <TableHead className="text-center text-[13px] font-semibold text-text-secondary">
                        Status
                      </TableHead>
                      <TableHead className="text-center text-[13px] font-semibold text-text-secondary">
                        Score
                      </TableHead>
                      <TableHead className="text-center text-[13px] font-semibold text-text-secondary">
                        Votes
                      </TableHead>
                      <TableHead className="text-[13px] font-semibold text-text-secondary">
                        Created
                      </TableHead>
                      <TableHead className="text-center text-[13px] font-semibold text-text-secondary">
                        AI
                      </TableHead>
                      <TableHead className="text-center text-[13px] font-semibold text-text-secondary">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ideas.map((idea) => {
                      const actions = getAvailableActions(idea);
                      return (
                        <TableRow
                          key={idea.id}
                          className="border-warm-border hover:bg-warm-subtle/50"
                        >
                          <TableCell className="max-w-[280px]">
                            <Link
                              href={`/idea/${idea.slug}`}
                              className="flex items-center gap-1 text-[14px] font-medium text-deep-ink hover:text-saffron transition-colors line-clamp-2"
                            >
                              {idea.title}
                              <ExternalLink className="h-3 w-3 shrink-0 opacity-50" />
                            </Link>
                            <p className="mt-0.5 text-[12px] text-text-muted line-clamp-1">
                              {idea.pitch}
                            </p>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              <Link
                                href={`/profile/${idea.founder.username}`}
                                className="text-[13px] text-text-secondary hover:text-saffron transition-colors"
                              >
                                @
                                {idea.founder.username ?? idea.founder.name}
                              </Link>
                              {idea.founder.isBanned && (
                                <Badge
                                  variant="outline"
                                  className="bg-brand-red-light text-brand-red border-brand-red/20 text-[9px] px-1"
                                >
                                  Banned
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-[13px] text-text-secondary">
                              {CATEGORY_LABELS[idea.category]}
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge
                              variant="outline"
                              className={`text-[11px] ${STATUS_STYLES[idea.status]}`}
                            >
                              {idea.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="font-data text-[14px] font-medium text-deep-ink">
                              {idea.totalVotes >= 10
                                ? idea.validationScore
                                : "--"}
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="font-data text-[14px] text-text-secondary">
                              {formatNumber(idea.totalVotes)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="text-[13px] text-text-muted">
                              {formatDate(idea.createdAt)}
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1">
                              {idea.isSpam && (
                                <span
                                  title="Flagged as spam"
                                  className="inline-block h-2 w-2 rounded-full bg-brand-red"
                                />
                              )}
                              {idea.isDuplicate && (
                                <span
                                  title="Possible duplicate"
                                  className="inline-block h-2 w-2 rounded-full bg-brand-amber"
                                />
                              )}
                              {!idea.isSpam && !idea.isDuplicate && (
                                <span className="inline-block h-2 w-2 rounded-full bg-brand-green" />
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            {actionInProgress === idea.id ? (
                              <Loader2 className="mx-auto h-4 w-4 animate-spin text-text-muted" />
                            ) : actions.length > 0 ? (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 text-[12px] border-warm-border"
                                  >
                                    Actions
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  {actions.map((action) => (
                                    <DropdownMenuItem
                                      key={action.status}
                                      onClick={() => {
                                        if (action.status === "REMOVED") {
                                          setConfirmAction({
                                            ideaId: idea.id,
                                            ideaTitle: idea.title,
                                            newStatus: action.status,
                                          });
                                        } else {
                                          handleStatusChange(
                                            idea.id,
                                            action.status
                                          );
                                        }
                                      }}
                                      className={
                                        action.variant === "destructive"
                                          ? "text-brand-red focus:text-brand-red"
                                          : ""
                                      }
                                    >
                                      <action.icon className="mr-2 h-4 w-4" />
                                      {action.label}
                                    </DropdownMenuItem>
                                  ))}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            ) : null}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {hasMore && (
            <div className="mt-4 text-center">
              <Button
                variant="outline"
                className="border-warm-border"
                onClick={() => fetchIdeas(true)}
              >
                Load More Ideas
              </Button>
            </div>
          )}
        </>
      )}

      {/* Remove Confirmation Dialog */}
      <AlertDialog
        open={!!confirmAction}
        onOpenChange={(open) => !open && setConfirmAction(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this idea?</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction && (
                <>
                  <strong>&ldquo;{confirmAction.ideaTitle}&rdquo;</strong> will
                  be marked as removed and hidden from public feeds. This can be
                  reversed later.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-warm-border">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                confirmAction &&
                handleStatusChange(confirmAction.ideaId, confirmAction.newStatus)
              }
              className="bg-brand-red hover:bg-brand-red/90"
            >
              Yes, Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
