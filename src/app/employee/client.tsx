"use client";

import { useState } from "react";
import Link from "next/link";
import { ExternalLink, Check, X, Loader2, Lightbulb } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";
import { CATEGORY_LABELS } from "@/lib/constants";

export function EmployeeDashboardClient({ initialIdeas }: { initialIdeas: any[] }) {
  const [ideas, setIdeas] = useState(initialIdeas);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  async function handleAction(id: string, action: "approve" | "reject") {
    setActionInProgress(id);
    try {
      const res = await fetch("/api/employee/ideas", {
        method: "POST",
        body: JSON.stringify({ ideaId: id, action }),
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error();
      setIdeas(ideas.filter((i) => i.id !== id));
      toast.success(action === "approve" ? "Idea approved!" : "Idea rejected");
    } catch {
      toast.error("Action failed");
    } finally {
      setActionInProgress(null);
    }
  }

  if (ideas.length === 0) {
    return (
      <div className="rounded-xl border border-warm-border bg-white py-16 text-center shadow-sm">
        <Lightbulb className="mx-auto mb-3 h-10 w-10 text-text-disabled" />
        <p className="text-[15px] font-medium text-text-secondary">
          No pending ideas found
        </p>
        <p className="mt-1 text-[13px] text-text-muted">
          All caught up! There are no ideas waiting for review.
        </p>
      </div>
    );
  }

  return (
    <Card className="border-warm-border overflow-hidden shadow-sm bg-white">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-warm-border bg-warm-subtle">
                <TableHead className="w-[240px] text-[13px] font-semibold text-text-secondary sm:w-[300px]">
                  Idea
                </TableHead>
                <TableHead className="text-[13px] font-semibold text-text-secondary">
                  Founder
                </TableHead>
                <TableHead className="text-[13px] font-semibold text-text-secondary">
                  Category
                </TableHead>
                <TableHead className="text-[13px] font-semibold text-text-secondary">
                  Submitted
                </TableHead>
                <TableHead className="text-right text-[13px] font-semibold text-text-secondary">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ideas.map((idea) => (
                <TableRow
                  key={idea.id}
                  className="border-warm-border hover:bg-warm-subtle/50"
                >
                  <TableCell className="max-w-[240px] sm:max-w-[300px]">
                    <Link
                      href={`/idea/${idea.slug}`}
                      target="_blank"
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
                    <Link
                      href={`/profile/${idea.founder.username}`}
                      target="_blank"
                      className="text-[13px] text-text-secondary hover:text-saffron transition-colors"
                    >
                      @{idea.founder.username ?? idea.founder.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <span className="text-[13px] text-text-secondary">
                      {CATEGORY_LABELS[idea.category as keyof typeof CATEGORY_LABELS]}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-[13px] text-text-muted">
                      {formatDate(idea.createdAt)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    {actionInProgress === idea.id ? (
                      <Loader2 className="ml-auto h-4 w-4 animate-spin text-text-muted" />
                    ) : (
                      <div className="flex items-center justify-end gap-1.5 sm:gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 border-brand-red/20 text-brand-red hover:bg-brand-red-light focus:ring-brand-red"
                          onClick={() => handleAction(idea.id, "reject")}
                        >
                          <X className="mr-1 h-3.5 w-3.5" />
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          className="h-8 bg-brand-green text-white hover:bg-brand-green/90 focus:ring-brand-green"
                          onClick={() => handleAction(idea.id, "approve")}
                        >
                          <Check className="mr-1 h-3.5 w-3.5" />
                          Approve
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
