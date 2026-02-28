"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser, useAuth, SignInButton } from "@clerk/nextjs";
import {
  Menu,
  Bell,
  Flame,
  Search,
  Plus,
  Lightbulb,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import { NotificationBell } from "@/components/layout/notification-bell";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/explore", label: "Explore" },
  { href: "/leaderboard", label: "Leaderboard" },
] as const;

export function Navbar() {
  const pathname = usePathname();
  const { isSignedIn, user } = useUser();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Don't show navbar on onboarding
  if (pathname === "/onboarding") return null;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-warm-border bg-white/95 backdrop-blur-sm">
      <nav className="mx-auto flex h-[60px] max-w-[1440px] items-center justify-between px-4 lg:px-8">
        {/* ── Left: Logo ── */}
        <Link
          href="/"
          className="flex items-center gap-2 transition-opacity hover:opacity-80"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-saffron">
            <Lightbulb className="h-4.5 w-4.5 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-[17px] font-bold tracking-tight text-deep-ink">
            BackMyIdea
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
          {/* Search icon — desktop */}
          <Link
            href="/search"
            className="hidden rounded-md p-2 text-text-secondary transition-colors hover:bg-warm-hover hover:text-deep-ink md:flex"
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

              {/* User avatar — desktop */}
              <Link
                href="/dashboard"
                className="hidden md:block"
              >
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
              </Link>
            </>
          ) : (
            <>
              <SignInButton mode="modal">
                <Button
                  variant="ghost"
                  size="sm"
                  className="hidden text-[13px] font-medium text-text-secondary hover:text-deep-ink md:inline-flex"
                >
                  Sign In
                </Button>
              </SignInButton>
              <SignInButton mode="modal">
                <Button
                  size="sm"
                  className="gap-1.5 bg-saffron text-white shadow-none hover:bg-saffron-dark"
                >
                  Get Started
                </Button>
              </SignInButton>
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
              <div className="flex flex-col">
                {/* Mobile header */}
                <div className="border-b border-warm-border px-5 py-4">
                  <Link
                    href="/"
                    className="flex items-center gap-2"
                    onClick={() => setMobileOpen(false)}
                  >
                    <div className="flex h-7 w-7 items-center justify-center rounded-md bg-saffron">
                      <Lightbulb
                        className="h-3.5 w-3.5 text-white"
                        strokeWidth={2.5}
                      />
                    </div>
                    <span className="text-[15px] font-bold text-deep-ink">
                      BackMyIdea
                    </span>
                  </Link>
                </div>

                {/* Mobile nav links */}
                <div className="flex flex-col gap-0.5 px-3 py-3">
                  {NAV_LINKS.map((link) => {
                    const isActive = pathname.startsWith(link.href);
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setMobileOpen(false)}
                        className={cn(
                          "rounded-md px-3 py-2.5 text-[14px] font-medium transition-colors",
                          isActive
                            ? "bg-saffron-light text-saffron"
                            : "text-text-secondary hover:bg-warm-hover hover:text-deep-ink"
                        )}
                      >
                        {link.label}
                      </Link>
                    );
                  })}
                  <Link
                    href="/search"
                    onClick={() => setMobileOpen(false)}
                    className="rounded-md px-3 py-2.5 text-[14px] font-medium text-text-secondary transition-colors hover:bg-warm-hover hover:text-deep-ink"
                  >
                    Search
                  </Link>
                </div>

                {/* Mobile CTA */}
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
                      <Link
                        href="/dashboard"
                        onClick={() => setMobileOpen(false)}
                      >
                        <Button
                          variant="outline"
                          className="w-full border-warm-border text-text-secondary"
                        >
                          Dashboard
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <SignInButton mode="modal">
                      <Button className="w-full bg-saffron text-white hover:bg-saffron-dark">
                        Get Started
                      </Button>
                    </SignInButton>
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
