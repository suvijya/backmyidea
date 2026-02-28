import { prisma } from "@/lib/prisma";
import { CATEGORY_LABELS, STAGE_LABELS, SCORE_TIER_LABELS } from "@/lib/constants";
import { formatDate, formatNumber } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from "next/link";
import type { IdeaStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

const STATUS_STYLES: Record<IdeaStatus, string> = {
  ACTIVE: "bg-brand-green-light text-brand-green border-brand-green/20",
  DRAFT: "bg-warm-subtle text-text-muted border-warm-border",
  ARCHIVED: "bg-brand-amber-light text-brand-amber border-brand-amber/20",
  REMOVED: "bg-brand-red-light text-brand-red border-brand-red/20",
};

export default async function AdminIdeasPage() {
  const ideas = await prisma.idea.findMany({
    include: {
      founder: {
        select: { id: true, name: true, username: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

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

      {/* Status Summary */}
      <div className="mb-6 flex flex-wrap gap-3">
        {(Object.entries(statusCounts) as [IdeaStatus, number][]).map(
          ([status, count]) => (
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
          )
        )}
      </div>

      {/* Ideas Table */}
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {ideas.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="py-12 text-center text-[14px] text-text-muted"
                    >
                      No ideas found
                    </TableCell>
                  </TableRow>
                ) : (
                  ideas.map((idea) => (
                    <TableRow
                      key={idea.id}
                      className="border-warm-border hover:bg-warm-subtle/50"
                    >
                      <TableCell className="max-w-[280px]">
                        <Link
                          href={`/idea/${idea.slug}`}
                          className="text-[14px] font-medium text-deep-ink hover:text-saffron transition-colors line-clamp-2"
                        >
                          {idea.title}
                        </Link>
                        <p className="mt-0.5 text-[12px] text-text-muted line-clamp-1">
                          {idea.pitch}
                        </p>
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/profile/${idea.founder.username}`}
                          className="text-[13px] text-text-secondary hover:text-saffron transition-colors"
                        >
                          @{idea.founder.username ?? idea.founder.name}
                        </Link>
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
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
