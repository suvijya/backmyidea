"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Search,
  ShieldBan,
  ShieldCheck,
  Users as UsersIcon,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  MoreVertical,
  UserPlus,
  UserMinus,
} from "lucide-react";
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
import { toast } from "sonner";
import { formatDate, formatNumber } from "@/lib/utils";
import { LEVEL_LABELS } from "@/lib/constants";
import type { UserLevel, UserRole } from "@prisma/client";

type AdminUser = {
  id: string;
  name: string;
  email: string | null;
  image: string | null;
  username: string | null;
  role: UserRole;
  level: UserLevel;
  points: number;
  isAdmin: boolean;
  isEmployee: boolean;
  isBanned: boolean;
  onboarded: boolean;
  createdAt: string;
  _count: {
    ideas: number;
    votes: number;
    comments: number;
  };
};

const FILTER_OPTIONS = [
  { value: "all", label: "All Users" },
  { value: "onboarded", label: "Onboarded" },
  { value: "admin", label: "Admins" },
  { value: "banned", label: "Banned" },
];

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);

  const fetchUsers = useCallback(
    async (append = false) => {
      try {
        if (!append) setLoading(true);
        const params = new URLSearchParams({ filter });
        if (search) params.set("search", search);
        if (append && cursor) params.set("cursor", cursor);

        const res = await fetch(`/api/admin/users?${params.toString()}`);
        if (!res.ok) throw new Error("Failed to fetch users");

        const data = (await res.json()) as {
          users: AdminUser[];
          hasMore: boolean;
          nextCursor: string | null;
          total: number;
        };

        if (append) {
          setUsers((prev) => [...prev, ...data.users]);
        } else {
          setUsers(data.users);
        }
        setHasMore(data.hasMore);
        setCursor(data.nextCursor);
        setTotal(data.total);
      } catch {
        toast.error("Failed to load users");
      } finally {
        setLoading(false);
      }
    },
    [filter, search, cursor]
  );

  useEffect(() => {
    setCursor(null);
    const timeout = setTimeout(() => {
      fetchUsers();
    }, search ? 300 : 0); // Debounce search
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, search]);

  async function handleAction(userId: string, action: string) {
    setActionInProgress(userId);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action }),
      });
      if (!res.ok) {
        const data = await res.json() as { error: string };
        throw new Error(data.error || "Failed");
      }

      setUsers((prev) =>
        prev.map((u) => {
          if (u.id === userId) {
            if (action === "ban") return { ...u, isBanned: true };
            if (action === "unban") return { ...u, isBanned: false };
            if (action === "make_admin") return { ...u, isAdmin: true };
            if (action === "remove_admin") return { ...u, isAdmin: false };
            if (action === "make_employee") return { ...u, isEmployee: true };
            if (action === "remove_employee") return { ...u, isEmployee: false };
          }
          return u;
        })
      );
      toast.success("Action completed successfully");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update user");
    } finally {
      setActionInProgress(null);
    }
  }

  async function handleBanToggle(userId: string, ban: boolean) {
    setActionInProgress(userId);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action: ban ? "ban" : "unban" }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error: string };
        throw new Error(data.error || "Failed");
      }

      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, isBanned: ban } : u))
      );
      toast.success(ban ? "User banned" : "User unbanned");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update user"
      );
    } finally {
      setActionInProgress(null);
    }
  }

  const bannedCount = users.filter((u) => u.isBanned).length;
  const adminCount = users.filter((u) => u.isAdmin).length;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[28px] font-bold text-deep-ink">Users</h1>
        <p className="mt-1 text-[15px] text-text-secondary">
          View and manage platform users
        </p>
      </div>

      {/* Search + Filters */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <Input
            placeholder="Search by name, username, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 border-warm-border"
          />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-full border-warm-border sm:w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FILTER_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Summary */}
      <div className="mb-6 flex flex-wrap gap-3">
        <SummaryChip label="Showing" value={total} />
        <SummaryChip label="Admins" value={adminCount} accent="blue" />
        <SummaryChip label="Banned" value={bannedCount} accent="red" />
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
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-8 w-20" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : users.length === 0 ? (
        <div className="rounded-xl border border-warm-border bg-white py-16 text-center">
          <UsersIcon className="mx-auto mb-3 h-10 w-10 text-text-disabled" />
          <p className="text-[15px] font-medium text-text-secondary">
            No users found
          </p>
          <p className="mt-1 text-[13px] text-text-muted">
            {search
              ? "Try a different search term"
              : "No users match the current filter"}
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
                      <TableHead className="text-center text-[13px] font-semibold text-text-secondary">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow
                        key={user.id}
                        className="border-warm-border hover:bg-warm-subtle/50"
                      >
                          <TableCell className="max-w-[240px] sm:max-w-none">
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
                                className="flex items-center gap-1 text-[14px] font-medium text-deep-ink hover:text-saffron transition-colors"
                              >
                                <span className="truncate">{user.name}</span>
                                <ExternalLink className="h-3 w-3 shrink-0 opacity-0 group-hover:opacity-100" />
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
                            {user.isEmployee && !user.isAdmin && (
                              <Badge
                                variant="outline"
                                className="bg-saffron-light text-saffron border-saffron/20 text-[10px]"
                              >
                                Employee
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
                        <TableCell className="text-center">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" disabled={actionInProgress === user.id}>
                                {actionInProgress === user.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreVertical className="h-4 w-4" />}
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              {!user.isAdmin && (
                                <DropdownMenuItem onClick={() => handleAction(user.id, "make_admin")}>
                                  <UserPlus className="mr-2 h-4 w-4" /> Make Admin
                                </DropdownMenuItem>
                              )}
                              {user.isAdmin && (
                                <DropdownMenuItem onClick={() => handleAction(user.id, "remove_admin")} className="text-brand-red">
                                  <UserMinus className="mr-2 h-4 w-4" /> Remove Admin
                                </DropdownMenuItem>
                              )}
                              {!user.isEmployee && !user.isAdmin && (
                                <DropdownMenuItem onClick={() => handleAction(user.id, "make_employee")}>
                                  <UserPlus className="mr-2 h-4 w-4" /> Make Employee
                                </DropdownMenuItem>
                              )}
                              {user.isEmployee && !user.isAdmin && (
                                <DropdownMenuItem onClick={() => handleAction(user.id, "remove_employee")}>
                                  <UserMinus className="mr-2 h-4 w-4" /> Remove Employee
                                </DropdownMenuItem>
                              )}
                              {!user.isAdmin && (
                                <DropdownMenuItem onClick={() => handleAction(user.id, user.isBanned ? "unban" : "ban")} className={user.isBanned ? "text-brand-green" : "text-brand-red"}>
                                  {user.isBanned ? <ShieldCheck className="mr-2 h-4 w-4" /> : <ShieldBan className="mr-2 h-4 w-4" />}
                                  {user.isBanned ? "Unban User" : "Ban User"}
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
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
                onClick={() => fetchUsers(true)}
              >
                Load More Users
              </Button>
            </div>
          )}
        </>
      )}
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
