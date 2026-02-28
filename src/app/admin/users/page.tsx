import { prisma } from "@/lib/prisma";
import { formatDate, formatNumber } from "@/lib/utils";
import { LEVEL_LABELS } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const users = await prisma.user.findMany({
    include: {
      _count: {
        select: {
          ideas: true,
          votes: true,
          comments: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const totalUsers = users.length;
  const bannedCount = users.filter((u) => u.isBanned).length;
  const adminCount = users.filter((u) => u.isAdmin).length;
  const onboardedCount = users.filter((u) => u.onboarded).length;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[28px] font-bold text-deep-ink">Users</h1>
        <p className="mt-1 text-[15px] text-text-secondary">
          View and manage platform users
        </p>
      </div>

      {/* Summary */}
      <div className="mb-6 flex flex-wrap gap-3">
        <SummaryChip label="Total" value={totalUsers} />
        <SummaryChip label="Onboarded" value={onboardedCount} />
        <SummaryChip label="Admins" value={adminCount} accent="blue" />
        <SummaryChip label="Banned" value={bannedCount} accent="red" />
      </div>

      {/* Users Table */}
      <Card className="border-warm-border overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-warm-border bg-warm-subtle">
                  <TableHead className="text-[13px] font-semibold text-text-secondary">
                    User
                  </TableHead>
                  <TableHead className="text-[13px] font-semibold text-text-secondary">
                    Role
                  </TableHead>
                  <TableHead className="text-center text-[13px] font-semibold text-text-secondary">
                    Level
                  </TableHead>
                  <TableHead className="text-center text-[13px] font-semibold text-text-secondary">
                    Points
                  </TableHead>
                  <TableHead className="text-center text-[13px] font-semibold text-text-secondary">
                    Ideas
                  </TableHead>
                  <TableHead className="text-center text-[13px] font-semibold text-text-secondary">
                    Votes
                  </TableHead>
                  <TableHead className="text-[13px] font-semibold text-text-secondary">
                    Joined
                  </TableHead>
                  <TableHead className="text-center text-[13px] font-semibold text-text-secondary">
                    Status
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="py-12 text-center text-[14px] text-text-muted"
                    >
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow
                      key={user.id}
                      className="border-warm-border hover:bg-warm-subtle/50"
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={user.image ?? undefined} />
                            <AvatarFallback className="bg-warm-subtle text-[12px] font-semibold text-text-secondary">
                              {user.name?.charAt(0) ?? "?"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <Link
                              href={
                                user.username
                                  ? `/profile/${user.username}`
                                  : "#"
                              }
                              className="block truncate text-[14px] font-medium text-deep-ink hover:text-saffron transition-colors"
                            >
                              {user.name}
                            </Link>
                            <p className="truncate text-[12px] text-text-muted">
                              {user.username
                                ? `@${user.username}`
                                : user.email ?? "No username"}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-[13px] text-text-secondary capitalize">
                          {user.role.toLowerCase()}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="text-[13px] text-text-secondary">
                          {LEVEL_LABELS[user.level]}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="font-data text-[13px] text-text-secondary">
                          {formatNumber(user.points)}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="font-data text-[13px] text-text-secondary">
                          {user._count.ideas}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="font-data text-[13px] text-text-secondary">
                          {user._count.votes}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-[13px] text-text-muted">
                          {formatDate(user.createdAt)}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {user.isAdmin && (
                            <Badge
                              variant="outline"
                              className="bg-brand-blue-light text-brand-blue border-brand-blue/20 text-[10px]"
                            >
                              Admin
                            </Badge>
                          )}
                          {user.isBanned && (
                            <Badge
                              variant="outline"
                              className="bg-brand-red-light text-brand-red border-brand-red/20 text-[10px]"
                            >
                              Banned
                            </Badge>
                          )}
                          {!user.isAdmin && !user.isBanned && (
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

function SummaryChip({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: "blue" | "red";
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-warm-border bg-white px-4 py-2.5">
      <span className="text-[13px] text-text-secondary">{label}</span>
      <span
        className={`font-data text-[15px] font-medium ${
          accent === "blue"
            ? "text-brand-blue"
            : accent === "red"
              ? "text-brand-red"
              : "text-deep-ink"
        }`}
      >
        {value}
      </span>
    </div>
  );
}
