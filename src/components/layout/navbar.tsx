"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useUser, useClerk } from "@clerk/nextjs";
import { useDbUser } from "@/components/providers";
import {
  Menu,
  Search,
  Plus,
  LayoutDashboard,
  User,
  Settings,
  LogOut,
  Compass,
  Trophy,
  TrendingUp,
  Shield,
  ClipboardCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NotificationBell } from "@/components/layout/notification-bell";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/explore", label: "Explore", icon: Compass },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { href: "/investor/apply", label: "For Investors", icon: TrendingUp },
] as const;

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isSignedIn, user } = useUser();
  const { signOut } = useClerk();
  const [mobileOpen, setMobileOpen] = useState(false);
  const dbUser = useDbUser();

  const profileHref = dbUser?.username ? `/profile/${dbUser.username}` : "/dashboard";

  // Don't show navbar on onboarding
  if (pathname === "/onboarding") return null;

  const handleSignOut = async () => {
    await signOut(() => router.push("/"));
  };

  const userAvatar = (
    <div className="h-8 w-8 overflow-hidden rounded-full border border-warm-border transition-all hover:border-warm-border-strong hover:shadow-sm">
      {user?.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={user.imageUrl}
          alt={user.fullName ?? "Profile"}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-warm-subtle text-xs font-semibold text-text-secondary">
          {user?.firstName?.charAt(0) ?? "U"}
        </div>
      )}
    </div>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b border-warm-border bg-white/95 backdrop-blur-sm">
      <nav className="mx-auto flex h-[60px] max-w-[1440px] items-center justify-between px-4 lg:px-8">
        {/* ── Left: Logo ── */}
        <Link
          href="/"
          className="flex items-center gap-2 transition-opacity hover:opacity-80"
        >
          <span className="font-display text-[20px] tracking-tight text-deep-ink">
            Piqd
          </span>
        </Link>

        {/* ── Center: Desktop Nav Links ── */}
        <div className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => {
            const isActive = pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "relative px-3.5 py-2 text-[13px] font-medium transition-colors",
                  isActive
                    ? "text-deep-ink"
                    : "text-text-secondary hover:text-deep-ink"
                )}
              >
                {link.label}
                {isActive && (
                  <span className="absolute bottom-0 left-3.5 right-3.5 h-[2px] rounded-full bg-saffron" />
                )}
              </Link>
            );
          })}
        </div>

        {/* ── Right: Actions ── */}
        <div className="flex items-center gap-2">
          {/* Search icon — desktop & mobile */}
          <Link
            href="/search"
            prefetch={true}
            className="rounded-md p-2 text-text-secondary transition-colors hover:bg-warm-hover hover:text-deep-ink flex"
          >
            <Search className="h-[18px] w-[18px]" />
          </Link>

          {isSignedIn ? (
            <>
              {/* Notification Bell */}
              <NotificationBell />

              {/* Post Idea CTA — desktop */}
              <Link href="/dashboard/ideas/new" className="hidden md:block">
                <Button
                  size="sm"
                  className="gap-1.5 bg-saffron text-white shadow-none hover:bg-saffron-dark"
                >
                  <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
                  Post Idea
                </Button>
              </Link>

              {/* User dropdown — desktop */}
              <div className="hidden md:block">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-saffron focus-visible:ring-offset-2"
                      aria-label="User menu"
                    >
                      {userAvatar}
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-56 border-warm-border bg-white"
                    sideOffset={8}
                  >
                    <DropdownMenuLabel className="pb-0 font-normal">
                      <div className="flex items-center gap-3 py-1">
                        <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full border border-warm-border">
                          {user?.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={user.imageUrl}
                              alt={user.fullName ?? "Profile"}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-warm-subtle text-xs font-semibold text-text-secondary">
                              {user?.firstName?.charAt(0) ?? "U"}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-[13px] font-semibold text-deep-ink">
                            {user?.fullName ?? "User"}
                          </p>
                          <p className="truncate text-[12px] text-text-muted">
                            {user?.primaryEmailAddress?.emailAddress ?? ""}
                          </p>
                        </div>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-warm-border" />
                    <DropdownMenuItem asChild>
                      <Link
                        href="/dashboard"
                        className="flex cursor-pointer items-center gap-2.5 text-[13px] text-text-secondary"
                      >
                        <LayoutDashboard className="h-4 w-4" />
                        Dashboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link
                        href={profileHref}
                        className="flex cursor-pointer items-center gap-2.5 text-[13px] text-text-secondary"
                      >
                        <User className="h-4 w-4" />
                        Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link
                        href="/dashboard/settings"
                        className="flex cursor-pointer items-center gap-2.5 text-[13px] text-text-secondary"
                      >
                        <Settings className="h-4 w-4" />
                        Settings
                      </Link>
                    </DropdownMenuItem>
                    {(dbUser?.isAdmin || dbUser?.isEmployee) && (
                      <DropdownMenuSeparator className="bg-warm-border" />
                    )}
                    {dbUser?.isAdmin && (
                      <DropdownMenuItem asChild>
                        <Link
                          href="/admin/ideas"
                          className="flex cursor-pointer items-center gap-2.5 text-[13px] text-text-secondary"
                        >
                          <Shield className="h-4 w-4" />
                          Admin Panel
                        </Link>
                      </DropdownMenuItem>
                    )}
                    {dbUser?.isEmployee && (
                      <DropdownMenuItem asChild>
                        <Link
                          href="/employee"
                          className="flex cursor-pointer items-center gap-2.5 text-[13px] text-text-secondary"
                        >
                          <ClipboardCheck className="h-4 w-4" />
                          Employee Portal
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator className="bg-warm-border" />
                    <DropdownMenuItem
                      onClick={handleSignOut}
                      className="flex cursor-pointer items-center gap-2.5 text-[13px] text-brand-red focus:text-brand-red"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </>
          ) : (
            <>
              <Link href="/sign-in">
                <Button
                  variant="ghost"
                  size="sm"
                  className="hidden text-[13px] font-medium text-text-secondary hover:text-deep-ink md:inline-flex"
                >
                  Sign In
                </Button>
              </Link>
              <Link href="/sign-up">
                <Button
                  size="sm"
                  className="gap-1.5 bg-saffron text-white shadow-none hover:bg-saffron-dark"
                >
                  Get Started
                </Button>
              </Link>
            </>
          )}

          {/* ── Mobile Hamburger ── */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <button
                className="flex items-center justify-center rounded-md p-2 text-text-secondary transition-colors hover:bg-warm-hover md:hidden"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] bg-white p-0">
              <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
              <div className="flex h-full flex-col">
                {/* Mobile header — user profile or logo */}
                <div className="border-b border-warm-border px-5 py-4">
                  {isSignedIn && user ? (
                    <Link
                      href="/dashboard"
                      className="flex items-center gap-3"
                      onClick={() => setMobileOpen(false)}
                    >
                      <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full border border-warm-border">
                        {user.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={user.imageUrl}
                            alt={user.fullName ?? "Profile"}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-warm-subtle text-sm font-semibold text-text-secondary">
                            {user.firstName?.charAt(0) ?? "U"}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-[14px] font-semibold text-deep-ink">
                          {user.fullName ?? "User"}
                        </p>
                        <p className="truncate text-[12px] text-text-muted">
                          {user.primaryEmailAddress?.emailAddress ?? ""}
                        </p>
                      </div>
                    </Link>
                  ) : (
                    <Link
                      href="/"
                      className="flex items-center gap-2"
                      onClick={() => setMobileOpen(false)}
                    >
                      <span className="font-display text-[18px] text-deep-ink">
                        Piqd
                      </span>
                    </Link>
                  )}
                </div>

                {/* Mobile nav links */}
                <div className="flex flex-col gap-0.5 px-3 py-3">
                  {NAV_LINKS.map((link) => {
                    const isActive = pathname.startsWith(link.href);
                    const Icon = link.icon;
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setMobileOpen(false)}
                        className={cn(
                          "flex items-center gap-3 rounded-md px-3 py-2.5 text-[14px] font-medium transition-colors",
                          isActive
                            ? "bg-saffron-light text-saffron"
                            : "text-text-secondary hover:bg-warm-hover hover:text-deep-ink"
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        {link.label}
                      </Link>
                    );
                  })}
                </div>

                {/* Signed-in user: dashboard links */}
                {isSignedIn && (
                  <>
                    <div className="border-t border-warm-border px-3 py-3">
                      <p className="mb-2 px-3 font-data text-[10px] font-medium uppercase tracking-widest text-text-muted">
                        Account
                      </p>
                      <Link
                        href="/dashboard"
                        onClick={() => setMobileOpen(false)}
                        className={cn(
                          "flex items-center gap-3 rounded-md px-3 py-2.5 text-[14px] font-medium transition-colors",
                          pathname === "/dashboard"
                            ? "bg-saffron-light text-saffron"
                            : "text-text-secondary hover:bg-warm-hover hover:text-deep-ink"
                        )}
                      >
                        <LayoutDashboard className="h-4 w-4" />
                        Dashboard
                      </Link>
                      <Link
                        href={profileHref}
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-3 rounded-md px-3 py-2.5 text-[14px] font-medium text-text-secondary transition-colors hover:bg-warm-hover hover:text-deep-ink"
                      >
                        <User className="h-4 w-4" />
                        Profile
                      </Link>
                      <Link
                        href="/dashboard/settings"
                        onClick={() => setMobileOpen(false)}
                        className={cn(
                          "flex items-center gap-3 rounded-md px-3 py-2.5 text-[14px] font-medium transition-colors",
                          pathname === "/dashboard/settings"
                            ? "bg-saffron-light text-saffron"
                            : "text-text-secondary hover:bg-warm-hover hover:text-deep-ink"
                        )}
                      >
                        <Settings className="h-4 w-4" />
                        Settings
                      </Link>
                      {dbUser?.isAdmin && (
                        <Link
                          href="/admin/ideas"
                          onClick={() => setMobileOpen(false)}
                          className={cn(
                            "flex items-center gap-3 rounded-md px-3 py-2.5 text-[14px] font-medium transition-colors",
                            pathname.startsWith("/admin")
                              ? "bg-saffron-light text-saffron"
                              : "text-text-secondary hover:bg-warm-hover hover:text-deep-ink"
                          )}
                        >
                          <Shield className="h-4 w-4" />
                          Admin Panel
                        </Link>
                      )}
                      {dbUser?.isEmployee && (
                        <Link
                          href="/employee"
                          onClick={() => setMobileOpen(false)}
                          className={cn(
                            "flex items-center gap-3 rounded-md px-3 py-2.5 text-[14px] font-medium transition-colors",
                            pathname.startsWith("/employee")
                              ? "bg-saffron-light text-saffron"
                              : "text-text-secondary hover:bg-warm-hover hover:text-deep-ink"
                          )}
                        >
                          <ClipboardCheck className="h-4 w-4" />
                          Employee Portal
                        </Link>
                      )}
                    </div>
                  </>
                )}

                {/* Spacer to push CTA/sign-out to bottom */}
                <div className="flex-1" />

                {/* Mobile CTA + Sign Out */}
                <div className="border-t border-warm-border px-4 py-4">
                  {isSignedIn ? (
                    <div className="flex flex-col gap-2">
                      <Link
                        href="/dashboard/ideas/new"
                        onClick={() => setMobileOpen(false)}
                      >
                        <Button className="w-full gap-1.5 bg-saffron text-white hover:bg-saffron-dark">
                          <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
                          Post Idea
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        className="w-full gap-2 text-[13px] text-text-muted hover:text-brand-red"
                        onClick={() => {
                          setMobileOpen(false);
                          handleSignOut();
                        }}
                      >
                        <LogOut className="h-4 w-4" />
                        Sign Out
                      </Button>
                    </div>
                  ) : (
                    <Link href="/sign-up" onClick={() => setMobileOpen(false)}>
                      <Button className="w-full bg-saffron text-white hover:bg-saffron-dark">
                        Get Started
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  );
}
